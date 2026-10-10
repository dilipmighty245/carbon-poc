package telemetry

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Server provides HTTP and SSE streaming APIs for EM6400 industrial telemetry.
type Server struct {
	generator *TelemetryGenerator
	port      string
}

// NewServer initializes a new Telemetry Server instance.
func NewServer(generator *TelemetryGenerator, port string) *Server {
	if generator == nil {
		generator = NewTelemetryGenerator()
	}
	if port == "" {
		port = "8085"
	}
	return &Server{
		generator: generator,
		port:      port,
	}
}

// RegisterRoutes registers all telemetry simulation and query endpoints on the provided mux.
func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/healthz", s.handleHealthz)
	mux.HandleFunc("/api/v1/telemetry/healthz", s.handleHealthz)
	mux.HandleFunc("/api/v1/telemetry/sample", s.handleSample)
	mux.HandleFunc("/api/v1/telemetry/latest", s.handleLatest)
	mux.HandleFunc("/api/v1/telemetry/raw", s.handleRaw)
	mux.HandleFunc("/api/v1/telemetry/generate", s.handleGenerate)
	mux.HandleFunc("/api/v1/telemetry/parse", s.handleParse)
	mux.HandleFunc("/api/v1/telemetry/stream", s.handleStream)
}

// Start runs the HTTP server listening on configured port.
func (s *Server) Start() error {
	mux := http.NewServeMux()
	s.RegisterRoutes(mux)

	log.Printf("⚡ Sattric EM6400 Industrial Telemetry Server listening on :%s", s.port)
	log.Printf("   ├── Health:    http://localhost:%s/healthz", s.port)
	log.Printf("   ├── Sample:    http://localhost:%s/api/v1/telemetry/sample", s.port)
	log.Printf("   ├── Latest:    http://localhost:%s/api/v1/telemetry/latest", s.port)
	log.Printf("   ├── Raw Frame: http://localhost:%s/api/v1/telemetry/raw", s.port)
	log.Printf("   └── SSE Stream:http://localhost:%s/api/v1/telemetry/stream", s.port)

	return http.ListenAndServe(":"+s.port, mux)
}

func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Tenant-ID")
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "ok",
		"service":     "sattric-telemetry-server",
		"meter_model": "Schneider/Sattric EM6400",
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) handleSample(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	reading, err := ParseRawFrame(SampleRawFrame)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to parse sample: %v", err), http.StatusInternalServerError)
		return
	}
	reading.MeterID = "MTR-EM6400-BENCHMARK"
	reading.FacilityID = "FAC-BENCHMARK-01"

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(reading)
}

func (s *Server) handleLatest(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	q := r.URL.Query()
	params := GeneratorParams{
		MeterID:    q.Get("meter_id"),
		FacilityID: q.Get("facility_id"),
	}

	if kwStr := q.Get("kw"); kwStr != "" {
		if kw, err := strconv.ParseFloat(kwStr, 64); err == nil {
			params.BaseKW = &kw
		}
	}
	if vStr := q.Get("voltage"); vStr != "" {
		if v, err := strconv.ParseFloat(vStr, 64); err == nil {
			params.NominalVoltage = &v
		}
	}
	if pfStr := q.Get("pf"); pfStr != "" {
		if pf, err := strconv.ParseFloat(pfStr, 64); err == nil {
			params.PowerFactor = &pf
		}
	}

	reading := s.generator.GenerateReading(params)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(reading)
}

func (s *Server) handleRaw(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	q := r.URL.Query()
	params := GeneratorParams{
		MeterID:    q.Get("meter_id"),
		FacilityID: q.Get("facility_id"),
	}
	if kwStr := q.Get("kw"); kwStr != "" {
		if kw, err := strconv.ParseFloat(kwStr, 64); err == nil {
			params.BaseKW = &kw
		}
	}

	reading := s.generator.GenerateReading(params)
	format := q.Get("format")
	if format == "json" {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"raw_frame": reading.RawFrame,
		})
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	_, _ = w.Write([]byte(reading.RawFrame + "\n"))
}

func (s *Server) handleGenerate(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var params GeneratorParams
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil && err != io.EOF {
		http.Error(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	reading := s.generator.GenerateReading(params)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(reading)
}

func (s *Server) handleParse(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		RawFrame string `json:"raw_frame"`
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}

	rawString := strings.TrimSpace(string(bodyBytes))
	if strings.HasPrefix(rawString, "{") {
		_ = json.Unmarshal(bodyBytes, &payload)
		rawString = payload.RawFrame
	}

	if rawString == "" {
		rawString = SampleRawFrame
	}

	reading, err := ParseRawFrame(rawString)
	if err != nil {
		http.Error(w, fmt.Sprintf("parse error: %v", err), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(reading)
}

func (s *Server) handleStream(w http.ResponseWriter, r *http.Request) {
	setCORS(w)
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	q := r.URL.Query()
	meterID := q.Get("meter_id")
	if meterID == "" {
		meterID = "MTR-GH-001"
	}
	facilityID := q.Get("facility_id")
	if facilityID == "" {
		facilityID = "FAC-GH-001"
	}

	interval := 1000 * time.Millisecond
	if intStr := q.Get("interval_ms"); intStr != "" {
		if ms, err := strconv.Atoi(intStr); err == nil && ms >= 200 {
			interval = time.Duration(ms) * time.Millisecond
		}
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			reading := s.generator.GenerateReading(GeneratorParams{
				MeterID:    meterID,
				FacilityID: facilityID,
			})
			jsonData, _ := json.Marshal(reading)
			_, _ = fmt.Fprintf(w, "event: telemetry\ndata: %s\n\n", jsonData)
			flusher.Flush()
		}
	}
}
