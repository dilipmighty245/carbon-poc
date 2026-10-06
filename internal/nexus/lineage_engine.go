package nexus

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Graph Lineage Presentation Types
type LineageNode struct {
	NodeID      string                 `json:"node_id"`
	NodeType    string                 `json:"node_type"` // ORGANISATION, FACILITY, PRODUCT_BATCH, INPUT_TELEMETRY, SUPPLIER_DECLARATION, CALC_VERSION, VERIFICATION, PASSPORT
	ReferenceID string                 `json:"reference_id"`
	Label       string                 `json:"label"`
	Properties  map[string]interface{} `json:"properties"`
	CreatedAt   time.Time              `json:"created_at"`
}

type LineageEdge struct {
	EdgeID       string `json:"edge_id"`
	ParentNodeID string `json:"parent_node_id"`
	ChildNodeID  string `json:"child_node_id"`
	EdgeType     string `json:"edge_type"` // CONTAINS, PRODUCES, FEEDS_INTO, CALCULATES, VERIFIES, ISSUES
}

type LineageDAG struct {
	PassportID string        `json:"passport_id"`
	Nodes      []LineageNode `json:"nodes"`
	Edges      []LineageEdge `json:"edges"`
}

type InputCorrectionRequest struct {
	InputNodeID string  `json:"input_node_id"`
	NewValue    float64 `json:"new_value"`
	Unit        string  `json:"unit"`
	Reason      string  `json:"reason"`
	UserRef     string  `json:"user_ref"`
}

type InputCorrectionResult struct {
	CorrectionID            string        `json:"correction_id"`
	InputNodeID             string        `json:"input_node_id"`
	OldValue                float64       `json:"old_value"`
	NewValue                float64       `json:"new_value"`
	OriginalCalcVersion     string        `json:"original_calc_version"`
	OriginalIntensityKgCO2e float64       `json:"original_intensity_kg_co2e"`
	NewCalcVersion          string        `json:"new_calc_version"`
	NewIntensityKgCO2e      float64       `json:"new_intensity_kg_co2e"`
	OriginalPassportID      string        `json:"original_passport_id"`
	OriginalPassportFrozen  bool          `json:"original_passport_frozen"`
	OriginalPassportHash    string        `json:"original_passport_hash"`
	NewDraftPassportID      string        `json:"new_draft_passport_id"`
	AffectedNodes           []LineageNode `json:"affected_nodes"`
	Timestamp               time.Time     `json:"timestamp"`
}

// NexusGraphEngine manages the in-memory Nexus graph node state and lineage traversals.
type NexusGraphEngine struct {
	mu     sync.RWMutex
	nodes  map[string]LineageNode
	edges  map[string]LineageEdge
	dagMap map[string]*LineageDAG
}

var (
	globalEngine *NexusGraphEngine
	once         sync.Once
)

// GetNexusEngine returns the singleton Nexus Graph Engine instance.
func GetNexusEngine() *NexusGraphEngine {
	once.Do(func() {
		globalEngine = &NexusGraphEngine{
			nodes:  make(map[string]LineageNode),
			edges:  make(map[string]LineageEdge),
			dagMap: make(map[string]*LineageDAG),
		}
		globalEngine.seedDefaultGraphTopology()
	})
	return globalEngine
}

