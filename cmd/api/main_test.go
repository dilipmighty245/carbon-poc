package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/tenant"
	gqlgraph "saurient-platform/build/nexus-gql/graph"
	gqlgenerated "saurient-platform/build/nexus-gql/graph/generated"
	"github.com/vmware-tanzu/graph-framework-for-microservices/gqlgen/graphql/handler"
)

func newTestServer(t *testing.T) *VerificationServer {
	t.Helper()
	client := nexus.GetNexusClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	nEngine := nexus.GetNexusEngine()
	celEng := engine.NewCELEngine()
	rec := nexus.NewProductReconcilerWithClient(client, nEngine, celEng)

	gqlgraph.SetNexusClient(client)
	es := gqlgenerated.NewExecutableSchema(gqlgenerated.Config{Resolvers: &gqlgraph.Resolver{}})
	gqlServer := handler.NewDefaultServer(es)

	return &VerificationServer{
		nexusClient: client,
		nexusEngine: nEngine,
		reconciler:  rec,
		gqlHandler:  gqlServer,
	}
}

// TestSanitiseK8sName verifies the helper produces valid k8s resource names.
func TestSanitiseK8sName(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"batch-001", "product-batch-001"},
		{"Batch_ABC 99", "product-batch-abc-99"},
		{"UPPER__CASE", "product-upper-case"},
		{"has--double--hyphens", "product-has-double-hyphens"},
		// truncation: 56-char input → capped at 55 chars (last char dropped)
		{"aaaaabbbbbcccccdddddeeeeefffff00000111112222233333444445", "product-aaaaabbbbbcccccdddddeeeeefffff0000011111222223333344444"},
		// trailing hyphen after truncation: Trim must run AFTER truncate
		{"aaaaabbbbbcccccdddddeeeeefffff0000011111222223333344444-x", "product-aaaaabbbbbcccccdddddeeeeefffff0000011111222223333344444"},
		// all-invalid chars collapse to a single hyphen → Trim → empty → fallback
		{"---", "product-default"},
	}
	for _, tc := range cases {
		got := sanitiseK8sName(tc.input)
		if got != tc.want {
			t.Errorf("sanitiseK8sName(%q) = %q; want %q", tc.input, got, tc.want)
		}
	}
}

// TestHandleCreateProduct_InvalidJSON expects 400 for malformed JSON.
func TestHandleCreateProduct_InvalidJSON(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(`not-json`))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

