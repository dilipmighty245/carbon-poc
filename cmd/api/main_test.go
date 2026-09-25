package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"k8s.io/apimachinery/pkg/runtime"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	saurientv1alpha1 "saurient-platform/api/v1alpha1"
	nexusdsl "saurient-platform/pkg/nexus"
)

func buildTestScheme(t *testing.T) *runtime.Scheme {
	t.Helper()
	s := runtime.NewScheme()
	if err := saurientv1alpha1.AddToScheme(s); err != nil {
		t.Fatalf("AddToScheme: %v", err)
	}
	return s
}

func newTestServer(t *testing.T) *VerificationServer {
	t.Helper()
	scheme := buildTestScheme(t)
	fakeClient := fake.NewClientBuilder().WithScheme(scheme).Build()
	return &VerificationServer{k8sClient: fakeClient}
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

// TestHandleProducts_MethodNotAllowed expects 405 for unsupported method DELETE.
func TestHandleProducts_MethodNotAllowed(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/products", nil)
	rr := httptest.NewRecorder()
	srv.handleProducts(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", rr.Code)
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

// TestHandleGetPassport_MissingTenantID expects 401 when no tenant context is present.
func TestHandleGetPassport_MissingTenantID(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/some-passport-id", nil)
	rr := httptest.NewRecorder()
	srv.handleGetPassport(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

// TestHandleGetPassport_MissingPassportID expects 400 when passport_id path param is empty.
func TestHandleGetPassport_MissingPassportID(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/passports/", nil)
	rr := httptest.NewRecorder()
	srv.handleGetPassport(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

// TestHandleGetPassport_NoCacheNoDBUnavailable expects 503 when both Redis and Postgres are unavailable.
func TestHandleGetPassport_NoCacheNoDBUnavailable(t *testing.T) {
	srv := newTestServer(t) // no redisRepo, no pgRepo
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
	// Initialize gqlSchema for testing
	schema, err := nexusdsl.BuildNexusGraphQLSchema(srv)
	if err != nil {
		t.Fatalf("BuildNexusGraphQLSchema failed: %v", err)
	}
	srv.gqlSchema = schema

	// 1. GET without query -> Playground HTML
	reqGet := httptest.NewRequest(http.MethodGet, "/graphql", nil)
	rrGet := httptest.NewRecorder()
	srv.handleGraphQL(rrGet, reqGet)
	if rrGet.Code != http.StatusOK {
		t.Errorf("expected 200 GET playground, got %d", rrGet.Code)
	}
	if !bytes.Contains(rrGet.Body.Bytes(), []byte("GraphQLPlayground")) {
		t.Errorf("playground response missing 'GraphQLPlayground' string")
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

	// 3. Dynamic Query Execution POST
	queryPayload := `{"query":"query { nexusGraph { framework root_node } carbonPassports { passport_id commodity_type total_footprint_kg } }"}`
	reqQuery := httptest.NewRequest(http.MethodPost, "/graphql", bytes.NewBufferString(queryPayload))
	reqQuery.Header.Set("Content-Type", "application/json")
	reqQuery.Header.Set("X-Tenant-ID", "org_saurient_demo")
	rrQuery := httptest.NewRecorder()
	srv.handleGraphQL(rrQuery, reqQuery)
	if rrQuery.Code != http.StatusOK {
		t.Errorf("expected 200 Query execution, got %d", rrQuery.Code)
	}
	var queryResp map[string]interface{}
	if err := json.Unmarshal(rrQuery.Body.Bytes(), &queryResp); err != nil {
		t.Fatalf("unmarshal query response: %v", err)
	}
	data, ok := queryResp["data"].(map[string]interface{})
	if !ok || data["nexusGraph"] == nil {
		t.Fatalf("query response missing data.nexusGraph: %s", rrQuery.Body.String())
	}
	if data["carbonPassports"] == nil {
		t.Fatalf("query response missing data.carbonPassports: %s", rrQuery.Body.String())
	}
}
