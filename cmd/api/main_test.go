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

// TestHandleProducts_MethodNotAllowed expects 405 for GET on /api/v1/products.
func TestHandleProducts_MethodNotAllowed(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/products", nil)
	rr := httptest.NewRecorder()
	srv.handleProducts(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", rr.Code)
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
