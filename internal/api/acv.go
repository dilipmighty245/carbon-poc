package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"saurient-platform/internal/nexus"
	"saurient-platform/internal/tenant"
)

type ACVHandler struct {
	engine *nexus.NexusGraphEngine
}

func NewACVHandler(engine *nexus.NexusGraphEngine) *ACVHandler {
	if engine == nil {
		engine = nexus.GetNexusEngine()
	}
	return &ACVHandler{engine: engine}
}

func (h *ACVHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/acv/agencies", h.HandleAgencies)
	mux.HandleFunc("/api/v1/acv/engagements", h.HandleEngagements)
	mux.HandleFunc("/api/v1/acv/engagements/", h.HandleEngagementSubresources)
	mux.HandleFunc("/api/v1/acv/coi", h.HandleCOIDeclarations)
	mux.HandleFunc("/api/v1/acv/findings", h.HandleFindings)
	mux.HandleFunc("/api/v1/acv/signoff", h.HandleSignoff)
	mux.HandleFunc("/api/v1/public/passports/", h.HandlePublicSummary)
}

// 1. /api/v1/acv/agencies
func (h *ACVHandler) HandleAgencies(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		agencies, err := h.engine.ListAgencies(ctx)
		if err != nil {
			writeJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if agencies == nil {
			agencies = []*nexus.AgencyModel{}
		}
		_ = json.NewEncoder(w).Encode(agencies)

	case http.MethodPost:
		var req nexus.AgencyModel
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		if req.AgencyID == "" {
			req.AgencyID = "agency_" + uuid.New().String()[:8]
		}
		if req.AccreditationStatus == "" {
			req.AccreditationStatus = "Accredited"
		}
		if req.AccreditationExpiry.IsZero() {
			req.AccreditationExpiry = time.Now().AddDate(2, 0, 0)
		}

		if err := h.engine.CreateAgency(ctx, &req); err != nil {
			writeJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(req)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 2. /api/v1/acv/engagements
func (h *ACVHandler) HandleEngagements(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		engagements, err := h.engine.ListEngagements(ctx)
		if err != nil {
			writeJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if engagements == nil {
			engagements = []*nexus.VerificationEngagementModel{}
		}
		_ = json.NewEncoder(w).Encode(engagements)

	case http.MethodPost:
		var req nexus.VerificationEngagementModel
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		if req.EngagementID == "" {
			req.EngagementID = "eng_" + uuid.New().String()[:8]
		}
		if req.Status == "" {
			req.Status = "Proposed"
		}

		if err := h.engine.CreateEngagement(ctx, &req); err != nil {
			writeJSONError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(req)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 3. /api/v1/acv/engagements/{id}/team, /coi, /findings
func (h *ACVHandler) HandleEngagementSubresources(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path
	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	if strings.HasSuffix(path, "/team") {
		if r.Method == http.MethodPost {
			var member nexus.EngagementTeamMemberModel
			if err := json.NewDecoder(r.Body).Decode(&member); err != nil {
				writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
				return
			}
			if member.MemberID == "" {
				member.MemberID = "mem_" + uuid.New().String()[:8]
			}
			if err := h.engine.AssignTeamMember(ctx, &member); err != nil {
				writeJSONError(w, err.Error(), http.StatusConflict)
				return
			}
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(member)
			return
		}
	} else if strings.HasSuffix(path, "/findings") {
		parts := strings.Split(strings.TrimPrefix(path, "/api/v1/acv/engagements/"), "/")
		engagementID := parts[0]
		if r.Method == http.MethodGet {
			findings, err := h.engine.ListFindings(ctx, engagementID)
			if err != nil {
				writeJSONError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			if findings == nil {
				findings = []*nexus.FindingModel{}
			}
			_ = json.NewEncoder(w).Encode(findings)
			return
		}
	}

	writeJSONError(w, "endpoint not found", http.StatusNotFound)
}

// 4. /api/v1/acv/coi
func (h *ACVHandler) HandleCOIDeclarations(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	var req nexus.COIDeclarationModel
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	if req.DeclarationID == "" {
		req.DeclarationID = "coi_" + uuid.New().String()[:8]
	}

	if err := h.engine.SubmitCOIDeclaration(ctx, &req); err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(req)
}

// 5. /api/v1/acv/findings
func (h *ACVHandler) HandleFindings(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	var req nexus.FindingModel
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	if req.FindingID == "" {
		req.FindingID = "fnd_" + uuid.New().String()[:8]
	}

	if err := h.engine.CreateFinding(ctx, &req); err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(req)
}

// 6. /api/v1/acv/signoff (ACV08 Submission Freeze)
func (h *ACVHandler) HandleSignoff(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	var req nexus.ReviewSignoffModel
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}
	if req.SignoffID == "" {
		req.SignoffID = "sign_" + uuid.New().String()[:8]
	}

	frozenBy := getTenantID(r)
	if err := h.engine.SignoffEngagement(ctx, &req, frozenBy); err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(req)
}

// 7. GET /api/v1/public/passports/{passport_id}
func (h *ACVHandler) HandlePublicSummary(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	passportID := strings.TrimPrefix(r.URL.Path, "/api/v1/public/passports/")
	if passportID == "" {
		writeJSONError(w, "passport_id is required", http.StatusBadRequest)
		return
	}

	ctx := tenant.WithTenant(r.Context(), getTenantID(r))
	summary, err := h.engine.GetPublicPassportSummary(ctx, passportID)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusNotFound)
		return
	}

	_ = json.NewEncoder(w).Encode(summary)
}