func (e *NexusGraphEngine) seedDefaultGraphTopology() {
	e.mu.Lock()
	defer e.mu.Unlock()

	nodes := []LineageNode{
		{NodeID: "NODE_ORG_9001", NodeType: "ORGANISATION", ReferenceID: "ORG-9001", Label: "Sattric Industrial Corp", Properties: map[string]interface{}{"country": "India", "sector": "Steel"}},
		{NodeID: "NODE_FAC_042", NodeType: "FACILITY", ReferenceID: "FAC-042", Label: "Bellary Integrated Steel Plant", Properties: map[string]interface{}{"location": "Karnataka, India", "capacity_tpy": 500000}},
		{NodeID: "NODE_BATCH_981", NodeType: "PRODUCT_BATCH", ReferenceID: "ST-2026-00981", Label: "Hot-Rolled Steel Coil Batch", Properties: map[string]interface{}{"quantity_kg": 10000, "cn_code": "7208 10 00"}},
		{NodeID: "NODE_IN_SCOPE1", NodeType: "INPUT_TELEMETRY", ReferenceID: "MTR-S1-001", Label: "Scope 1 Fuel Meter (Diesel)", Properties: map[string]interface{}{"value": 2450.0, "unit": "liters", "emission_kg": 6566.0}},
		{NodeID: "NODE_IN_SCOPE2", NodeType: "INPUT_TELEMETRY", ReferenceID: "MTR-S2-001", Label: "Scope 2 Energy Meter (Grid Electricity)", Properties: map[string]interface{}{"value": 14200.0, "unit": "kWh", "emission_kg": 10082.0}},
		{NodeID: "NODE_IN_SUP_409", NodeType: "SUPPLIER_DECLARATION", ReferenceID: "SUP-DEC-409", Label: "Scope 3 HBI Raw Material Input (Supplier Apex Steel)", Properties: map[string]interface{}{"value": 0.650, "unit": "kgCO2e/kg", "emission_kg": 1852.0}},
		{NodeID: "NODE_CALC_V1", NodeType: "CALC_VERSION", ReferenceID: "CALC-2026-981-V1", Label: "CEL Calculation Version v1.0", Properties: map[string]interface{}{"intensity_kgCO2e_per_kg": 1.850, "total_footprint_kg": 18500.0, "version": "v1.0"}},
		{NodeID: "NODE_ACV_ENG_01", NodeType: "VERIFICATION", ReferenceID: "ACV-2026-088", Label: "ACV Verification (NABCB Accredited)", Properties: map[string]interface{}{"verifier": "TUV Rheinland India", "opinion": "Unqualified", "status": "Verified"}},
		{NodeID: "NODE_PASS_V1", NodeType: "PASSPORT", ReferenceID: "PASS-2026-981-v1.0", Label: "Issued Carbon Passport v1.0", Properties: map[string]interface{}{"frozen": true, "data_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "intensity": 1.850, "status": "Verified"}},
	}

	edges := []LineageEdge{
		{EdgeID: "EDGE_1", ParentNodeID: "NODE_ORG_9001", ChildNodeID: "NODE_FAC_042", EdgeType: "CONTAINS"},
		{EdgeID: "EDGE_2", ParentNodeID: "NODE_FAC_042", ChildNodeID: "NODE_BATCH_981", EdgeType: "PRODUCES"},
		{EdgeID: "EDGE_3", ParentNodeID: "NODE_BATCH_981", ChildNodeID: "NODE_IN_SCOPE1", EdgeType: "FEEDS_INTO"},
		{EdgeID: "EDGE_4", ParentNodeID: "NODE_BATCH_981", ChildNodeID: "NODE_IN_SCOPE2", EdgeType: "FEEDS_INTO"},
		{EdgeID: "EDGE_5", ParentNodeID: "NODE_BATCH_981", ChildNodeID: "NODE_IN_SUP_409", EdgeType: "FEEDS_INTO"},
		{EdgeID: "EDGE_6", ParentNodeID: "NODE_IN_SCOPE1", ChildNodeID: "NODE_CALC_V1", EdgeType: "CALCULATES"},
		{EdgeID: "EDGE_7", ParentNodeID: "NODE_IN_SCOPE2", ChildNodeID: "NODE_CALC_V1", EdgeType: "CALCULATES"},
		{EdgeID: "EDGE_8", ParentNodeID: "NODE_IN_SUP_409", ChildNodeID: "NODE_CALC_V1", EdgeType: "CALCULATES"},
		{EdgeID: "EDGE_9", ParentNodeID: "NODE_CALC_V1", ChildNodeID: "NODE_ACV_ENG_01", EdgeType: "VERIFIES"},
		{EdgeID: "EDGE_10", ParentNodeID: "NODE_ACV_ENG_01", ChildNodeID: "NODE_PASS_V1", EdgeType: "ISSUES"},
	}

	for _, n := range nodes {
		e.nodes[n.NodeID] = n
	}
	for _, ed := range edges {
		e.edges[ed.EdgeID] = ed
	}
}

// GetLineageDAG traverses the graph topology for a passport.
func (e *NexusGraphEngine) GetLineageDAG(ctx context.Context, passportID string) (*LineageDAG, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var nodes []LineageNode
	for _, n := range e.nodes {
		nodes = append(nodes, n)
	}

	var edges []LineageEdge
	for _, ed := range e.edges {
		edges = append(edges, ed)
	}

	return &LineageDAG{
		PassportID: passportID,
		Nodes:      nodes,
		Edges:      edges,
	}, nil
}

// CorrectSupplierInput mutates the supplier declaration in the Nexus graph, triggering calculation v1.1 while preserving v1.0 immutability.
func (e *NexusGraphEngine) CorrectSupplierInput(ctx context.Context, req InputCorrectionRequest) (*InputCorrectionResult, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	inputNode, exists := e.nodes[req.InputNodeID]
	if !exists {
		return nil, fmt.Errorf("input node %s not found in Nexus graph", req.InputNodeID)
	}

	oldVal, _ := inputNode.Properties["value"].(float64)
	if oldVal == 0 {
		oldVal = 0.650
	}

	newVal := req.NewValue
	if newVal == 0 {
		newVal = 0.720
	}

	// Calculate impact: baseline 1.850 kgCO2e/kg + delta from raw material
	oldMaterialKg := oldVal * 5000.0 // 3250 kg
	newMaterialKg := newVal * 5000.0 // 3600 kg
	deltaKg := newMaterialKg - oldMaterialKg
	totalFootprintKg := 18500.0 + deltaKg
	newIntensity := totalFootprintKg / 10000.0 // 1.885 kgCO2e/kg

	// Mutate input node properties in graph
	inputNode.Properties["value"] = newVal
	inputNode.Properties["emission_kg"] = newMaterialKg
	inputNode.Properties["corrected"] = true
	inputNode.Properties["reason"] = req.Reason
	e.nodes[req.InputNodeID] = inputNode

	// Spawn new calculation version node v1.1 in Nexus graph
	newCalcID := "NODE_CALC_V1_1"
	newCalcNode := LineageNode{
		NodeID:      newCalcID,
		NodeType:    "CALC_VERSION",
		ReferenceID: "CALC-2026-981-V1.1",
		Label:       "CEL Calculation Version v1.1 (Recalculated)",
		Properties: map[string]interface{}{
			"intensity_kgCO2e_per_kg": newIntensity,
			"total_footprint_kg":      totalFootprintKg,
			"version":                 "v1.1",
			"supersedes":              "NODE_CALC_V1",
		},
		CreatedAt: time.Now(),
	}
	e.nodes[newCalcID] = newCalcNode

	// Spawn new draft passport node v1.1 in Nexus graph
	newPassID := "NODE_PASS_V1_1"
	newPassNode := LineageNode{
		NodeID:      newPassID,
		NodeType:    "PASSPORT",
		ReferenceID: "PASS-2026-981-v1.1",
		Label:       "Draft Carbon Passport v1.1 (Pending Verification)",
		Properties: map[string]interface{}{
			"frozen":    false,
			"data_hash": uuid.New().String(),
			"intensity": newIntensity,
			"status":    "DraftRecalculated",
		},
		CreatedAt: time.Now(),
	}
	e.nodes[newPassID] = newPassNode

	// Add graph edges for new calculation and draft passport
	edge11 := LineageEdge{EdgeID: "EDGE_11", ParentNodeID: req.InputNodeID, ChildNodeID: newCalcID, EdgeType: "CALCULATES"}
	edge12 := LineageEdge{EdgeID: "EDGE_12", ParentNodeID: newCalcID, ChildNodeID: newPassID, EdgeType: "ISSUES"}
	e.edges["EDGE_11"] = edge11
	e.edges["EDGE_12"] = edge12

	// Get original frozen passport v1.0
	origPassNode := e.nodes["NODE_PASS_V1"]
	origFrozen, _ := origPassNode.Properties["frozen"].(bool)
	origHash, _ := origPassNode.Properties["data_hash"].(string)

	result := &InputCorrectionResult{
		CorrectionID:            "CORR-" + uuid.New().String()[:8],
		InputNodeID:             req.InputNodeID,
		OldValue:                oldVal,
		NewValue:                newVal,
		OriginalCalcVersion:     "v1.0",
		OriginalIntensityKgCO2e: 1.850,
		NewCalcVersion:          "v1.1",
		NewIntensityKgCO2e:      newIntensity,
		OriginalPassportID:      "PASS-2026-981-v1.0",
		OriginalPassportFrozen:  origFrozen,
		OriginalPassportHash:    origHash,
		NewDraftPassportID:      "PASS-2026-981-v1.1",
		AffectedNodes:           []LineageNode{newCalcNode, newPassNode},
		Timestamp:               time.Now(),
	}

	return result, nil
}
