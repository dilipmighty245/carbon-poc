package telemetry

import (
	"math"
	"math/rand"
	"sync"
	"time"
)

// TelemetryGenerator simulates continuous, physics-based power meter telemetry.
type TelemetryGenerator struct {
	mu           sync.Mutex
	meterStates  map[string]*meterAccumulator
	randomSource *rand.Rand
}

type meterAccumulator struct {
	LastTimestamp time.Time
	KwhFwd        float64
	KvahFwd       float64
	KvarhFwd      float64
	KwhRev        float64
	KvahRev       float64
	KvarhRev      float64
	Interrupts    int
	BaseKW        float64
}

// NewTelemetryGenerator creates a new generator instance.
func NewTelemetryGenerator() *TelemetryGenerator {
	return &TelemetryGenerator{
		meterStates:  make(map[string]*meterAccumulator),
		randomSource: rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// GenerateReading produces a consistent EM6400Reading based on input parameters.
func (g *TelemetryGenerator) GenerateReading(params GeneratorParams) *EM6400Reading {
	g.mu.Lock()
	defer g.mu.Unlock()

	meterID := params.MeterID
	if meterID == "" {
		meterID = "MTR-GH-001"
	}
	facilityID := params.FacilityID
	if facilityID == "" {
		facilityID = "FAC-GH-001"
	}

	state, exists := g.meterStates[meterID]
	now := time.Now().UTC()
	if !exists {
		// Initialize state with realistic industrial baseline cumulative readings
		baseKwh := 12000.0 + g.randomSource.Float64()*5000.0
		state = &meterAccumulator{
			LastTimestamp: now.Add(-10 * time.Second),
			KwhFwd:        math.Round(baseKwh*100) / 100,
			KvahFwd:       math.Round(baseKwh*1.05*100) / 100,
			KvarhFwd:      math.Round(baseKwh*0.37*100) / 100,
			KwhRev:        12.34,
			KvahRev:       15.67,
			KvarhRev:      3.45,
			Interrupts:    int(g.randomSource.Int31n(6)),
			BaseKW:        8.0 + g.randomSource.Float64()*15.0,
		}
		g.meterStates[meterID] = state
	}

	// Active Power (KW) based on input or state
	activeKW := state.BaseKW
	if params.BaseKW != nil && *params.BaseKW > 0 {
		activeKW = *params.BaseKW
	}
	// Add small ±2% natural industrial fluctuation
	kwFluctuation := (g.randomSource.Float64() - 0.5) * 0.04 * activeKW
	kw := math.Max(0.5, math.Round((activeKW+kwFluctuation)*100)/100)

	// Power Factor (PF)
	pf := 0.965
	if params.PowerFactor != nil && *params.PowerFactor > 0.5 && *params.PowerFactor <= 1.0 {
		pf = *params.PowerFactor
	} else {
		pf = 0.950 + g.randomSource.Float64()*0.035 // between 0.950 and 0.985
	}
	pf = math.Round(pf*1000) / 1000

	// Apparent Power (KVA) & Reactive Power (KVAR)
	kva := math.Round((kw/pf)*100) / 100
	kvarVal := math.Sqrt(math.Max(0, math.Pow(kva, 2)-math.Pow(kw, 2)))
	kvar := math.Round(kvarVal*100) / 100

	// Nominal Line-to-Neutral Voltage (V)
	nominalV := 240.0
	if params.NominalVoltage != nil && *params.NominalVoltage >= 180 && *params.NominalVoltage <= 300 {
		nominalV = *params.NominalVoltage
	}

	// Per-phase voltages with slight variation
	v1n := math.Round((nominalV-0.5+g.randomSource.Float64()*1.2)*10) / 10
	v2n := math.Round((nominalV-0.2+g.randomSource.Float64()*1.0)*10) / 10
	v3n := math.Round((nominalV-0.7+g.randomSource.Float64()*1.3)*10) / 10
	vAvg := math.Round(((v1n+v2n+v3n)/3.0)*10) / 10

	// Line-to-Line Voltages (VLL ≈ √3 * VLN)
	sqrt3 := math.Sqrt(3.0)
	v12 := math.Round(((v1n+v2n)/2.0*sqrt3+(g.randomSource.Float64()-0.5)*0.8)*10) / 10
	v23 := math.Round(((v2n+v3n)/2.0*sqrt3+(g.randomSource.Float64()-0.5)*0.8)*10) / 10
	v31 := math.Round(((v3n+v1n)/2.0*sqrt3+(g.randomSource.Float64()-0.5)*0.8)*10) / 10

	// Three-phase currents: I_phase ≈ (KVA * 1000) / (√3 * V_LL)
	vLLAvg := (v12 + v23 + v31) / 3.0
	nominalI := (kva * 1000.0) / (sqrt3 * vLLAvg)
	i1 := math.Round((nominalI*(1.0+(g.randomSource.Float64()-0.5)*0.04))*100) / 100
	i2 := math.Round((nominalI*(1.0+(g.randomSource.Float64()-0.5)*0.04))*100) / 100
	i3 := math.Round((nominalI*(1.0+(g.randomSource.Float64()-0.5)*0.04))*100) / 100
	iAvg := math.Round(((i1+i2+i3)/3.0)*100) / 100

	// Neutral current (typically ~2-5% of phase current under normal balanced conditions)
	inCurrent := math.Round((math.Abs(i1-i2)+math.Abs(i2-i3))*0.35*100) / 100
	if inCurrent > iAvg*0.3 {
		inCurrent = math.Round(iAvg*0.15*100) / 100
	}

	// Frequency (FREQ)
	freq := 50.0
	if params.Frequency != nil && *params.Frequency >= 45.0 && *params.Frequency <= 65.0 {
		freq = *params.Frequency
	} else {
		freq = 49.96 + g.randomSource.Float64()*0.07 // 49.96 – 50.03 Hz
	}
	freq = math.Round(freq*100) / 100

	// Harmonics (THD %)
	thdv1 := math.Round((1.9+g.randomSource.Float64()*0.4)*10) / 10
	thdv2 := math.Round((2.0+g.randomSource.Float64()*0.4)*10) / 10
	thdv3 := math.Round((1.8+g.randomSource.Float64()*0.5)*10) / 10
	thdi1 := math.Round((3.8+g.randomSource.Float64()*0.8)*10) / 10
	thdi2 := math.Round((4.0+g.randomSource.Float64()*0.9)*10) / 10
	thdi3 := math.Round((3.7+g.randomSource.Float64()*0.8)*10) / 10

	// Unbalance percentages
	iMaxDiff := math.Max(math.Abs(i1-iAvg), math.Max(math.Abs(i2-iAvg), math.Abs(i3-iAvg)))
	iunb := math.Round((iMaxDiff/math.Max(0.1, iAvg)*100.0)*10) / 10
	if iunb > 8.0 {
		iunb = 3.2
	}

	vMaxDiff := math.Max(math.Abs(v1n-vAvg), math.Max(math.Abs(v2n-vAvg), math.Abs(v3n-vAvg)))
	vunb := math.Round((vMaxDiff/math.Max(1.0, vAvg)*100.0)*10) / 10
	if vunb > 2.5 {
		vunb = 1.1
	}

	// Update cumulative energy consumption
	elapsedSec := now.Sub(state.LastTimestamp).Seconds()
	if elapsedSec <= 0 || elapsedSec > 3600 {
		elapsedSec = 1.0
	}
	addedKwh := (kw * elapsedSec) / 3600.0
	state.KwhFwd += addedKwh
	state.KvahFwd += (kva * elapsedSec) / 3600.0
	state.KvarhFwd += (kvar * elapsedSec) / 3600.0
	state.LastTimestamp = now

	// Health and connectivity indicators
	rssi := -71 + int(g.randomSource.Int31n(7)) - 3 // -74 to -68 dBm
	mtr := 1
	gprs := 1
	stale := 0
	if params.SimulateFault {
		gprs = 0
		stale = 1
		rssi = -105
	}

	reading := &EM6400Reading{
		MeterModel: "EM6400",
		MeterID:    meterID,
		FacilityID: facilityID,
		Timestamp:  now.Format(time.RFC3339),
		V1n:        v1n,
		V2n:        v2n,
		V3n:        v3n,
		V12:        v12,
		V23:        v23,
		V31:        v31,
		Vavg:       vAvg,
		I1:         i1,
		I2:         i2,
		I3:         i3,
		In:         inCurrent,
		Iavg:       iAvg,
		KW:         kw,
		KVA:        kva,
		KVAR:       kvar,
		PF:         pf,
		FREQ:       freq,
		THDV1:      thdv1,
		THDV2:      thdv2,
		THDV3:      thdv3,
		THDI1:      thdi1,
		THDI2:      thdi2,
		THDI3:      thdi3,
		KWH_FWD:    math.Round(state.KwhFwd*100) / 100,
		KVAH_FWD:   math.Round(state.KvahFwd*100) / 100,
		KVARH_FWD:  math.Round(state.KvarhFwd*100) / 100,
		KWH_REV:    state.KwhRev,
		KVAH_REV:   state.KvahRev,
		KVARH_REV:  state.KvarhRev,
		INTR:       state.Interrupts,
		IUNB:       iunb,
		VUNB:       vunb,
		RSSI:       rssi,
		MTR:        mtr,
		GPRS:       gprs,
		STALE:      stale,
	}

	reading.RawFrame = reading.FormatRawFrame()
	return reading
}
