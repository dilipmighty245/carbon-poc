package nexus

import (
	"context"
	"testing"
	"time"

	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/tenant"
)

func TestProductReconciler_DirectReconcile(t *testing.T) {
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconciler(eng, celEng)

	tenantID := "test-tenant-rec"
	ctx := tenant.WithTenant(context.Background(), tenantID)

	prod := &ProductModel{
		Name:            "product-test-batch-001",
		TenantID:        tenantID,
		FacilityID:      "FAC-999",
		BatchID:         "BATCH-REC-001",
		ProductName:     "Green Steel Coil",
		CommodityType:   "Steel",
		ActivityDataRaw: `{"fuel_consumed_liters":1000,"electricity_consumed_kwh":5000,"raw_material_kg":2000,"transport_km":100}`,
		Phase:           "Pending",
	}

	if err := eng.SaveProduct(ctx, prod); err != nil {
		t.Fatalf("failed to save test product: %v", err)
	}

	passport, err := reconciler.ReconcileProduct(ctx, prod)
	if err != nil {
		t.Fatalf("reconcile product failed: %v", err)
	}
	if passport == nil {
		t.Fatal("expected non-nil carbon passport model")
	}
	if passport.TotalFootprintKg <= 0 {
		t.Errorf("expected positive total footprint, got %f", passport.TotalFootprintKg)
	}
	if passport.VerificationStatus != "Draft" {
		t.Errorf("expected status Draft, got %s", passport.VerificationStatus)
	}

	// Verify product state updated in Nexus
	savedProd, err := eng.GetProduct(ctx, prod.Name)
	if err != nil {
		t.Fatalf("failed to get product after reconciliation: %v", err)
	}
	if savedProd.Phase != "Draft" {
		t.Errorf("expected product phase Draft, got %s", savedProd.Phase)
	}
	if savedProd.PassportID != passport.PassportID {
		t.Errorf("expected passport ID %s, got %s", passport.PassportID, savedProd.PassportID)
	}
	if savedProd.TotalFootprintKg != passport.TotalFootprintKg {
		t.Errorf("expected footprint %f, got %f", passport.TotalFootprintKg, savedProd.TotalFootprintKg)
	}
}

func TestProductReconciler_DirectReconcileNode(t *testing.T) {
	fakeClient := nexus_client.NewFakeClient()
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconcilerWithClient(fakeClient, eng, celEng)

	ctx := context.Background()
	_, err := EnsureGraphRoots(ctx, fakeClient)
	if err != nil {
		t.Fatalf("EnsureGraphRoots failed: %v", err)
	}

	tenantID := "org_test_node_rec"
	batchID := "batch-node-001"
	prodSpec := inventoryv1.ProductSpec{
		ProductID:       batchID,
		ProductName:     "Recycled Aluminium Ingot",
		CommodityType:   "Aluminium",
		BatchID:         batchID,
		TenantID:        tenantID,
		FacilityID:      "FAC-ALU-01",
		ActivityDataRaw: `{"fuel_consumed_liters":800,"electricity_consumed_kwh":3000}`,
		Phase:           "Pending",
	}

	prodNode, err := CreateProductNode(ctx, fakeClient, tenantID, prodSpec)
	if err != nil {
		t.Fatalf("CreateProductNode failed: %v", err)
	}

	passport, err := reconciler.ReconcileProductNode(ctx, prodNode)
	if err != nil {
		t.Fatalf("ReconcileProductNode failed: %v", err)
	}
	if passport == nil {
		t.Fatal("expected passport from ReconcileProductNode")
	}

	if prodNode.Spec.Phase != "Draft" {
		t.Errorf("expected node phase Draft, got %s", prodNode.Spec.Phase)
	}
	if prodNode.Spec.PassportID == "" {
		t.Error("expected node passport ID to be populated")
	}
	if prodNode.Spec.TotalFootprintKg <= 0 {
		t.Errorf("expected positive node footprint, got %f", prodNode.Spec.TotalFootprintKg)
	}

	// Verify idempotency: calling ReconcileProductNode again returns existing without failure
	passport2, err := reconciler.ReconcileProductNode(ctx, prodNode)
	if err != nil {
		t.Fatalf("idempotent ReconcileProductNode call failed: %v", err)
	}
	if passport2 == nil || passport2.PassportID != passport.PassportID {
		t.Errorf("expected same passport on idempotent call, got %v", passport2)
	}
}

