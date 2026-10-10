package telemetry

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
)

// EM6400Reading represents a parsed or generated telemetry frame from a
// Schneider / Sattric EM6400 3-Phase Multi-Function Power & Energy Meter.
type EM6400Reading struct {
	MeterModel string `json:"meter_model"` // "EM6400"
	MeterID    string `json:"meter_id"`    // e.g. "MTR-GH-001"
	FacilityID string `json:"facility_id"` // e.g. "FAC-GH-001"
	Timestamp  string `json:"timestamp"`

	// Voltages (Line-to-Neutral & Line-to-Line)
	V1n  float64 `json:"V1n"`  // Phase-1 to Neutral voltage (180–300 V)
	V2n  float64 `json:"V2n"`  // Phase-2 to Neutral voltage (180–300 V)
	V3n  float64 `json:"V3n"`  // Phase-3 to Neutral voltage (180–300 V)
	V12  float64 `json:"V12"`  // Phase-1 to Phase-2 voltage (300–500 V)
	V23  float64 `json:"V23"`  // Phase-2 to Phase-3 voltage (300–500 V)
	V31  float64 `json:"V31"`  // Phase-3 to Phase-1 voltage (300–500 V)
	Vavg float64 `json:"Vavg"` // Average line-neutral voltage (180–300 V)

	// Currents (Phases & Neutral)
	I1   float64 `json:"I1"`   // Phase-1 current (0–100 A typical)
	I2   float64 `json:"I2"`   // Phase-2 current (0–100 A)
	I3   float64 `json:"I3"`   // Phase-3 current (0–100 A)
	In   float64 `json:"In"`   // Neutral current (0 to ~30% of phase current)
	Iavg float64 `json:"Iavg"` // Average phase current (0–100 A)

	// Power & Power Factor
	KW   float64 `json:"KW"`   // Active power in kW (0–75 kW typical)
	KVA  float64 `json:"KVA"`  // Apparent power in kVA (0–100 kVA)
	KVAR float64 `json:"KVAR"` // Reactive power in kVAR (±50 kVAR)
	PF   float64 `json:"PF"`   // Power factor (-1.000 to +1.000)
	FREQ float64 `json:"FREQ"` // System frequency (45–65 Hz, normal 49–51 Hz)

	// Harmonics (Total Harmonic Distortion %)
	THDV1 float64 `json:"THDV1"` // Voltage THD phase-1 (0–15%)
	THDV2 float64 `json:"THDV2"` // Voltage THD phase-2 (0–15%)
	THDV3 float64 `json:"THDV3"` // Voltage THD phase-3 (0–15%)
	THDI1 float64 `json:"THDI1"` // Current THD phase-1 (0–40%)
	THDI2 float64 `json:"THDI2"` // Current THD phase-2 (0–40%)
	THDI3 float64 `json:"THDI3"` // Current THD phase-3 (0–40%)

	// Forward Energy (Import)
	KWH_FWD   float64 `json:"KWH_FWD"`   // Imported active energy (kWh)
	KVAH_FWD  float64 `json:"KVAH_FWD"`  // Imported apparent energy (kVAh)
	KVARH_FWD float64 `json:"KVARH_FWD"` // Imported reactive energy (kVARh)

	// Reverse Energy (Export)
	KWH_REV   float64 `json:"KWH_REV"`   // Exported active energy (kWh)
	KVAH_REV  float64 `json:"KVAH_REV"`  // Exported apparent energy (kVAh)
	KVARH_REV float64 `json:"KVARH_REV"` // Exported reactive energy (kVARh)

	// Events / Counters & Unbalance
	INTR int     `json:"INTR"` // Number of power interruptions
	IUNB float64 `json:"IUNB"` // Current unbalance % (good <10%)
	VUNB float64 `json:"VUNB"` // Voltage unbalance % (good <3%)

	// Communication & System Health
	RSSI  int `json:"RSSI"`  // GSM signal strength (-110 to -50 dBm, good > -85)
	MTR   int `json:"MTR"`   // Meter communication status (0 = fail, 1 = OK)
	GPRS  int `json:"GPRS"`  // Network / modem status (0 = fail, 1 = OK)
	STALE int `json:"STALE"` // Data freshness (0 = live, 1 = stale)

	// Full raw frame representation
	RawFrame string `json:"raw_frame"`
}

