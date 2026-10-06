package nexus

import (
	"context"
	"testing"

	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
)

func TestNexusClient_GraphRootsAndProductNode(t *testing.T) {
	client := nexus_client.NewFakeClient()
	ctx := context.Background()

	// 1. Ensure Root and singleton branches
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		t.Fatalf("EnsureGraphRoots failed: %v", err)
	}
	if root == nil {
		t.Fatal("expected non-nil root node")
	}

	// 2. Ensure Tenant node
	tenantID := "org_test_saurient"
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		t.Fatalf("EnsureTenantNode failed: %v", err)
	}
	if tenantNode == nil {
		t.Fatal("expected non-nil tenant node")
	}

	// 3. Create Product node under Tenant
	batchID := "batch-alu-test-001"
	prodSpec := inventoryv1.ProductSpec{
		ProductID:       batchID,
		ProductName:     "Primary Low Carbon Aluminium",
		CommodityType:   "Aluminium",
		BatchID:         batchID,
		TenantID:        tenantID,
		FacilityID:      "fac-nordic-01",
		ActivityDataRaw: `{"fuel_consumed_liters":1200,"electricity_consumed_kwh":4500}`,
		Phase:           "Pending",
	}

	productNode, err := CreateProductNode(ctx, client, tenantID, prodSpec)
	if err != nil {
		t.Fatalf("CreateProductNode failed: %v", err)
	}
	if productNode == nil {
		t.Fatal("expected non-nil product node")
	}
	if productNode.Spec.Phase != "Pending" {
		t.Errorf("expected phase Pending, got %s", productNode.Spec.Phase)
	}

	// 4. Create CarbonPassport node and link to Product node
	passportID := "passport-test-uuid-001"
	passportSpec := runtimev1.CarbonPassportSpec{
		PassportID:         passportID,
		TenantID:           tenantID,
		FacilityID:         "fac-nordic-01",
		BatchID:            batchID,
		CommodityType:      "Aluminium",
		TotalFootprintKg:   18500.5,
		Scope1Kg:           3200.0,
		Scope2Kg:           15300.5,
		VerificationStatus: "Calculated",
		DataHash:           "hash-12345",
	}

	passportNode, err := CreatePassportNode(ctx, client, passportSpec, productNode)
	if err != nil {
		t.Fatalf("CreatePassportNode failed: %v", err)
	}
	if passportNode == nil {
		t.Fatal("expected non-nil passport node")
	}
	if passportNode.Spec.TotalFootprintKg != 18500.5 {
		t.Errorf("expected footprint 18500.5, got %f", passportNode.Spec.TotalFootprintKg)
	}

	// 5. Update Product node status to Calculated
	productNode.Spec.Phase = "Calculated"
	productNode.Spec.PassportID = passportID
	productNode.Spec.TotalFootprintKg = 18500.5
	if err := productNode.Update(ctx); err != nil {
		t.Fatalf("failed to update product node: %v", err)
	}

	// 6. Test User Node CRUD under Tenant
	userSpec := inventoryv1.UserSpec{
		UserID:        "USR-TEST-001",
		TenantID:      tenantID,
		Name:          "Amara Okafor",
		Email:         "a.okafor@ecoglobal.com",
		Role:          "Admin",
		FacilityScope: "All Facilities",
		LastLogin:     "2026-10-06T12:00:00Z",
		Status:        "Active",
	}

	uNode, err := CreateUserNode(ctx, client, tenantID, userSpec)
	if err != nil {
		t.Fatalf("CreateUserNode failed: %v", err)
	}
	if uNode == nil {
		t.Fatal("expected non-nil user node")
	}

	// Read by ID
	fetchedUser, err := GetUserNode(ctx, client, tenantID, "USR-TEST-001")
	if err != nil || fetchedUser == nil {
		t.Fatalf("GetUserNode failed: %v", err)
	}
	if fetchedUser.Spec.Email != "a.okafor@ecoglobal.com" {
		t.Errorf("expected email a.okafor@ecoglobal.com, got %s", fetchedUser.Spec.Email)
	}

	// Read by Email
	emailUser, err := GetUserNodeByEmail(ctx, client, tenantID, "a.okafor@ecoglobal.com")
	if err != nil || emailUser == nil {
		t.Fatalf("GetUserNodeByEmail failed: %v", err)
	}

	// List
	userList, err := ListUserNodes(ctx, client, tenantID)
	if err != nil || len(userList) == 0 {
		t.Fatalf("ListUserNodes failed: %v, count: %d", err, len(userList))
	}

	// Update Role
	if err := UpdateUserRoleNode(ctx, client, tenantID, "USR-TEST-001", "Sustainability Lead"); err != nil {
		t.Fatalf("UpdateUserRoleNode failed: %v", err)
	}
	updatedUser, _ := GetUserNode(ctx, client, tenantID, "USR-TEST-001")
	if updatedUser.Spec.Role != "Sustainability Lead" {
		t.Errorf("expected role Sustainability Lead, got %s", updatedUser.Spec.Role)
	}

	// Model conversion
	uModel := UserModelFromNode(updatedUser)
	if uModel == nil || uModel.Name != "Amara Okafor" {
		t.Fatalf("UserModelFromNode failed: %+v", uModel)
	}

	// Delete
	if err := DeleteUserNode(ctx, client, tenantID, "USR-TEST-001"); err != nil {
		t.Fatalf("DeleteUserNode failed: %v", err)
	}
}
