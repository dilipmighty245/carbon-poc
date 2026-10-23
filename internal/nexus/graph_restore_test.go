package nexus

import (
	"context"
	"fmt"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	k8stesting "k8s.io/client-go/testing"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	rootv1 "saurient-platform/build/apis/root.saurient.io/v1"
	basefake "saurient-platform/build/client/clientset/versioned/fake"
	"saurient-platform/build/helper"
	nexusclient "saurient-platform/build/nexus-client"
)

func TestRestoreGraphRelationshipsAfterRestart(t *testing.T) {
	const tenantID = "org-restart-regression"
	metadata := func(resource, name string, ancestors map[string]string) metav1.ObjectMeta {
		labels := map[string]string{helper.DisplayNameLabel: name, helper.IsNameHashedLabel: "true"}
		for k, v := range ancestors {
			labels[k] = v
		}
		return metav1.ObjectMeta{Name: helper.GetHashedName(resource, labels, name), Labels: labels}
	}
	rootLabels := map[string]string{"roots.root.saurient.io": "default"}
	invLabels := map[string]string{"roots.root.saurient.io": "default", "inventories.inventory.saurient.io": "default"}
	facLabels := map[string]string{"roots.root.saurient.io": "default", "inventories.inventory.saurient.io": "default", "tenants.inventory.saurient.io": tenantID}
	objects := []runtime.Object{
		&rootv1.Root{ObjectMeta: metadata("roots.root.saurient.io", "default", nil)},
		&inventoryv1.Inventory{ObjectMeta: metadata("inventories.inventory.saurient.io", "default", rootLabels)},
		&inventoryv1.Tenant{ObjectMeta: metadata("tenants.inventory.saurient.io", tenantID, invLabels), Spec: inventoryv1.TenantSpec{TenantID: tenantID}},
		&inventoryv1.Facility{ObjectMeta: metadata("facilities.inventory.saurient.io", "FAC-RESTORE-1", facLabels), Spec: inventoryv1.FacilitySpec{FacilityID: "FAC-RESTORE-1", Name: "Saved plant"}},
		&inventoryv1.Facility{ObjectMeta: metadata("facilities.inventory.saurient.io", "FAC-RESTORE-2", facLabels), Spec: inventoryv1.FacilitySpec{FacilityID: "FAC-RESTORE-2", Name: "Second plant"}},
		&inventoryv1.Facility{ObjectMeta: metadata("facilities.inventory.saurient.io", "FAC-OTHER", map[string]string{"roots.root.saurient.io": "default", "inventories.inventory.saurient.io": "default", "tenants.inventory.saurient.io": "org-other-restart"})},
	}
	// Populate storage directly, without AddFacilities or informer callbacks, as on restart.
	client := nexusclient.NewWithBaseClient(basefake.NewSimpleClientset(objects...))
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	if children := client.GraphChildren("tenants.inventory.saurient.io", helper.GetHashedName("tenants.inventory.saurient.io", invLabels, tenantID), "facilities.inventory.saurient.io"); len(children) != 0 {
		t.Fatal("test must start with an empty facility relationship cache")
	}
	{
		if err := subscribeGraphRelationships(ctx, client); err != nil {
			t.Fatal(err)
		}
		facilities, err := ListFacilityNodes(ctx, client, tenantID)
		if err != nil {
			t.Fatal(err)
		}
		if len(facilities) != 2 {
			t.Fatalf("expected both persisted facilities, got %d", len(facilities))
		}
		if got := FacilityModelFromNode(facilities[0]).TenantID; got != tenantID {
			t.Fatalf("wrong tenant: %s", got)
		}
	}
	facility := objects[3].(*inventoryv1.Facility)
	if err := client.BaseClient().InventorySaurientV1().Facilities().Delete(ctx, facility.Name, metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(3 * time.Second)
	for {
		facilities, err := ListFacilityNodes(ctx, client, tenantID)
		if err == nil && len(facilities) == 1 {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("delete event did not update cache: %v", err)
		}
		time.Sleep(10 * time.Millisecond)
	}
	if _, err := client.BaseClient().InventorySaurientV1().Facilities().Create(ctx, facility, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	deadline = time.Now().Add(3 * time.Second)
	for {
		facilities, err := ListFacilityNodes(ctx, client, tenantID)
		if err == nil && len(facilities) == 2 {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("add event did not update cache: %v", err)
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func TestRestoreGraphRelationshipsReportsStorageFailure(t *testing.T) {
	base := basefake.NewSimpleClientset()
	base.PrependReactor("list", "*", func(k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, fmt.Errorf("storage unavailable")
	})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := subscribeGraphRelationships(ctx, nexusclient.NewWithBaseClient(base)); err == nil {
		t.Fatal("expected storage failure")
	}
}
