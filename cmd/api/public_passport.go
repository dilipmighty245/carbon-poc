package main

import (
	"encoding/json"
	"net/http"
	"saurient-platform/internal/nexus"
	"strings"
)

func (s *VerificationServer) handlePublicPassport(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Access-Control-Allow-Origin", getEnv("ALLOWED_ORIGIN", "*"))
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/public/passport-records/")
	if id == "" {
		http.NotFound(w, r)
		return
	}
	node, err := nexus.GetPassportNode(r.Context(), s.getNexusClient(), id)
	if err != nil || node == nil || !nexus.IsPassportPublic(node.Spec.VerificationStatus) {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(nexus.BuildRichPassportResponse(nexus.CarbonPassportModelFromNode(node)))
}
