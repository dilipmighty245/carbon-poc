package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
)

func TestLineageCorrectionUsesTenantAndSurvivesCacheReset(t *testing.T) {
	previous := nexus.GetNexusClient()
	nexus.SetNexusClient(nexusclient.NewFakeClient())
	t.Cleanup(func() { nexus.SetNexusClient(previous) })
	handler := NewLineageHandler()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/lineage/correct-input", bytes.NewBufferString(`{"input_node_id":"NODE_IN_SUP_409","new_value":0.72,"reason":"Revised supplier declaration"}`))
	request.Header.Set("X-Tenant-ID", "tenant-lineage-http")
	response := httptest.NewRecorder()
	handler.HandleCorrectInput(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("correction failed: %d %s", response.Code, response.Body.String())
	}
	handler.engine.Reset()
	for _, tc := range []struct {
		tenant   string
		expected bool
	}{{"tenant-lineage-http", true}, {"tenant-lineage-other", false}} {
		request = httptest.NewRequest(http.MethodGet, "/api/v1/lineage/trace/PASS-2026-981-v1.0", nil)
		request.Header.Set("X-Tenant-ID", tc.tenant)
		response = httptest.NewRecorder()
		handler.HandleTraceLineage(response, request)
		if response.Code != http.StatusOK {
			t.Fatalf("trace failed: %s", response.Body.String())
		}
		var dag nexus.LineageDAG
		if err := json.Unmarshal(response.Body.Bytes(), &dag); err != nil {
			t.Fatal(err)
		}
		found := false
		for _, node := range dag.Nodes {
			if node.NodeID == "NODE_CALC_V1_1" {
				found = true
			}
		}
		if found != tc.expected {
			t.Fatalf("tenant %s: correction visible=%v, expected %v", tc.tenant, found, tc.expected)
		}
	}
}
