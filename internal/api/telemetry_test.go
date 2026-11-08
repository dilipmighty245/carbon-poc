package api

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/telemetry"
)

func TestTelemetryRequiresSignedTenantAndNeverServesSamples(t *testing.T) {
	h := &TelemetryHandler{}
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	token, err := GenerateToken(&nexus.OrganisationUserModel{ID: "user", TenantID: "tenant-a", Role: "Organisation Owner"})
	if err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		path, token, tenant string
		want                int
	}{
		{"/api/v1/telemetry/latest?facility_id=facility", "", "tenant-a", 401},
		{"/api/v1/telemetry/history?facility_id=facility", token, "tenant-b", 403},
		{"/api/v1/telemetry/latest?facility_id=facility", token, "tenant-a", 503},
		{"/api/v1/telemetry/sample", token, "tenant-a", 404},
		{"/api/v1/telemetry/generate", token, "tenant-a", 404},
	} {
		req := httptest.NewRequest(http.MethodGet, tc.path, nil)
		req.Header.Set("Authorization", "Bearer "+tc.token)
		req.Header.Set("X-Tenant-ID", tc.tenant)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, req)
		if w.Code != tc.want {
			t.Fatalf("%s: got %d want %d", tc.path, w.Code, tc.want)
		}
	}
}