func TestProductReconciler_InformerCallback_ProcessProductAdd(t *testing.T) {
	fakeClient := nexus_client.NewFakeClient()
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconcilerWithClient(fakeClient, eng, celEng)

	ctx := context.Background()
	_, _ = EnsureGraphRoots(ctx, fakeClient)

	tenantID := "org_test_add_cb"
	batchID := "batch-add-cb-002"
	prodSpec := inventoryv1.ProductSpec{
		ProductID:       batchID,
		ProductName:     "Decarbonised Steel Rebar",
		CommodityType:   "Steel",
		BatchID:         batchID,
		TenantID:        tenantID,
		FacilityID:      "FAC-STEEL-02",
		ActivityDataRaw: `{"fuel_consumed_liters":1200,"electricity_consumed_kwh":4500,"raw_material_kg":2500}`,
		Phase:           "Pending",
	}

	prodNode, err := CreateProductNode(ctx, fakeClient, tenantID, prodSpec)
	if err != nil {
		t.Fatalf("CreateProductNode failed: %v", err)
	}

	// Trigger the Informer Add callback directly
	reconciler.ProcessProductAdd(prodNode)

	if prodNode.Spec.Phase != "Draft" {
		t.Errorf("expected product phase Draft after ProcessProductAdd, got %s", prodNode.Spec.Phase)
	}
	if prodNode.Spec.PassportID == "" {
		t.Error("expected passport ID to be populated after ProcessProductAdd")
	}
}

func TestProductReconciler_InformerCallback_ProcessProductUpdate(t *testing.T) {
	fakeClient := nexus_client.NewFakeClient()
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconcilerWithClient(fakeClient, eng, celEng)

	ctx := context.Background()
	_, _ = EnsureGraphRoots(ctx, fakeClient)

	tenantID := "org_test_update_cb"
	batchID := "batch-update-cb-003"
	prodSpec := inventoryv1.ProductSpec{
		ProductID:       batchID,
		ProductName:     "Specialty Cement Mix",
		CommodityType:   "Cement",
		BatchID:         batchID,
		TenantID:        tenantID,
		FacilityID:      "FAC-CEM-03",
		ActivityDataRaw: `{"fuel_liters":300,"electricity_kwh":800,"raw_material_kg":1500}`,
		Phase:           "Pending",
	}

	prodNode, err := CreateProductNode(ctx, fakeClient, tenantID, prodSpec)
	if err != nil {
		t.Fatalf("CreateProductNode failed: %v", err)
	}

	// Trigger Update callback with newNode in Pending phase
	reconciler.ProcessProductUpdate(nil, prodNode)

	if prodNode.Spec.Phase != "Draft" {
		t.Errorf("expected product phase Draft after ProcessProductUpdate, got %s", prodNode.Spec.Phase)
	}

	// Test Update callback with already Calculated node: should be a no-op
	currFootprint := prodNode.Spec.TotalFootprintKg
	reconciler.ProcessProductUpdate(prodNode, prodNode)
	if prodNode.Spec.TotalFootprintKg != currFootprint {
		t.Errorf("expected footprint unchanged on no-op update, got %f", prodNode.Spec.TotalFootprintKg)
	}
}

func TestProductReconciler_InformerCallback_ProcessProductDelete(t *testing.T) {
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconciler(eng, celEng)

	tenantID := "org_test_delete_cb"
	batchID := "batch-del-cb-004"
	ctx := tenant.WithTenant(context.Background(), tenantID)

	prod := &ProductModel{
		Name:            "product-del-004",
		TenantID:        tenantID,
		FacilityID:      "FAC-DEL-04",
		BatchID:         batchID,
		ProductName:     "Test Deleted Product",
		CommodityType:   "Steel",
		ActivityDataRaw: `{"fuel_consumed_liters":100}`,
		Phase:           "Pending",
	}
	_ = eng.SaveProduct(ctx, prod)
	passport, err := reconciler.ReconcileProduct(ctx, prod)
	if err != nil || passport == nil {
		t.Fatalf("failed to reconcile before delete: %v", err)
	}

	// Verify passport exists
	p, err := eng.GetPassportByID(ctx, passport.PassportID)
	if err != nil || p == nil {
		t.Fatalf("passport should exist before deletion: %v", err)
	}

	fakeClient := nexus_client.NewFakeClient()
	_, _ = EnsureGraphRoots(ctx, fakeClient)
	prodNode, _ := CreateProductNode(ctx, fakeClient, tenantID, inventoryv1.ProductSpec{
		ProductID:  batchID,
		BatchID:    batchID,
		TenantID:   tenantID,
		PassportID: passport.PassportID,
	})

	// Trigger delete callback
	reconciler.ProcessProductDelete(prodNode)

	// Verify passport deleted
	deletedP, _ := eng.GetPassportByID(ctx, passport.PassportID)
	if deletedP != nil {
		t.Error("expected passport to be deleted after ProcessProductDelete")
	}
}