// TestHandleCreateProduct_MissingTenantID expects 400 when tenant_id is absent.
func TestHandleCreateProduct_MissingTenantID(t *testing.T) {
	srv := newTestServer(t)
	body := `{"commodity_type":"Cement","batch_id":"b-001"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

// TestHandleCreateProduct_MissingCommodityType expects 400 when commodity_type is absent.
func TestHandleCreateProduct_MissingCommodityType(t *testing.T) {
	srv := newTestServer(t)
	body := `{"tenant_id":"t-001","batch_id":"b-001"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

// TestHandleCreateProduct_ValidInput expects 201 and a product name in response.
func TestHandleCreateProduct_ValidInput(t *testing.T) {
	srv := newTestServer(t)
	payload := map[string]interface{}{
		"tenant_id":        "t-001",
		"facility_id":      "fac-001",
		"batch_id":         "batch-001",
		"product_name":     "Cement Alpha",
		"commodity_type":   "Cement",
		"activity_data_raw": `{"fuel_liters":100}`,
		"rulebook_ref":     map[string]string{"name": "cement-rulebook", "namespace": "default"},
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp["name"] == nil {
		t.Error("response missing 'name' field")
	}
	if resp["tenant_id"] != "t-001" {
		t.Errorf("expected tenant_id t-001, got %v", resp["tenant_id"])
	}
	if resp["status"] != "Pending" {
		t.Errorf("expected status Pending, got %v", resp["status"])
	}
}

// TestHandleCreateProduct_TenantIDFromHeader uses X-Tenant-ID header fallback.
func TestHandleCreateProduct_TenantIDFromHeader(t *testing.T) {
	srv := newTestServer(t)
	body := `{"commodity_type":"Cocoa","batch_id":"b-002"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant-ID", "header-tenant")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 from X-Tenant-ID, got %d: %s", rr.Code, rr.Body.String())
	}
}

// TestHandleProducts_MethodNotAllowed expects 405 for unsupported method PATCH.
func TestHandleProducts_MethodNotAllowed(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/products", nil)
	rr := httptest.NewRecorder()
	srv.handleProducts(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", rr.Code)
	}
}

// TestHandleProducts_DeleteValid expects 200 for DELETE /api/v1/products/batch-001.
func TestHandleProducts_DeleteValid(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/products/batch-001", nil)
	req.Header.Set("X-Tenant-ID", "org_saurient_demo")
	rr := httptest.NewRecorder()
	srv.handleProducts(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}

// TestHandleGetProduct_MissingName expects 400 when product name is empty.
func TestHandleGetProduct_MissingName(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products/", nil)
	rr := httptest.NewRecorder()
	srv.handleGetProduct(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

// TestHandleCreateRule_ValidInput expects 201 for valid rulebook creation.
func TestHandleCreateRule_ValidInput(t *testing.T) {
	srv := newTestServer(t)
	payload := map[string]interface{}{
		"name":           "cement-rulebook-2026",
		"commodity_type": "Cement",
		"version":        "2026.1",
		"scope_1_formula": "(fuel_liters * fuel_ef)",
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/rules", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateRule(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

// TestHandleListRules expects 200 and a JSON list of calculation rulebooks.
func TestHandleListRules(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/rules", nil)
	rr := httptest.NewRecorder()
	srv.handleRules(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var rules []RulebookItemResponse
	if err := json.NewDecoder(rr.Body).Decode(&rules); err != nil {
		t.Fatalf("failed to decode rules JSON: %v", err)
	}
	if len(rules) == 0 {
		t.Errorf("expected non-empty rules list")
	}
}

// TestHandleCreateProduct_DetailedInput tests creating a product using rich batch_data, activity_data, and telemetry_context.
func TestHandleCreateProduct_DetailedInput(t *testing.T) {
	srv := newTestServer(t)
	body := `{
	  "tenant_id": "org_saurient_demo",
	  "batch_data": {
	    "product_name": "Cocoa Butter",
	    "commodity": "Cocoa",
	    "batch_id": "CB-2024-001",
	    "production_date": "2024-03-12T00:00:00Z",
	    "facility_name": "Tema Processing Plant",
	    "facility_location": "Tema, Ghana",
	    "batch_size_quantity": 1000,
	    "unit_of_measure": "kg",
	    "export_market": "European Union (EU)"
	  },
	  "activity_data": {
	    "scope_1_direct": {
	      "fuel_type": "Diesel",
	      "fuel_consumed_liters": 32.7,
	      "data_source": "Sattric_Fuel_Meter_01"
	    },
	    "scope_2_indirect": {
	      "electricity_consumed_kwh": 125.4,
	      "data_source": "Sattric_Energy_Meter_Main"
	    },
	    "scope_3_upstream": {
	      "bill_of_materials": [
	        {
	          "material_name": "Raw Cocoa Beans",
	          "supplier_name": "Asunafo Farmers Cooperative",
	          "quantity": 1200,
	          "unit": "kg"
	        },
	        {
	          "material_name": "Water",
	          "quantity": 500,
	          "unit": "L"
	        }
	      ],
	      "packaging": {
	        "packaging_type": "Jute Bags",
	        "quantity": 16,
	        "capacity_per_unit": "60 kg"
	      },
	      "logistics": {
	        "transport_mode": "Truck",
	        "route_origin": "Asunafo",
	        "route_destination": "Tema"
	      }
	    }
	  },
	  "telemetry_context": {
	    "average_temperature_c": 28.3,
	    "average_humidity_percent": 64
	  }
	}`

	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp["batch_id"] != "CB-2024-001" {
		t.Errorf("expected batch_id CB-2024-001, got %v", resp["batch_id"])
	}
	if resp["commodity_type"] != "Cocoa" {
		t.Errorf("expected commodity_type Cocoa, got %v", resp["commodity_type"])
	}
	if resp["product_name"] != "Cocoa Butter" {
		t.Errorf("expected product_name Cocoa Butter, got %v", resp["product_name"])
	}
}

// TestHandleGetPassport_NotFound checks 404 when passport is not found.
func TestHandleGetPassport_NotFound(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/non-existent-passport-id", nil)
	rr := httptest.NewRecorder()
	srv.handleGetPassport(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

// TestHandleGetPassport_MissingPassportID returns passport list when passport_id path param is empty.
func TestHandleGetPassport_MissingPassportID(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/", nil)
	rr := httptest.NewRecorder()
	srv.handleGetPassport(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}

// TestHandleGetPassport_EngineUnavailable expects 503 when nexus engine is unavailable.
func TestHandleGetPassport_EngineUnavailable(t *testing.T) {
	srv := &VerificationServer{} // no nexusEngine
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/some-id", nil)
	req.Header.Set("X-Tenant-ID", "t-001")
	rr := httptest.NewRecorder()
	srv.handleGetPassport(rr, req)
	if rr.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", rr.Code)
	}
}

// TestHandleGraphQL_IntrospectionAndQuery tests GraphQL Playground GET, Introspection POST, and dynamic Query execution.
func TestHandleGraphQL_IntrospectionAndQuery(t *testing.T) {
	srv := newTestServer(t)

	// 1. GET without query -> Playground HTML
	reqGet := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	rrGet := httptest.NewRecorder()
	srv.handleGraphQL(rrGet, reqGet)
	if rrGet.Code != http.StatusOK {
		t.Errorf("expected 200 GET playground, got %d", rrGet.Code)
	}
	if !bytes.Contains(rrGet.Body.Bytes(), []byte("GraphQLPlayground")) && !bytes.Contains(rrGet.Body.Bytes(), []byte("GraphQL")) {
		t.Errorf("playground response missing 'GraphQL' string")
	}

	// 2. Introspection Query POST
	introspectionPayload := `{"query":"query IntrospectionQuery { __schema { queryType { name } } }"}`
	reqIntro := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(introspectionPayload))
	reqIntro.Header.Set("Content-Type", "application/json")
	rrIntro := httptest.NewRecorder()
	srv.handleGraphQL(rrIntro, reqIntro)
	if rrIntro.Code != http.StatusOK {
		t.Errorf("expected 200 Introspection, got %d", rrIntro.Code)
	}
	var introResp map[string]interface{}
	if err := json.Unmarshal(rrIntro.Body.Bytes(), &introResp); err != nil {
		t.Fatalf("unmarshal introspection response: %v", err)
	}
	if introResp["data"] == nil {
		t.Error("introspection response missing 'data'")
	}

	// 3. Dynamic Query Execution POST via Compiler-Generated Nexus GraphQL Server
	queryPayload := `{"query":"query { root { Config { Rulebooks { RulebookID CommodityType } } Runtime { Passports { PassportID TotalFootprintKg } } } }"}`
	reqQuery := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(queryPayload))
	reqQuery.Header.Set("Content-Type", "application/json")
	reqQuery.Header.Set("X-Tenant-ID", "org_saurient_demo")
	rrQuery := httptest.NewRecorder()
	srv.handleGraphQL(rrQuery, reqQuery)
	if rrQuery.Code != http.StatusOK {
		t.Errorf("expected 200 Query execution, got %d: %s", rrQuery.Code, rrQuery.Body.String())
	}
	var queryResp map[string]interface{}
	if err := json.Unmarshal(rrQuery.Body.Bytes(), &queryResp); err != nil {
		t.Fatalf("unmarshal query response: %v: %s", err, rrQuery.Body.String())
	}
	data, ok := queryResp["data"].(map[string]interface{})
	if !ok || data["root"] == nil {
		t.Fatalf("query response missing data.root: %s", rrQuery.Body.String())
	}
}

// TestHandleCreateProduct_AsynchronousReconciliation verifies that handleCreateProduct
// creates a Product node with status "Pending" immediately, and the background ProductReconciler
// receives the event and transitions the product to "Calculated", issuing a CarbonPassport.
func TestHandleCreateProduct_AsynchronousReconciliation(t *testing.T) {
	client := nexus.GetNexusClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	eng := nexus.GetNexusEngine()
	celEng := engine.NewCELEngine()
	rec := nexus.NewProductReconcilerWithClient(client, eng, celEng)
	rec.SetSweepPeriod(50 * time.Millisecond)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rec.Start(ctx)
	defer rec.Stop()

	srv := &VerificationServer{
		nexusClient: client,
		nexusEngine: eng,
		reconciler:  rec,
	}

	payload := map[string]interface{}{
		"tenant_id":         "t-async-001",
		"facility_id":       "fac-async-001",
		"batch_id":          "batch-async-001",
		"product_name":      "Async Steel Ingot",
		"commodity_type":    "Steel",
		"activity_data_raw": `{"fuel_consumed_liters":1200,"electricity_consumed_kwh":4000,"raw_material_kg":1000,"transport_km":50}`,
	}
	b, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.handleCreateProduct(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	// Verify HTTP response was immediate and status is Pending
	var resp map[string]interface{}
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp["status"] != "Pending" {
		t.Errorf("expected immediate HTTP response status 'Pending', got %v", resp["status"])
	}

	// Wait for asynchronous reconciler to process the product event
	tenantCtx := tenant.WithTenant(context.Background(), "t-async-001")
	var product *nexus.ProductModel
	var err error
	for i := 0; i < 60; i++ {
		time.Sleep(50 * time.Millisecond)
		product, err = eng.GetProduct(tenantCtx, "batch-async-001")
		if err == nil && (product.Phase == "Draft" || product.Phase == "Calculated") {
			break
		}
	}

	if product == nil || (product.Phase != "Draft" && product.Phase != "Calculated") {
		t.Fatalf("product failed to asynchronously reconcile to Draft within timeout, current phase: %v", product.Phase)
	}
	if product.PassportID == "" {
		t.Errorf("expected passport_id to be populated after reconciliation")
	}
	if product.TotalFootprintKg <= 0 {
		t.Errorf("expected positive total footprint, got %f", product.TotalFootprintKg)
	}

	// Verify passport in Nexus
	passport, err := eng.GetPassportByID(tenantCtx, product.PassportID)
	if err != nil || passport == nil {
		t.Fatalf("expected to find generated carbon passport %s in nexus: %v", product.PassportID, err)
	}
	if passport.TotalFootprintKg != product.TotalFootprintKg {
		t.Errorf("passport footprint mismatch: %f vs %f", passport.TotalFootprintKg, product.TotalFootprintKg)
	}
}

// TestPassportLifecycle_FullFlowAndSegregationOfDuties exercises the full legal lifecycle:
// Draft -> Submitted -> CorrectionsRequired -> Submitted -> Verified (verifier only) -> Issued -> SubmittedToAgency
// and asserts that Segregation of Duties is enforced.
func TestPassportLifecycle_FullFlowAndSegregationOfDuties(t *testing.T) {
	client := nexus.GetNexusClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	eng := nexus.GetNexusEngine()
	celEng := engine.NewCELEngine()
	rec := nexus.NewProductReconcilerWithClient(client, eng, celEng)
	rec.SetSweepPeriod(50 * time.Millisecond)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rec.Start(ctx)
	defer rec.Stop()

	srv := &VerificationServer{
		nexusClient: client,
		nexusEngine: eng,
		reconciler:  rec,
	}

	// 1. Create a product batch
	batchID := "batch-lifecycle-001"
	createBody := fmt.Sprintf(`{
		"tenant_id": "org_lifecycle_test",
		"facility_id": "FAC-GH-001",
		"batch_id": "%s",
		"product_name": "Premium Cocoa Butter",
		"commodity_type": "Cocoa",
		"activity_data": {
			"fuel_consumed_liters": 500,
			"electricity_consumed_kwh": 1200
		}
	}`, batchID)

	reqCreate := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(createBody))
	reqCreate.Header.Set("Content-Type", "application/json")
	rrCreate := httptest.NewRecorder()
	srv.handleCreateProduct(rrCreate, reqCreate)
	if rrCreate.Code != http.StatusCreated {
		t.Fatalf("create product failed: %d: %s", rrCreate.Code, rrCreate.Body.String())
	}

	// Wait for async reconciliation to create draft passport
	var passportID string
	var pNode *nexus_client.RuntimeCarbonPassport
	nClient := srv.getNexusClient()
	for i := 0; i < 30; i++ {
		time.Sleep(50 * time.Millisecond)
		node, err := nexus.GetPassportNodeByBatchID(context.Background(), nClient, batchID)
		if err == nil && node != nil {
			pNode = node
			passportID = node.DisplayName()
			break
		}
	}
	if pNode == nil || passportID == "" {
		t.Fatalf("timed out waiting for draft passport creation for batch %s", batchID)
	}

	// Verify Initial Status is Draft
	if pNode.Spec.VerificationStatus != "Draft" {
		t.Errorf("expected initial status 'Draft', got '%s'", pNode.Spec.VerificationStatus)
	}

	// 2. Pre-issuance check: Attempt to Sign & Issue a Draft passport -> MUST FAIL
	signPayload := `{"signer_name":"CSO Officer","signer_role":"CSO","key_id":"0xKEY-123"}`
	reqSignDraft := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/sign", passportID), bytes.NewBufferString(signPayload))
	reqSignDraft.Header.Set("Content-Type", "application/json")
	rrSignDraft := httptest.NewRecorder()
	srv.handlePassports(rrSignDraft, reqSignDraft)
	if rrSignDraft.Code != http.StatusBadRequest {
		t.Errorf("expected 400 when attempting to sign unverified draft passport, got %d", rrSignDraft.Code)
	}

	// 3. Company completes inputs and Submits for Verification
	submitPayload := `{"submitted_by":"Kwame Mensah","role":"Facility Operator","notes":"Primary telemetry attached"}`
	reqSubmit := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/submit", passportID), bytes.NewBufferString(submitPayload))
	reqSubmit.Header.Set("Content-Type", "application/json")
	rrSubmit := httptest.NewRecorder()
	srv.handlePassports(rrSubmit, reqSubmit)
	if rrSubmit.Code != http.StatusOK {
		t.Fatalf("submit passport failed: %d: %s", rrSubmit.Code, rrSubmit.Body.String())
	}
	nodeAfterSubmit, _ := nexus.GetPassportNode(context.Background(), nClient, passportID)
	if nodeAfterSubmit.Spec.VerificationStatus != "Submitted" {
		t.Errorf("expected status 'Submitted', got '%s'", nodeAfterSubmit.Spec.VerificationStatus)
	}

	// 4. Verifier raises findings / requests corrections
	findingPayload := `{"verifier_name":"Sarah Jenkins","finding_title":"Unverified grid emission factor","finding_description":"Please supply regional grid sub-station declaration"}`
	reqFinding := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/request-corrections", passportID), bytes.NewBufferString(findingPayload))
	reqFinding.Header.Set("Content-Type", "application/json")
	rrFinding := httptest.NewRecorder()
	srv.handlePassports(rrFinding, reqFinding)
	if rrFinding.Code != http.StatusOK {
		t.Fatalf("request corrections failed: %d: %s", rrFinding.Code, rrFinding.Body.String())
	}
	nodeAfterFinding, _ := nexus.GetPassportNode(context.Background(), nClient, passportID)
	if nodeAfterFinding.Spec.VerificationStatus != "CorrectionsRequired" {
		t.Errorf("expected status 'CorrectionsRequired', got '%s'", nodeAfterFinding.Spec.VerificationStatus)
	}

	// 5. Company re-submits corrected evidence
	reqResubmit := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/submit", passportID), bytes.NewBufferString(`{"submitted_by":"Kwame Mensah","notes":"Attached sub-station meter certificate"}`))
	reqResubmit.Header.Set("Content-Type", "application/json")
	rrResubmit := httptest.NewRecorder()
	srv.handlePassports(rrResubmit, reqResubmit)
	if rrResubmit.Code != http.StatusOK {
		t.Fatalf("resubmit failed: %d", rrResubmit.Code)
	}

	// 6. Segregation of Duties: Company Operator attempts to verify own passport -> MUST BE REJECTED 403
	verifyPayload := `{"verifier_name":"Auditor","agency_name":"Bureau Veritas"}`
	reqSelfVerify := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/verify", passportID), bytes.NewBufferString(verifyPayload))
	reqSelfVerify.Header.Set("Content-Type", "application/json")
	reqSelfVerify.Header.Set("X-User-Role", "Company Operator")
	rrSelfVerify := httptest.NewRecorder()
	srv.handlePassports(rrSelfVerify, reqSelfVerify)
	if rrSelfVerify.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden when Company Operator attempts self-verification, got %d", rrSelfVerify.Code)
	}

	// 7. Accredited Verifier approves verification
	reqVerify := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/verify", passportID), bytes.NewBufferString(verifyPayload))
	reqVerify.Header.Set("Content-Type", "application/json")
	reqVerify.Header.Set("X-User-Role", "Verifier")
	rrVerify := httptest.NewRecorder()
	srv.handlePassports(rrVerify, reqVerify)
	if rrVerify.Code != http.StatusOK {
		t.Fatalf("verify passport failed: %d: %s", rrVerify.Code, rrVerify.Body.String())
	}
	nodeAfterVerify, _ := nexus.GetPassportNode(context.Background(), nClient, passportID)
	if nodeAfterVerify.Spec.VerificationStatus != "Verified" {
		t.Errorf("expected status 'Verified', got '%s'", nodeAfterVerify.Spec.VerificationStatus)
	}

	// 8. Company authorized officer Signs & Issues the verified passport
	reqSign := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/sign", passportID), bytes.NewBufferString(signPayload))
	reqSign.Header.Set("Content-Type", "application/json")
	rrSign := httptest.NewRecorder()
	srv.handlePassports(rrSign, reqSign)
	if rrSign.Code != http.StatusOK {
		t.Fatalf("sign passport failed: %d: %s", rrSign.Code, rrSign.Body.String())
	}
	nodeAfterSign, _ := nexus.GetPassportNode(context.Background(), nClient, passportID)
	if nodeAfterSign.Spec.VerificationStatus != "Issued" {
		t.Errorf("expected status 'Issued', got '%s'", nodeAfterSign.Spec.VerificationStatus)
	}
	if !nodeAfterSign.Spec.Frozen {
		t.Errorf("expected passport to be frozen after issuance")
	}

	// 9. Submit to Agency (e.g. EU CBAM Transitional Registry)
	agencyPayload := `{"agency_name":"EU CBAM Registry","declarant_id":"DEC-EU-2026-001"}`
	reqAgency := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/submit-agency", passportID), bytes.NewBufferString(agencyPayload))
	reqAgency.Header.Set("Content-Type", "application/json")
	rrAgency := httptest.NewRecorder()
	srv.handlePassports(rrAgency, reqAgency)
	if rrAgency.Code != http.StatusOK {
		t.Fatalf("submit to agency failed: %d: %s", rrAgency.Code, rrAgency.Body.String())
	}
	nodeAfterAgency, _ := nexus.GetPassportNode(context.Background(), nClient, passportID)
	if nodeAfterAgency.Spec.VerificationStatus != "SubmittedToAgency" {
		t.Errorf("expected status 'SubmittedToAgency', got '%s'", nodeAfterAgency.Spec.VerificationStatus)
	}
}

func TestMRV_SubmitVerificationPackageAndFreeze(t *testing.T) {
	client := nexus.GetNexusClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	eng := nexus.GetNexusEngine()
	srv := &VerificationServer{nexusEngine: eng}

	// 1. Submit Verification Package via MRV endpoint
	submitMRVPayload := `{
		"engagement_id": "VER-026",
		"batch_id": "CB-2026-001",
		"facility": "Tema Processing Plant",
		"submitted_by": "Kwame Mensah",
		"notes": "Primary evidence complete and dataset sealed"
	}`
	reqMRV := httptest.NewRequest(http.MethodPost, "/api/v1/mrv/readiness/submit", bytes.NewBufferString(submitMRVPayload))
	reqMRV.Header.Set("Content-Type", "application/json")
	rrMRV := httptest.NewRecorder()
	srv.handleMRVSubmitPackage(rrMRV, reqMRV)

	if rrMRV.Code != http.StatusOK {
		t.Fatalf("MRV submit failed: %d: %s", rrMRV.Code, rrMRV.Body.String())
	}

	var mrvResp map[string]interface{}
	if err := json.Unmarshal(rrMRV.Body.Bytes(), &mrvResp); err != nil {
		t.Fatalf("failed to decode MRV submit response: %v", err)
	}
	if mrvResp["status"] != "Submitted" {
		t.Errorf("expected status 'Submitted', got %v", mrvResp["status"])
	}
	if mrvResp["dataset_lock_hash"] == "" {
		t.Errorf("expected non-empty dataset_lock_hash")
	}
	if mrvResp["submission_id"] == "" {
		t.Errorf("expected non-empty submission_id")
	}

	// 2. Freeze Dataset endpoint
	freezePayload := `{
		"engagement_id": "VER-026",
		"reason": "Accredited auditor site visit freeze",
		"frozen_by": "Sarah Jenkins"
	}`
	reqFreeze := httptest.NewRequest(http.MethodPost, "/api/v1/mrv/freeze", bytes.NewBufferString(freezePayload))
	reqFreeze.Header.Set("Content-Type", "application/json")
	rrFreeze := httptest.NewRecorder()
	srv.handleMRVFreezeDataset(rrFreeze, reqFreeze)

	if rrFreeze.Code != http.StatusOK {
		t.Fatalf("MRV freeze failed: %d: %s", rrFreeze.Code, rrFreeze.Body.String())
	}

	var freezeResp map[string]interface{}
	if err := json.Unmarshal(rrFreeze.Body.Bytes(), &freezeResp); err != nil {
		t.Fatalf("failed to decode MRV freeze response: %v", err)
	}
	if freezeResp["status"] != "DATA_FROZEN" {
		t.Errorf("expected status 'DATA_FROZEN', got %v", freezeResp["status"])
	}
	if freezeResp["freeze_hash"] == "" {
		t.Errorf("expected non-empty freeze_hash")
	}
}
