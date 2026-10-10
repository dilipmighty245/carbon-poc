package telemetry

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestParseRawFrame_BenchmarkSample(t *testing.T) {
	raw := SampleRawFrame
	reading, err := ParseRawFrame(raw)
	if err != nil {
		t.Fatalf("ParseRawFrame failed: %v", err)
	}

	if reading.MeterModel != "EM6400" {
		t.Errorf("expected meter model EM6400, got %s", reading.MeterModel)
	}
	if reading.V1n != 239.8 {
		t.Errorf("expected V1n=239.8, got %f", reading.V1n)
	}
	if reading.Vavg != 239.7 {
		t.Errorf("expected Vavg=239.7, got %f", reading.Vavg)
	}
	if reading.KW != 7.82 {
		t.Errorf("expected KW=7.82, got %f", reading.KW)
	}
	if reading.KVA != 8.11 {
		t.Errorf("expected KVA=8.11, got %f", reading.KVA)
	}
	if reading.KVAR != 2.34 {
		t.Errorf("expected KVAR=2.34, got %f", reading.KVAR)
	}
	if reading.PF != 0.964 {
		t.Errorf("expected PF=0.964, got %f", reading.PF)
	}
	if reading.FREQ != 49.98 {
		t.Errorf("expected FREQ=49.98, got %f", reading.FREQ)
	}
	if reading.KWH_FWD != 12345.67 {
		t.Errorf("expected KWH_FWD=12345.67, got %f", reading.KWH_FWD)
	}
	if reading.INTR != 5 {
		t.Errorf("expected INTR=5, got %d", reading.INTR)
	}
	if reading.In != 0.42 {
		t.Errorf("expected In=0.42, got %f", reading.In)
	}
	if reading.IUNB != 3.2 {
		t.Errorf("expected IUNB=3.2, got %f", reading.IUNB)
	}
	if reading.VUNB != 1.1 {
		t.Errorf("expected VUNB=1.1, got %f", reading.VUNB)
	}
	if reading.RSSI != -71 {
		t.Errorf("expected RSSI=-71, got %d", reading.RSSI)
	}
	if reading.MTR != 1 || reading.GPRS != 1 || reading.STALE != 0 {
		t.Errorf("expected healthy connectivity (MTR=1, GPRS=1, STALE=0), got MTR=%d, GPRS=%d, STALE=%d",
			reading.MTR, reading.GPRS, reading.STALE)
	}
}

func TestFormatRawFrame(t *testing.T) {
	orig, err := ParseRawFrame(SampleRawFrame)
	if err != nil {
		t.Fatalf("ParseRawFrame failed: %v", err)
	}

	formatted := orig.FormatRawFrame()
	if !strings.HasPrefix(formatted, "raw  dta frame$EM6400") {
		t.Errorf("expected prefix raw  dta frame$EM6400, got %s", formatted)
	}
	if !strings.HasSuffix(formatted, ",Z") {
		t.Errorf("expected suffix ,Z, got %s", formatted)
	}

	// Re-parse formatted frame to ensure round-trip integrity
	reparsed, err := ParseRawFrame(formatted)
	if err != nil {
		t.Fatalf("reparse failed: %v", err)
	}
	if reparsed.KW != orig.KW || reparsed.KWH_FWD != orig.KWH_FWD || reparsed.RSSI != orig.RSSI {
		t.Errorf("round trip mismatch: got KW=%f KWH=%f RSSI=%d", reparsed.KW, reparsed.KWH_FWD, reparsed.RSSI)
	}
}

