package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"saurient-platform/internal/nexus"
)

type LineageHandler struct {
	engine *nexus.NexusGraphEngine
}

func NewLineageHandler() *LineageHandler {
	return &LineageHandler{
		engine: nexus.GetNexusEngine(),
	}
}

func (h *LineageHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/lineage/trace/", h.HandleTraceLineage)
	mux.HandleFunc("/api/v1/lineage/correct-input", h.HandleCorrectInput)
}

// GET /api/v1/lineage/trace/{passport_id}
func (h *LineageHandler) HandleTraceLineage(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	passportID := parts[len(parts)-1]
	if passportID == "" || passportID == "trace" {
		passportID = "PASS-2026-981-v1.0"
	}

	dag, err := h.engine.GetLineageDAG(r.Context(), passportID)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dag)
}

// POST /api/v1/lineage/correct-input
func (h *LineageHandler) HandleCorrectInput(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req nexus.InputCorrectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.InputNodeID == "" {
		req.InputNodeID = "NODE_IN_SUP_409"
	}

	result, err := h.engine.CorrectSupplierInput(r.Context(), req)
	if err != nil {
		writeJSONError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}
