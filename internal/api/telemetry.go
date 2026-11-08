package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"saurient-platform/internal/telemetry"
)

// telemetryTenant derives access from signed claims, never a caller-selected
// query parameter. Existing X-Tenant-ID is checked only for mismatches.
func telemetryTenant(w http.ResponseWriter, r *http.Request, write bool) (string, bool) {
	if !strings.HasPrefix(r.Header.Get("Authorization"), "Bearer ") {
		writeJSONError(w, "sign in to access facility telemetry", http.StatusUnauthorized)
		return "", false
	}
	claims, err := ValidateToken(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "))
	if err != nil {
		writeJSONError(w, "sign in to access facility telemetry", http.StatusUnauthorized)
		return "", false
	}
	if header := r.Header.Get("X-Tenant-ID"); header != "" && header != claims.TenantID {
		writeJSONError(w, "tenant does not match signed-in organisation", http.StatusForbidden)
		return "", false
	}
	role := strings.ToLower(strings.ReplaceAll(claims.Role, " ", ""))
	if write && role != "organisationowner" && role != "organisationadmin" && role != "facilitymanager" {
		writeJSONError(w, "organisation owner, admin or facility manager required", http.StatusForbidden)
		return "", false
	}
	return claims.TenantID, true
}

type TelemetryHandler struct {
	Store      *telemetry.Store
	Manager    *telemetry.Manager
	StaleAfter time.Duration
}

func (h *TelemetryHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/telemetry/latest", h.handleRead)
	mux.HandleFunc("/api/v1/telemetry/history", h.handleRead)
	mux.HandleFunc("/api/v1/telemetry/status", h.handleRead)
}

func (h *TelemetryHandler) handleRead(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	tenant, ok := telemetryTenant(w, r, false)
	if !ok {
		return
	}
	if h.Store == nil {
		writeJSONError(w, "telemetry database is not configured", http.StatusServiceUnavailable)
		return
	}
	facility := r.URL.Query().Get("facility_id")
	if facility == "" {
		writeJSONError(w, "facility_id is required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	source, err := h.Store.Source(ctx, tenant, facility)
	archived := errors.Is(err, sql.ErrNoRows) && strings.HasSuffix(r.URL.Path, "/history")
	if errors.Is(err, sql.ErrNoRows) && !archived {
		writeJSONError(w, "no telemetry device configured for this facility", http.StatusNotFound)
		return
	}
	if err != nil && !archived {
		writeJSONError(w, "telemetry storage unavailable", http.StatusServiceUnavailable)
		return
	}
	if strings.HasSuffix(r.URL.Path, "/status") {
		status := telemetry.Status{State: "pending"}
		if h.Manager != nil {
			status = h.Manager.Status(source.ID)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"source": source, "subscription": status})
		return
	}
	from := time.Time{}
	to := time.Now().UTC()
	limit := 1
	if strings.HasSuffix(r.URL.Path, "/history") {
		from = to.Add(-24 * time.Hour)
		limit = 100
		if v := r.URL.Query().Get("limit"); v != "" {
			limit, err = strconv.Atoi(v)
			if err != nil || limit < 1 || limit > 1000 {
				writeJSONError(w, "limit must be 1..1000", http.StatusBadRequest)
				return
			}
		}
	}
	for key, dest := range map[string]*time.Time{"from": &from, "to": &to} {
		if v := r.URL.Query().Get(key); v != "" {
			*dest, err = time.Parse(time.RFC3339Nano, v)
			if err != nil {
				writeJSONError(w, "from/to must be RFC3339 timestamps", http.StatusBadRequest)
				return
			}
		}
	}
	if from.After(to) {
		writeJSONError(w, "from must not be after to", http.StatusBadRequest)
		return
	}
	readings, err := h.Store.History(ctx, tenant, facility, r.URL.Query().Get("meter_id"), from, to, limit)
	if err != nil {
		writeJSONError(w, "telemetry storage unavailable", http.StatusServiceUnavailable)
		return
	}
	staleAfter := h.StaleAfter
	if staleAfter <= 0 {
		staleAfter = 2 * time.Minute
	}
	status := "waiting"
	if len(readings) > 0 {
		status = "received"
		if readings[0].Retained {
			status = "retained"
		}
		if time.Since(readings[0].ReceivedAt) > staleAfter {
			status = "stale"
		}
		if readings[0].ParseError != "" {
			status = "invalid"
		}
	}
	subscription := telemetry.Status{State: "pending"}
	if archived {
		subscription.State = "archived"
	} else if h.Manager != nil {
		subscription = h.Manager.Status(source.ID)
	}
	_ = json.NewEncoder(w).Encode(map[string]any{"status": status, "timestamp_basis": "server_received_at", "stale_after_seconds": staleAfter.Seconds(), "readings": readings, "subscription": subscription})
}