func TestGenerator_RealisticRanges(t *testing.T) {
	gen := NewTelemetryGenerator()
	baseKW := 25.0
	nomV := 230.0
	pf := 0.97
	freq := 50.0

	reading := gen.GenerateReading(GeneratorParams{
		MeterID:        "MTR-TEST-001",
		FacilityID:     "FAC-TEST-001",
		BaseKW:         &baseKW,
		NominalVoltage: &nomV,
		PowerFactor:    &pf,
		Frequency:      &freq,
	})

	// Check Voltage ranges (180–300 V for VLN, 300–500 V for VLL)
	if reading.V1n < 180 || reading.V1n > 300 {
		t.Errorf("V1n out of range: %f", reading.V1n)
	}
	if reading.V12 < 300 || reading.V12 > 500 {
		t.Errorf("V12 out of range: %f", reading.V12)
	}

	// Check Power metrics
	if reading.KW < 20 || reading.KW > 30 {
		t.Errorf("KW out of range for base 25.0: %f", reading.KW)
	}
	if reading.KVA <= reading.KW {
		t.Errorf("KVA (%f) must be >= KW (%f)", reading.KVA, reading.KW)
	}
	if reading.PF < 0.90 || reading.PF > 1.0 {
		t.Errorf("PF out of range: %f", reading.PF)
	}

	// Check Frequency
	if reading.FREQ < 49.0 || reading.FREQ > 51.0 {
		t.Errorf("FREQ out of normal bounds: %f", reading.FREQ)
	}

	// Check Health
	if reading.RSSI < -110 || reading.RSSI > -50 {
		t.Errorf("RSSI out of range: %d", reading.RSSI)
	}
	if reading.MTR != 1 || reading.GPRS != 1 || reading.STALE != 0 {
		t.Errorf("expected normal health flags")
	}

	// Raw frame string was generated and contains expected markers
	if !strings.Contains(reading.RawFrame, "EM6400") || !strings.HasSuffix(reading.RawFrame, ",Z") {
		t.Errorf("raw frame malformed: %s", reading.RawFrame)
	}
}

func TestServer_Endpoints(t *testing.T) {
	gen := NewTelemetryGenerator()
	srv := NewServer(gen, "8085")
	mux := http.NewServeMux()
	srv.RegisterRoutes(mux)

	// 1. Healthz
	reqHealth := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rrHealth := httptest.NewRecorder()
	mux.ServeHTTP(rrHealth, reqHealth)
	if rrHealth.Code != http.StatusOK {
		t.Errorf("healthz failed: %d", rrHealth.Code)
	}

	// 2. Sample
	reqSample := httptest.NewRequest(http.MethodGet, "/api/v1/telemetry/sample", nil)
	rrSample := httptest.NewRecorder()
	mux.ServeHTTP(rrSample, reqSample)
	if rrSample.Code != http.StatusOK {
		t.Errorf("sample failed: %d", rrSample.Code)
	}
	var sampleReading EM6400Reading
	if err := json.Unmarshal(rrSample.Body.Bytes(), &sampleReading); err != nil {
		t.Fatalf("sample json unmarshal failed: %v", err)
	}
	if sampleReading.KW != 7.82 {
		t.Errorf("expected sample KW=7.82, got %f", sampleReading.KW)
	}

	// 3. Latest
	reqLatest := httptest.NewRequest(http.MethodGet, "/api/v1/telemetry/latest?meter_id=MTR-TEST&kw=15.5", nil)
	rrLatest := httptest.NewRecorder()
	mux.ServeHTTP(rrLatest, reqLatest)
	if rrLatest.Code != http.StatusOK {
		t.Errorf("latest failed: %d", rrLatest.Code)
	}
	var latestReading EM6400Reading
	if err := json.Unmarshal(rrLatest.Body.Bytes(), &latestReading); err != nil {
		t.Fatalf("latest json unmarshal failed: %v", err)
	}
	if latestReading.MeterID != "MTR-TEST" {
		t.Errorf("expected MTR-TEST, got %s", latestReading.MeterID)
	}

	// 4. Raw
	reqRaw := httptest.NewRequest(http.MethodGet, "/api/v1/telemetry/raw", nil)
	rrRaw := httptest.NewRecorder()
	mux.ServeHTTP(rrRaw, reqRaw)
	if rrRaw.Code != http.StatusOK {
		t.Errorf("raw failed: %d", rrRaw.Code)
	}
	rawStr := rrRaw.Body.String()
	if !strings.Contains(rawStr, "EM6400") {
		t.Errorf("expected raw string with EM6400, got %s", rawStr)
	}

	// 5. Generate via POST
	genBody := bytes.NewBufferString(`{"meter_id":"MTR-PUMP-01","base_kw":45.0}`)
	reqGen := httptest.NewRequest(http.MethodPost, "/api/v1/telemetry/generate", genBody)
	rrGen := httptest.NewRecorder()
	mux.ServeHTTP(rrGen, reqGen)
	if rrGen.Code != http.StatusOK {
		t.Errorf("generate POST failed: %d", rrGen.Code)
	}

	// 6. Parse via POST
	parseBody := bytes.NewBufferString(`{"raw_frame":"` + SampleRawFrame + `"}`)
	reqParse := httptest.NewRequest(http.MethodPost, "/api/v1/telemetry/parse", parseBody)
	rrParse := httptest.NewRecorder()
	mux.ServeHTTP(rrParse, reqParse)
	if rrParse.Code != http.StatusOK {
		t.Errorf("parse POST failed: %d", rrParse.Code)
	}
}
