package v1alpha1

import (
	"encoding/json"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// TestProductSpec validates that ProductSpec has all required fields with correct JSON tags.
func TestProductSpec(t *testing.T) {
	spec := ProductSpec{
		TenantID:        "tenant-1",
		FacilityID:      "facility-1",
		BatchID:         "batch-1",
		ProductName:     "Cocoa Beans",
		CommodityType:   "Cocoa",
		ActivityDataRaw: `{"fuel_l":100}`,
		RulebookRef: LocalObjectReference{
			Name:      "cocoa-rulebook",
			Namespace: "default",
		},
	}

	b, err := json.Marshal(spec)
	if err != nil {
		t.Fatalf("ProductSpec marshal error: %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("ProductSpec unmarshal error: %v", err)
	}

	requiredKeys := []string{"tenantID", "facilityID", "batchID", "productName", "commodityType", "activityDataRaw", "rulebookRef"}
	for _, k := range requiredKeys {
		if _, ok := m[k]; !ok {
			t.Errorf("ProductSpec missing JSON key: %s", k)
		}
	}
}

// TestProductStatus validates ProductStatus fields and JSON tags.
func TestProductStatus(t *testing.T) {
	status := ProductStatus{
		Phase: "Calculated",
		PassportRef: LocalObjectReference{
			Name:      "passport-1",
			Namespace: "default",
		},
		TotalFootprintKg: 42.5,
		DataHash:         "abc123",
		LastUpdated:      metav1.Now(),
	}

	b, err := json.Marshal(status)
	if err != nil {
		t.Fatalf("ProductStatus marshal error: %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("ProductStatus unmarshal error: %v", err)
	}

	requiredKeys := []string{"phase", "passportRef", "totalFootprintKg", "dataHash", "lastUpdated"}
	for _, k := range requiredKeys {
		if _, ok := m[k]; !ok {
			t.Errorf("ProductStatus missing JSON key: %s", k)
		}
	}
}

// TestProductDeepCopy validates DeepCopy does not share pointer references.
func TestProductDeepCopy(t *testing.T) {
	p := &Product{
		Spec: ProductSpec{
			TenantID:      "t1",
			RulebookRef:   LocalObjectReference{Name: "rb", Namespace: "ns"},
		},
		Status: ProductStatus{
			Phase:       "Pending",
			PassportRef: LocalObjectReference{Name: "pp", Namespace: "ns"},
		},
	}
	cp := p.DeepCopy()
	cp.Spec.TenantID = "mutated"
	if p.Spec.TenantID == "mutated" {
		t.Error("DeepCopy shares Spec pointer")
	}
}

// TestCarbonPassportSpec validates updated CarbonPassportSpec fields.
func TestCarbonPassportSpec(t *testing.T) {
	spec := CarbonPassportSpec{
		TenantID:           "tenant-1",
		FacilityID:         "facility-1",
		BatchID:            "batch-1",
		CommodityType:      "Cocoa",
		ProductRef:         "product-1",
		DataHash:           "sha256:abc",
		Scope1KgCO2e:       10.0,
		Scope2KgCO2e:       5.0,
		Scope3KgCO2e:       2.0,
		TotalFootprintKg:   17.0,
		CalculationDetails: `{"method":"ghg"}`,
	}

	b, err := json.Marshal(spec)
	if err != nil {
		t.Fatalf("CarbonPassportSpec marshal error: %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("CarbonPassportSpec unmarshal error: %v", err)
	}

	requiredKeys := []string{
		"tenantID", "facilityID", "batchID", "commodityType",
		"productRef", "dataHash", "scope1KgCO2e", "scope2KgCO2e", "scope3KgCO2e",
		"totalFootprintKg", "calculationDetails",
	}
	for _, k := range requiredKeys {
		if _, ok := m[k]; !ok {
			t.Errorf("CarbonPassportSpec missing JSON key: %s", k)
		}
	}
}

// TestCarbonPassportStatus validates updated CarbonPassportStatus fields.
func TestCarbonPassportStatus(t *testing.T) {
	status := CarbonPassportStatus{
		Phase:            "Verified",
		PassportID:       "pp-001",
		CryptographicHash: "sha256:xyz",
		IssuedAt:         metav1.Now(),
		LastUpdated:      metav1.Now(),
	}

	b, err := json.Marshal(status)
	if err != nil {
		t.Fatalf("CarbonPassportStatus marshal error: %v", err)
	}

	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		t.Fatalf("CarbonPassportStatus unmarshal error: %v", err)
	}

	requiredKeys := []string{"phase", "passportID", "cryptographicHash", "issuedAt", "lastUpdated"}
	for _, k := range requiredKeys {
		if _, ok := m[k]; !ok {
			t.Errorf("CarbonPassportStatus missing JSON key: %s", k)
		}
	}
}