// GeneratorParams allows clients to parameterize the random telemetry generation.
type GeneratorParams struct {
	MeterID        string   `json:"meter_id,omitempty"`
	FacilityID     string   `json:"facility_id,omitempty"`
	BaseKW         *float64 `json:"base_kw,omitempty"`         // Target active power (e.g. 7.82 kW)
	NominalVoltage *float64 `json:"nominal_voltage,omitempty"` // Target line-to-neutral voltage (e.g. 240 V)
	PowerFactor    *float64 `json:"power_factor,omitempty"`    // Target power factor (e.g. 0.96)
	Frequency      *float64 `json:"frequency,omitempty"`       // Target frequency (e.g. 50.0 Hz)
	SimulateFault  bool     `json:"simulate_fault,omitempty"`
}

// SampleRawFrame provides the canonical baseline raw frame captured from live industrial meters.
const SampleRawFrame = "raw  dta frame$EM6400,V1n:239.8,V2n:240.4,V3n:238.9,V12:415.3,V23:416.1,V31:414.8,I1:12.34,I2:11.98,I3:12.21,Vavg:239.7,Iavg:12.18,KW:7.82,KVA:8.11,KVAR:2.34,PF:0.964,FREQ:49.98,THDV1:2.1,THDV2:2.3,THDV3:2.0,THDI1:4.2,THDI2:4.5,THDI3:4.1,KWH_FWD:12345.67,KVAH_FWD:12988.11,KVARH_FWD:4567.22,KWH_REV:12.34,KVAH_REV:15.67,KVARH_REV:3.45,INTR:5,In:0.42,IUNB:3.2,VUNB:1.1,RSSI:-71,MTR:1,GPRS:1,STALE:0,Z"

