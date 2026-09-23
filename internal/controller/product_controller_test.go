package controller

import (
	"context"
	"encoding/json"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"

	saurientv1alpha1 "saurient-platform/api/v1alpha1"
	"saurient-platform/internal/engine"
)

func buildScheme(t *testing.T) *runtime.Scheme {
	t.Helper()
	s := runtime.NewScheme()
	if err := saurientv1alpha1.AddToScheme(s); err != nil {
		t.Fatalf("AddToScheme: %v", err)
	}
	return s
}

func activityJSON(t *testing.T, data map[string]interface{}) string {
	t.Helper()
	b, err := json.Marshal(data)
	if err != nil {
		t.Fatalf("marshal activityData: %v", err)
	}
	return string(b)
}

// TestProductReconciler_NotFound ensures a missing Product CR is silently ignored.
func TestProductReconciler_NotFound(t *testing.T) {
	scheme := buildScheme(t)
	fakeClient := fake.NewClientBuilder().WithScheme(scheme).Build()

	r := &ProductReconciler{
		Client:    fakeClient,
		Scheme:    scheme,
		CELEngine: engine.NewCELEngine(),
	}

	result, err := r.Reconcile(context.Background(), ctrl.Request{
		NamespacedName: types.NamespacedName{Name: "nonexistent", Namespace: "default"},
	})
	if err != nil {
		t.Errorf("expected no error for NotFound, got: %v", err)
	}
	if result.Requeue {
		t.Error("expected no requeue for NotFound")
	}
}

// TestProductReconciler_FallbackRulebook_Cement verifies that when no CalculationRulebook
// CR is present the reconciler uses the built-in Cement fallback formulas and creates a
// child CarbonPassport CR with a valid data hash.
func TestProductReconciler_FallbackRulebook_Cement(t *testing.T) {
	scheme := buildScheme(t)

	actData := activityJSON(t, map[string]interface{}{
		"fuel_liters":       500.0,
		"fuel_ef":           2.68,
		"limestone_tons":    10.0,
		"calcination_ef":    440.0,
		"electricity_kwh":   2000.0,
		"grid_ef":           0.85,
		"renewable_ppa_kwh": 500.0,
		"ppa_offset_ef":     0.85,
		"raw_material_kg":   5000.0,
		"material_ef":       0.12,
		"freight_ton_km":    1000.0,
		"transport_ef":      0.15,
	})

	product := &saurientv1alpha1.Product{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "cement-batch-1",
			Namespace: "default",
			UID:       "test-uid-cement",
		},
		Spec: saurientv1alpha1.ProductSpec{
			TenantID:        "tenant-abc",
			FacilityID:      "facility-1",
			BatchID:         "batch-001",
			ProductName:     "Portland Cement",
			CommodityType:   "Cement",
			ActivityDataRaw: actData,
			RulebookRef: saurientv1alpha1.LocalObjectReference{
				Name:      "",
				Namespace: "default",
			},
		},
	}

	fakeClient := fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(product).
		WithStatusSubresource(product).
		Build()

	r := &ProductReconciler{
		Client:    fakeClient,
		Scheme:    scheme,
		CELEngine: engine.NewCELEngine(),
	}

	_, err := r.Reconcile(context.Background(), ctrl.Request{
		NamespacedName: types.NamespacedName{Name: "cement-batch-1", Namespace: "default"},
	})
	if err != nil {
		t.Fatalf("Reconcile failed: %v", err)
	}

	// Verify child CarbonPassport CR was created.
	var passportList saurientv1alpha1.CarbonPassportList
	if err := fakeClient.List(context.Background(), &passportList); err != nil {
		t.Fatalf("List CarbonPassports: %v", err)
	}
	if len(passportList.Items) == 0 {
		t.Fatal("expected a CarbonPassport CR to be created, got none")
	}

	cp := passportList.Items[0]
	if cp.Spec.TenantID != "tenant-abc" {
		t.Errorf("expected tenantID=tenant-abc, got %s", cp.Spec.TenantID)
	}
	if cp.Spec.TotalFootprintKg <= 0 {
		t.Errorf("expected positive TotalFootprintKg, got %f", cp.Spec.TotalFootprintKg)
	}
	if len(cp.Spec.DataHash) != 64 {
		t.Errorf("expected 64-char SHA-256 hash, got len=%d", len(cp.Spec.DataHash))
	}

	// Owner reference must point to the Product.
	if len(cp.OwnerReferences) == 0 {
		t.Error("expected ownerReference on CarbonPassport, got none")
	}
	if cp.OwnerReferences[0].Name != "cement-batch-1" {
		t.Errorf("expected owner name cement-batch-1, got %s", cp.OwnerReferences[0].Name)
	}

	// Product status should be updated.
	var updatedProduct saurientv1alpha1.Product
	if err := fakeClient.Get(context.Background(), types.NamespacedName{Name: "cement-batch-1", Namespace: "default"}, &updatedProduct); err != nil {
		t.Fatalf("Get Product: %v", err)
	}
	if updatedProduct.Status.Phase != "Calculated" {
		t.Errorf("expected Product.Status.Phase=Calculated, got %s", updatedProduct.Status.Phase)
	}
	if updatedProduct.Status.PassportRef.Name != cp.Name {
		t.Errorf("expected PassportRef.Name=%s, got %s", cp.Name, updatedProduct.Status.PassportRef.Name)
	}
	if updatedProduct.Status.TotalFootprintKg <= 0 {
		t.Errorf("expected positive TotalFootprintKg on Product status, got %f", updatedProduct.Status.TotalFootprintKg)
	}
}