func TestProductReconciler_PeriodicSweepLoop(t *testing.T) {
	fakeClient := nexus_client.NewFakeClient()
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconcilerWithClient(fakeClient, eng, celEng)
	// Accelerate sweep ticker for testing
	reconciler.SetSweepPeriod(30 * time.Millisecond)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	_, _ = EnsureGraphRoots(ctx, fakeClient)

	tenantID := "test-tenant-sweep"
	prodSpec := inventoryv1.ProductSpec{
		ProductID:       "product-test-sweep-005",
		TenantID:        tenantID,
		FacilityID:      "FAC-SWEEP-05",
		BatchID:         "BATCH-SWEEP-005",
		ProductName:     "Organic Cocoa Beans",
		CommodityType:   "Cocoa",
		ActivityDataRaw: `{"fuel_consumed_liters":500,"electricity_consumed_kwh":2000}`,
		Phase:           "Pending",
	}

	prodNode, err := CreateProductNode(ctx, fakeClient, tenantID, prodSpec)
	if err != nil {
		t.Fatalf("failed to create product node: %v", err)
	}

	reconciler.Start(ctx)
	defer reconciler.Stop()

	// Wait for periodic sweep loop to pick up and reconcile the pending product
	var updatedNode *nexus_client.InventoryProduct
	for i := 0; i < 40; i++ {
		time.Sleep(25 * time.Millisecond)
		updatedNode, err = GetProductNode(ctx, fakeClient, tenantID, prodNode.DisplayName())
		if err == nil && updatedNode != nil && (updatedNode.Spec.Phase == "Draft" || updatedNode.Spec.Phase == "Calculated") {
			break
		}
	}

	currentPhase := "nil"
	if updatedNode != nil {
		currentPhase = updatedNode.Spec.Phase
	}
	if updatedNode == nil || (updatedNode.Spec.Phase != "Draft" && updatedNode.Spec.Phase != "Calculated") {
		t.Fatalf("periodic sweep loop failed to reconcile product, current phase: %v", currentPhase)
	}
	if updatedNode.Spec.PassportID == "" {
		t.Errorf("expected product passport_id to be populated by sweep loop")
	}
}

func TestProductReconciler_CustomRulebook(t *testing.T) {
	eng := GetNexusEngine()
	celEng := engine.NewCELEngine()
	reconciler := NewProductReconciler(eng, celEng)

	tenantID := "test-tenant-rulebook"
	ctx := tenant.WithTenant(context.Background(), tenantID)

	rb := &RulebookModel{
		ID:             "custom-cement-rb",
		Name:           "custom-cement-rb",
		CommodityType:  "Cement",
		Scope1Formula:  "fuel_liters * 3.0",
		Scope2Formula:  "electricity_kwh * 0.5",
		Scope3Formula:  "raw_material_kg * 0.1",
		FunctionalUnit: "kg CO2e per ton",
	}
	if err := eng.SaveRulebook(ctx, rb); err != nil {
		t.Fatalf("failed to save custom rulebook: %v", err)
	}

	prod := &ProductModel{
		Name:            "product-custom-cement-003",
		TenantID:        tenantID,
		FacilityID:      "FAC-777",
		BatchID:         "BATCH-CEMENT-003",
		ProductName:     "Portland Cement",
		CommodityType:   "Cement",
		RulebookRefName: "custom-cement-rb",
		ActivityDataRaw: `{"fuel_liters":100,"electricity_kwh":200,"raw_material_kg":500}`,
		Phase:           "Pending",
	}

	passport, err := reconciler.ReconcileProduct(ctx, prod)
	if err != nil {
		t.Fatalf("reconciliation failed: %v", err)
	}
	if passport == nil {
		t.Fatal("expected passport")
	}

	// 100*3.0 (300) + 200*0.5 (100) + 500*0.1 (50) = 450
	expectedTotal := 450.0
	if passport.TotalFootprintKg != expectedTotal {
		t.Errorf("expected total footprint %f, got %f", expectedTotal, passport.TotalFootprintKg)
	}
}