// ParseRawFrame parses an EM6400 telemetry string frame into a structured EM6400Reading.
func ParseRawFrame(raw string) (*EM6400Reading, error) {
	trimmed := strings.TrimSpace(raw)
	// Strip optional header prefix if present (e.g. "raw  dta frame$")
	dollarIdx := strings.Index(trimmed, "$")
	var payload string
	if dollarIdx != -1 {
		payload = trimmed[dollarIdx+1:]
	} else {
		payload = trimmed
	}

	tokens := strings.Split(payload, ",")
	if len(tokens) < 2 {
		return nil, fmt.Errorf("invalid frame: expected at least model and tokens, got %q", raw)
	}

	model := tokens[0]
	reading := &EM6400Reading{
		MeterModel: model,
		Timestamp:  time.Now().UTC().Format(time.RFC3339),
		RawFrame:   trimmed,
		MTR:        1,
		GPRS:       1,
	}

	for _, token := range tokens[1:] {
		token = strings.TrimSpace(token)
		if token == "" || token == "Z" {
			continue
		}
		parts := strings.SplitN(token, ":", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		valStr := strings.TrimSpace(parts[1])
		valFloat, errFloat := strconv.ParseFloat(valStr, 64)

		switch key {
		case "V1n":
			reading.V1n = valFloat
		case "V2n":
			reading.V2n = valFloat
		case "V3n":
			reading.V3n = valFloat
		case "V12":
			reading.V12 = valFloat
		case "V23":
			reading.V23 = valFloat
		case "V31":
			reading.V31 = valFloat
		case "Vavg":
			reading.Vavg = valFloat
		case "I1":
			reading.I1 = valFloat
		case "I2":
			reading.I2 = valFloat
		case "I3":
			reading.I3 = valFloat
		case "In":
			reading.In = valFloat
		case "Iavg":
			reading.Iavg = valFloat
		case "KW":
			reading.KW = valFloat
		case "KVA":
			reading.KVA = valFloat
		case "KVAR":
			reading.KVAR = valFloat
		case "PF":
			reading.PF = valFloat
		case "FREQ":
			reading.FREQ = valFloat
		case "THDV1":
			reading.THDV1 = valFloat
		case "THDV2":
			reading.THDV2 = valFloat
		case "THDV3":
			reading.THDV3 = valFloat
		case "THDI1":
			reading.THDI1 = valFloat
		case "THDI2":
			reading.THDI2 = valFloat
		case "THDI3":
			reading.THDI3 = valFloat
		case "KWH_FWD":
			reading.KWH_FWD = valFloat
		case "KVAH_FWD":
			reading.KVAH_FWD = valFloat
		case "KVARH_FWD":
			reading.KVARH_FWD = valFloat
		case "KWH_REV":
			reading.KWH_REV = valFloat
		case "KVAH_REV":
			reading.KVAH_REV = valFloat
		case "KVARH_REV":
			reading.KVARH_REV = valFloat
		case "INTR":
			if n, err := strconv.Atoi(valStr); err == nil {
				reading.INTR = n
			}
		case "IUNB":
			reading.IUNB = valFloat
		case "VUNB":
			reading.VUNB = valFloat
		case "RSSI":
			if n, err := strconv.Atoi(valStr); err == nil {
				reading.RSSI = n
			}
		case "MTR":
			if n, err := strconv.Atoi(valStr); err == nil {
				reading.MTR = n
			}
		case "GPRS":
			if n, err := strconv.Atoi(valStr); err == nil {
				reading.GPRS = n
			}
		case "STALE":
			if n, err := strconv.Atoi(valStr); err == nil {
				reading.STALE = n
			}
		default:
			_ = errFloat
		}
	}

	// Compute derived averages if missing
	if reading.Vavg == 0 && (reading.V1n > 0 || reading.V2n > 0 || reading.V3n > 0) {
		reading.Vavg = math.Round((reading.V1n+reading.V2n+reading.V3n)/3.0*10) / 10
	}
	if reading.Iavg == 0 && (reading.I1 > 0 || reading.I2 > 0 || reading.I3 > 0) {
		reading.Iavg = math.Round((reading.I1+reading.I2+reading.I3)/3.0*100) / 100
	}

	return reading, nil
}

// FormatRawFrame formats an EM6400Reading into the industrial raw string frame:
// raw  dta frame$EM6400,V1n:...,V2n:...,...,Z
func (r *EM6400Reading) FormatRawFrame() string {
	model := r.MeterModel
	if model == "" {
		model = "EM6400"
	}

	tokens := []string{
		fmt.Sprintf("raw  dta frame$%s", model),
		fmt.Sprintf("V1n:%.1f", r.V1n),
		fmt.Sprintf("V2n:%.1f", r.V2n),
		fmt.Sprintf("V3n:%.1f", r.V3n),
		fmt.Sprintf("V12:%.1f", r.V12),
		fmt.Sprintf("V23:%.1f", r.V23),
		fmt.Sprintf("V31:%.1f", r.V31),
		fmt.Sprintf("I1:%.2f", r.I1),
		fmt.Sprintf("I2:%.2f", r.I2),
		fmt.Sprintf("I3:%.2f", r.I3),
		fmt.Sprintf("Vavg:%.1f", r.Vavg),
		fmt.Sprintf("Iavg:%.2f", r.Iavg),
		fmt.Sprintf("KW:%.2f", r.KW),
		fmt.Sprintf("KVA:%.2f", r.KVA),
		fmt.Sprintf("KVAR:%.2f", r.KVAR),
		fmt.Sprintf("PF:%.3f", r.PF),
		fmt.Sprintf("FREQ:%.2f", r.FREQ),
		fmt.Sprintf("THDV1:%.1f", r.THDV1),
		fmt.Sprintf("THDV2:%.1f", r.THDV2),
		fmt.Sprintf("THDV3:%.1f", r.THDV3),
		fmt.Sprintf("THDI1:%.1f", r.THDI1),
		fmt.Sprintf("THDI2:%.1f", r.THDI2),
		fmt.Sprintf("THDI3:%.1f", r.THDI3),
		fmt.Sprintf("KWH_FWD:%.2f", r.KWH_FWD),
		fmt.Sprintf("KVAH_FWD:%.2f", r.KVAH_FWD),
		fmt.Sprintf("KVARH_FWD:%.2f", r.KVARH_FWD),
		fmt.Sprintf("KWH_REV:%.2f", r.KWH_REV),
		fmt.Sprintf("KVAH_REV:%.2f", r.KVAH_REV),
		fmt.Sprintf("KVARH_REV:%.2f", r.KVARH_REV),
		fmt.Sprintf("INTR:%d", r.INTR),
		fmt.Sprintf("In:%.2f", r.In),
		fmt.Sprintf("IUNB:%.1f", r.IUNB),
		fmt.Sprintf("VUNB:%.1f", r.VUNB),
		fmt.Sprintf("RSSI:%d", r.RSSI),
		fmt.Sprintf("MTR:%d", r.MTR),
		fmt.Sprintf("GPRS:%d", r.GPRS),
		fmt.Sprintf("STALE:%d", r.STALE),
		"Z",
	}

	return strings.Join(tokens, ",")
}