// TestProductReconciler_ReferencedRulebook verifies that a CalculationRulebook CR
// referenced by product.Spec.RulebookRef is preferred over the fallback defaults.
func TestProductReconciler_ReferencedRulebook(t *testing.T) {
	scheme := buildScheme(t)

	actData := activityJSON(t, map[string]interface{}{
		"fuel_consumed_liters":   100.0,
		"electricity_consumed_kwh": 200.0,
		"raw_material_kg":        300.0,
		"packaging_qty":          10.0,
		"transport_km":           50.0,
	})

	rulebook := &saurientv1alpha1.CalculationRulebook{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "cocoa-rulebook",
			Namespace: "default",
		},
		Spec: saurientv1alpha1.CalculationRulebookSpec{
			CommodityType:  "Cocoa",
			Version:        "v1.2.0",
			Scope1Formula:  "fuel_consumed_liters * 2.68",
			Scope2Formula:  "electricity_consumed_kwh * 0.45",
			Scope3Formula:  "(raw_material_kg * 0.175) + (packaging_qty * 1.875) + (transport_km * 0.12)",
			FunctionalUnit: "kg CO2e per kg",
			BatchQuantity:  1000.0,
		},
	}

	product := &saurientv1alpha1.Product{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "cocoa-batch-1",
			Namespace: "default",
			UID:       "test-uid-cocoa",
		},
		Spec: saurientv1alpha1.ProductSpec{
			TenantID:        "tenant-xyz",
			FacilityID:      "facility-2",
			BatchID:         "batch-cocoa-001",
			ProductName:     "Cocoa Beans",
			CommodityType:   "Cocoa",
			ActivityDataRaw: actData,
			RulebookRef: saurientv1alpha1.LocalObjectReference{
				Name:      "cocoa-rulebook",
				Namespace: "default",
			},
		},
	}

	fakeClient := fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(rulebook, product).
		WithStatusSubresource(product).
		Build()

	r := &ProductReconciler{
		Client:    fakeClient,
		Scheme:    scheme,
		CELEngine: engine.NewCELEngine(),
	}

	_, err := r.Reconcile(context.Background(), ctrl.Request{
		NamespacedName: types.NamespacedName{Name: "cocoa-batch-1", Namespace: "default"},
	})
	if err != nil {
		t.Fatalf("Reconcile failed: %v", err)
	}

	// Scope 1 = 100 * 2.68 = 268
	// Scope 2 = 200 * 0.45 = 90
	// Scope 3 = (300 * 0.175) + (10 * 1.875) + (50 * 0.12) = 52.5 + 18.75 + 6 = 77.25
	// Total = 268 + 90 + 77.25 = 435.25
	expectedTotal := 268.0 + 90.0 + 77.25

	var updatedProduct saurientv1alpha1.Product
	if err := fakeClient.Get(context.Background(), types.NamespacedName{Name: "cocoa-batch-1", Namespace: "default"}, &updatedProduct); err != nil {
		t.Fatalf("Get Product: %v", err)
	}
	if updatedProduct.Status.TotalFootprintKg != expectedTotal {
		t.Errorf("expected TotalFootprintKg=%f, got %f", expectedTotal, updatedProduct.Status.TotalFootprintKg)
	}
	if updatedProduct.Status.Phase != "Calculated" {
		t.Errorf("expected Phase=Calculated, got %s", updatedProduct.Status.Phase)
	}
}