func TestFacilityTelemetryLifecycleInTimescale(t *testing.T) {
	dsn := os.Getenv("TELEMETRY_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("set TELEMETRY_TEST_DATABASE_URL to an isolated TimescaleDB")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	store, err := telemetry.OpenStore(ctx, dsn, base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{9}, 32)))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { store.DB.Close() })
	tenantID := "api-test-" + uuid.NewString()
	t.Cleanup(func() {
		_, _ = store.DB.Exec(`DELETE FROM telemetry_sources WHERE tenant_id=$1`, tenantID)
		_, _ = store.DB.Exec(`DELETE FROM telemetry_messages WHERE tenant_id=$1`, tenantID)
	})
	client := nexusclient.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(ctx, client)
	h := NewOrganisationHandlerWithClient(client, nexus.GetNexusEngine())
	h.Telemetry = store
	mux := http.NewServeMux()
	h.RegisterRoutes(mux)
	(&TelemetryHandler{Store: store}).RegisterRoutes(mux)
	token, err := GenerateToken(&nexus.OrganisationUserModel{ID: "owner", TenantID: tenantID, Role: "Organisation Owner"})
	if err != nil {
		t.Fatal(err)
	}
	request := func(method, path string, body any, auth string) *httptest.ResponseRecorder {
		t.Helper()
		data, _ := json.Marshal(body)
		r := httptest.NewRequest(method, path, bytes.NewReader(data))
		r.Header.Set("Authorization", "Bearer "+auth)
		w := httptest.NewRecorder()
		mux.ServeHTTP(w, r)
		return w
	}
	source := telemetry.Source{Device: telemetry.DeviceWG05, Host: "127.0.0.1", Port: 1883, Username: "test", Password: "credential-test-only", Topic: tenantID + "/EMS", GatewaySerial: "09001"}
	body := map[string]any{"id": "facility-1", "name": "Test factory", "type": "Production Facility", "country": "India", "country_code": "IN", "telemetry": source}
	response := request(http.MethodPost, "/api/v1/organisation/facilities", body, token)
	if response.Code != 200 {
		t.Fatal(response.Code, response.Body.String())
	}
	if bytes.Contains(response.Body.Bytes(), []byte("credential-test-only")) {
		t.Fatal("password returned by facility creation")
	}
	stored, err := store.Source(ctx, tenantID, "facility-1")
	if err != nil || !stored.PasswordConfigured {
		t.Fatal("connection was not saved", err)
	}
	node, err := nexus.GetFacilityNode(ctx, client, tenantID, "facility-1")
	if err != nil {
		t.Fatal(err)
	}
	if lenMust, err := node.GetAllMeters(ctx); err != nil || len(lenMust) != 0 {
		t.Fatal("fabricated meter child", err)
	}
	list := request(http.MethodGet, "/api/v1/organisation/facilities", nil, token)
	if list.Code != 200 || !bytes.Contains(list.Body.Bytes(), []byte(`"type":"Production Facility"`)) || !bytes.Contains(list.Body.Bytes(), []byte(`"device":"SaurEdge/WG-05"`)) {
		t.Fatal("facility configuration did not survive a graph read", list.Body.String())
	}
	m := telemetry.Message{ID: uuid.NewString(), SourceID: stored.ID, TenantID: tenantID, FacilityID: "facility-1", ReceivedAt: time.Now().UTC(), Topic: source.Topic, Payload: []byte(`{"SNO":"09001","DEVID":"0003","TWt":979.02,"extra":123}`)}
	m.Decode("09001")
	if err := store.Append(ctx, m); err != nil {
		t.Fatal(err)
	}
	latest := request(http.MethodGet, "/api/v1/telemetry/latest?facility_id=facility-1&meter_id=0003", nil, token)
	if latest.Code != 200 || !bytes.Contains(latest.Body.Bytes(), []byte(`"extra":123`)) {
		t.Fatal("persisted telemetry not returned", latest.Body.String())
	}
	for _, path := range []string{"/api/v1/telemetry/history?facility_id=facility-1&limit=0", "/api/v1/telemetry/history?facility_id=facility-1&from=bad"} {
		if w := request(http.MethodGet, path, nil, token); w.Code != 400 {
			t.Fatal("invalid query accepted", w.Code)
		}
	}
	// The selected UI windows must filter persisted receipt timestamps, including
	// when older deliveries exist in the same facility and meter.
	anchor := time.Now().UTC()
	for _, age := range []time.Duration{5 * time.Minute, 30 * time.Minute, 2 * time.Hour, 25 * time.Hour} {
		sample := m
		sample.ID, sample.ReceivedAt = uuid.NewString(), anchor.Add(-age)
		sample.Payload = []byte(`{"SNO":"09001","DEVID":"WINDOW","TWt":123}`)
		sample.Decode("09001")
		if err := store.Append(ctx, sample); err != nil {
			t.Fatal(err)
		}
	}
	for _, window := range []struct {
		duration time.Duration
		count    int
	}{{15 * time.Minute, 1}, {time.Hour, 2}, {24 * time.Hour, 3}} {
		from := anchor.Add(-window.duration).Format(time.RFC3339Nano)
		w := request(http.MethodGet, "/api/v1/telemetry/history?facility_id=facility-1&meter_id=WINDOW&from="+from, nil, token)
		var result struct {
			Readings []telemetry.Message `json:"readings"`
		}
		if w.Code != 200 || json.Unmarshal(w.Body.Bytes(), &result) != nil || len(result.Readings) != window.count {
			t.Fatalf("window %s returned %s", window.duration, w.Body.String())
		}
	}
	otherToken, _ := GenerateToken(&nexus.OrganisationUserModel{ID: "other", TenantID: "other-tenant", Role: "Organisation Owner"})
	if w := request(http.MethodGet, "/api/v1/telemetry/latest?facility_id=facility-1", nil, otherToken); w.Code != 404 {
		t.Fatal("another tenant accessed telemetry", w.Code)
	}
	body["id"] = "facility-2"
	if w := request(http.MethodPost, "/api/v1/organisation/facilities", body, token); w.Code != 409 {
		t.Fatal("gateway assigned to a second facility", w.Code, w.Body.String())
	}
	if w := request(http.MethodDelete, "/api/v1/organisation/facilities/facility-1", nil, token); w.Code != 200 {
		t.Fatal("facility deletion failed", w.Body.String())
	}
	if w := request(http.MethodGet, "/api/v1/telemetry/latest?facility_id=facility-1", nil, token); w.Code != 404 {
		t.Fatal("deleted subscription still available")
	}
	if w := request(http.MethodGet, "/api/v1/telemetry/history?facility_id=facility-1", nil, token); w.Code != 200 || !bytes.Contains(w.Body.Bytes(), []byte(`"extra":123`)) {
		t.Fatal("archived history is not accessible to its owner", w.Code)
	}
	readings, err := store.History(ctx, tenantID, "facility-1", "", time.Time{}, time.Now().Add(time.Minute), 100)
	if err != nil || len(readings) != 5 {
		t.Fatal("historical evidence lost on facility deletion", err)
	}
}
