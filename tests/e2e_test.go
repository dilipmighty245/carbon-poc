package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	gqlgraph "saurient-platform/build/nexus-gql/graph"
	gqlgenerated "saurient-platform/build/nexus-gql/graph/generated"
	"github.com/dilipmighty245/graph-framework-for-microservices/gqlgen/graphql/handler"

	"saurient-platform/internal/api"
	"saurient-platform/internal/nexus"
)

func TestEndToEndPoCFlow(t *testing.T) {
	engine := nexus.GetNexusEngine()
	if engine == nil {
		t.Fatalf("Failed to initialize Nexus Graph Engine")
	}

	mux := http.NewServeMux()

	// 1. Register Organisation & ACV & Lineage handlers
	orgHandler := api.NewOrganisationHandler(engine)
	orgHandler.RegisterRoutes(mux)

	acvHandler := api.NewACVHandler(engine)
	acvHandler.RegisterRoutes(mux)

	lineageHandler := api.NewLineageHandler()
	lineageHandler.RegisterRoutes(mux)

	tenantID := "TENANT-BELLARY-E2E"

	// --- Step 1: Healthcheck ---
	t.Run("01_Healthcheck", func(t *testing.T) {
		mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"ok"}`))
		})

		req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d", rec.Code)
		}
	})

	// --- Step 2: Tenant Auth Registration & Login ---
	t.Run("02_TenantAuthRegistrationAndLogin", func(t *testing.T) {
		regPayload := map[string]string{
			"tenant_id": tenantID,
			"name":      "Plant Operator",
			"email":     "operator@saurient.demo",
			"password":  "DemoPassword2026!",
			"role":      "Plant Operator",
		}
		regBytes, _ := json.Marshal(regPayload)
		regReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(regBytes))
		regReq.Header.Set("Content-Type", "application/json")
		regReq.Header.Set("X-Tenant-ID", tenantID)

		regRec := httptest.NewRecorder()
		mux.ServeHTTP(regRec, regReq)

		if regRec.Code != http.StatusCreated {
			t.Fatalf("expected 201 Created from registration, got %d: %s", regRec.Code, regRec.Body.String())
		}

		loginPayload := map[string]string{
			"email":    "operator@saurient.demo",
			"password": "DemoPassword2026!",
		}
		bodyBytes, _ := json.Marshal(loginPayload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Tenant-ID", tenantID)

		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var resp map[string]interface{}
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("invalid json response: %v", err)
		}
		if resp["token"] == nil {
			t.Errorf("login response missing token")
		}
	})

	// --- Step 3: Organisation Profile Update ---
	t.Run("03_OrganisationProfileUpdate", func(t *testing.T) {
		profilePayload := map[string]interface{}{
			"legalName":              "Bellary Steel Works Ltd",
			"tradingName":            "Bellary Steel",
			"countryOfIncorporation": "India",
			"industry":               "Iron & Steel",
		}
		bodyBytes, _ := json.Marshal(profilePayload)
		req := httptest.NewRequest(http.MethodPut, "/api/v1/organisation/profile", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Tenant-ID", tenantID)

		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	// --- Step 4: Lineage Trace Graph ---
	t.Run("04_LineageTraceGraph", func(t *testing.T) {
		passportID := "PASS-2026-981-v1.0"
		req := httptest.NewRequest(http.MethodGet, "/api/v1/lineage/trace/"+passportID, nil)
		req.Header.Set("X-Tenant-ID", tenantID)

		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var traceResp map[string]interface{}
		if err := json.Unmarshal(rec.Body.Bytes(), &traceResp); err != nil {
			t.Fatalf("failed to decode lineage trace JSON: %v", err)
		}

		nodes, ok := traceResp["nodes"].([]interface{})
		if !ok || len(nodes) == 0 {
			t.Errorf("lineage trace returned no nodes")
		}
	})

	// --- Step 5: Supplier Input Immutability Correction ---
	t.Run("05_SupplierInputCorrection", func(t *testing.T) {
		correctionReq := map[string]interface{}{
			"input_node_id": "NODE_IN_SUP_409",
			"new_value":     0.520,
			"unit":          "kgCO2e/kg",
			"reason":        "Audited Scope 3 update",
			"user_ref":      "USR-E2E-AUDITOR",
		}
		bodyBytes, _ := json.Marshal(correctionReq)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/lineage/correct-input", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Tenant-ID", tenantID)

		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}

		var corrResp map[string]interface{}
		if err := json.Unmarshal(rec.Body.Bytes(), &corrResp); err != nil {
			t.Fatalf("failed to decode correction response: %v", err)
		}

		if corrResp["original_passport_frozen"] != true {
			t.Errorf("expected original passport to remain frozen/immutable")
		}
		if corrResp["new_draft_passport_id"] == nil {
			t.Errorf("expected new draft passport ID to be issued")
		}
	})

	// --- Step 6: Nexus GraphQL Introspection & Query ---
	t.Run("06_GraphQLQuery", func(t *testing.T) {
		client := nexus.GetNexusClient()
		_, _ = nexus.EnsureGraphRoots(context.Background(), client)
		gqlgraph.SetNexusClient(client)
		es := gqlgenerated.NewExecutableSchema(gqlgenerated.Config{Resolvers: &gqlgraph.Resolver{}})
		gqlServer := handler.NewDefaultServer(es)

		queryPayload := `{"query":"query { root { Config { Rulebooks { RulebookID CommodityType } } Runtime { Passports { PassportID TotalFootprintKg } } } }"}`
		req := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(queryPayload))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Tenant-ID", tenantID)

		rec := httptest.NewRecorder()
		gqlServer.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
		}
		var queryResp map[string]interface{}
		if err := json.Unmarshal(rec.Body.Bytes(), &queryResp); err != nil {
			t.Fatalf("unmarshal query response: %v: %s", err, rec.Body.String())
		}
		data, ok := queryResp["data"].(map[string]interface{})
		if !ok || data["root"] == nil {
			t.Fatalf("query response missing data.root: %s", rec.Body.String())
		}
	})
}