// TestProductReconciler_InvalidActivityDataRaw ensures a JSON parse error sets Phase=Failed.
func TestProductReconciler_InvalidActivityDataRaw(t *testing.T) {
	scheme := buildScheme(t)

	product := &saurientv1alpha1.Product{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "bad-json",
			Namespace: "default",
			UID:       "uid-bad",
		},
		Spec: saurientv1alpha1.ProductSpec{
			TenantID:        "tenant-err",
			ActivityDataRaw: "{invalid json}",
			CommodityType:   "Cement",
		},
	}

	fakeClient := fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(product).
		WithStatusSubresource(product).
		Build()

	r := &ProductReconciler{
		Client:    fakeClient,
		Scheme:    scheme,
		CELEngine: engine.NewCELEngine(),
	}

	_, err := r.Reconcile(context.Background(), ctrl.Request{
		NamespacedName: types.NamespacedName{Name: "bad-json", Namespace: "default"},
	})
	if err == nil {
		t.Error("expected an error for invalid ActivityDataRaw, got nil")
	}

	var updatedProduct saurientv1alpha1.Product
	if getErr := fakeClient.Get(context.Background(), types.NamespacedName{Name: "bad-json", Namespace: "default"}, &updatedProduct); getErr != nil {
		t.Fatalf("Get Product: %v", getErr)
	}
	if updatedProduct.Status.Phase != "Failed" {
		t.Errorf("expected Phase=Failed, got %s", updatedProduct.Status.Phase)
	}
}

// TestProductReconciler_IdempotentReconcile verifies that re-reconciling with the same
// data hash is a no-op (no duplicate CarbonPassport CRs are created).
func TestProductReconciler_IdempotentReconcile(t *testing.T) {
	scheme := buildScheme(t)

	actData := activityJSON(t, map[string]interface{}{
		"scope_1_kg_co2e": 100.0,
		"scope_2_kg_co2e": 50.0,
		"scope_3_kg_co2e": 25.0,
	})

	product := &saurientv1alpha1.Product{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "idempotent-prod",
			Namespace: "default",
			UID:       "uid-idempotent",
		},
		Spec: saurientv1alpha1.ProductSpec{
			TenantID:        "tenant-idem",
			FacilityID:      "fac-1",
			BatchID:         "b-1",
			ProductName:     "Generic",
			CommodityType:   "Generic",
			ActivityDataRaw: actData,
		},
	}

	fakeClient := fake.NewClientBuilder().
		WithScheme(scheme).
		WithObjects(product).
		WithStatusSubresource(product).
		Build()

	r := &ProductReconciler{
		Client:    fakeClient,
		Scheme:    scheme,
		CELEngine: engine.NewCELEngine(),
	}

	req := ctrl.Request{NamespacedName: types.NamespacedName{Name: "idempotent-prod", Namespace: "default"}}

	// First reconcile.
	if _, err := r.Reconcile(context.Background(), req); err != nil {
		t.Fatalf("first Reconcile failed: %v", err)
	}

	// Second reconcile with the same data.
	if _, err := r.Reconcile(context.Background(), req); err != nil {
		t.Fatalf("second Reconcile failed: %v", err)
	}

	// Still only one CarbonPassport should exist.
	var passportList saurientv1alpha1.CarbonPassportList
	if err := fakeClient.List(context.Background(), &passportList); err != nil {
		t.Fatalf("List CarbonPassports: %v", err)
	}
	if len(passportList.Items) != 1 {
		t.Errorf("expected exactly 1 CarbonPassport, got %d", len(passportList.Items))
	}
}
