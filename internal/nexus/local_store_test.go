package nexus

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	"saurient-platform/internal/tenant"
)

func TestLocalGraphSurvivesRestartAndReset(t *testing.T) {
	file := filepath.Join(t.TempDir(), "graph.json")
	client, store, err := newLocalGraphClient(file)
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if _, err := EnsureGraphRoots(ctx, client); err != nil {
		t.Fatal(err)
	}
	tenant, err := EnsureTenantNode(ctx, client, "org-persistent")
	if err != nil {
		t.Fatal(err)
	}
	tenant.Spec.LegalName = "Persistent Steel"
	if err := tenant.Update(ctx); err != nil {
		t.Fatal(err)
	}
	user := &inventoryv1.User{ObjectMeta: metav1.ObjectMeta{Name: "test-user"}, Spec: inventoryv1.UserSpec{Email: "owner@example.test"}}
	if _, err := store.base.InventorySaurientV1().Users().Create(ctx, user, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	passport := &runtimev1.CarbonPassport{ObjectMeta: metav1.ObjectMeta{Name: "test-passport"}, Spec: runtimev1.CarbonPassportSpec{PassportID: "CP-001", TenantID: "org-persistent", VerificationStatus: "Issued"}}
	if _, err := store.base.RuntimeSaurientV1().CarbonPassports().Create(ctx, passport, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}

	restored, reopened, err := newLocalGraphClient(file)
	if err != nil {
		t.Fatal(err)
	}
	got, err := EnsureTenantNode(ctx, restored, "org-persistent")
	if err != nil || got.Spec.LegalName != "Persistent Steel" {
		t.Fatalf("tenant not restored: %+v %v", got, err)
	}
	gotUser, err := reopened.base.InventorySaurientV1().Users().Get(ctx, "test-user", metav1.GetOptions{})
	if err != nil || gotUser.Spec.Email != user.Spec.Email {
		t.Fatalf("user not restored: %+v %v", gotUser, err)
	}
	gotPassport, err := reopened.base.RuntimeSaurientV1().CarbonPassports().Get(ctx, "test-passport", metav1.GetOptions{})
	if err != nil || gotPassport.Spec.VerificationStatus != "Issued" {
		t.Fatalf("passport not restored: %+v %v", gotPassport, err)
	}
	if err := reopened.base.InventorySaurientV1().Users().Delete(ctx, "test-user", metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	_, afterDelete, err := newLocalGraphClient(file)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := afterDelete.base.InventorySaurientV1().Users().Get(ctx, "test-user", metav1.GetOptions{}); err == nil {
		t.Fatal("deleted user reappeared")
	}
	if err := reopened.reset(); err != nil {
		t.Fatal(err)
	}
	_, empty, err := newLocalGraphClient(file)
	if err != nil {
		t.Fatal(err)
	}
	passports, err := empty.base.RuntimeSaurientV1().CarbonPassports().List(ctx, metav1.ListOptions{})
	if err != nil || len(passports.Items) != 0 {
		t.Fatalf("reset not persisted: %+v %v", passports, err)
	}
	info, _ := os.Stat(file)
	if info.Mode().Perm() != 0600 {
		t.Fatalf("snapshot permissions: %v", info.Mode())
	}
}

func TestInvalidLocalSnapshotIsNotOverwritten(t *testing.T) {
	file := filepath.Join(t.TempDir(), "graph.json")
	original := []byte("incomplete snapshot")
	if err := os.WriteFile(file, original, 0600); err != nil {
		t.Fatal(err)
	}
	if _, _, err := newLocalGraphClient(file); err == nil {
		t.Fatal("expected invalid snapshot error")
	}
	got, _ := os.ReadFile(file)
	if string(got) != string(original) {
		t.Fatal("damaged snapshot was overwritten")
	}
}

func TestLocalWorkspaceMigratesOnceAndSurvivesRestart(t *testing.T) {
	dir := t.TempDir()
	data := []byte(`{"version":1,"processes":{"org-test":[{"id":"process-1","name":"Steelmaking"}]}}`)
	if err := os.WriteFile(filepath.Join(dir, "workspace.json"), data, 0600); err != nil {
		t.Fatal(err)
	}
	client, store, err := newLocalGraphClient(filepath.Join(dir, "graph.json"))
	if err != nil {
		t.Fatal(err)
	}
	ctx := tenant.WithTenant(context.Background(), "org-test")
	if err := MigrateLocalWorkspace(ctx, dir, client); err != nil {
		t.Fatal(err)
	}
	reopened, _, err := newLocalGraphClient(filepath.Join(dir, "graph.json"))
	if err != nil {
		t.Fatal(err)
	}
	records, err := listProcessRecords(ctx, reopened)
	if err != nil || len(records) != 1 || records[0].Name != "Steelmaking" {
		t.Fatalf("records not restored: %+v %v", records, err)
	}
	if err := store.reset(); err != nil {
		t.Fatal(err)
	}
	if err := MigrateLocalWorkspace(ctx, dir, client); err != nil {
		t.Fatal(err)
	}
	records, err = listProcessRecords(ctx, client)
	if err != nil || len(records) != 0 {
		t.Fatalf("legacy records reappeared after reset: %+v %v", records, err)
	}
	original, err := os.ReadFile(filepath.Join(dir, "workspace.json"))
	if err != nil || string(original) != string(data) {
		t.Fatal("legacy backup changed")
	}
}

func TestScope3ActivityInputsPreserveZero(t *testing.T) {
	values := map[string]interface{}{
		"scope_3_upstream": map[string]interface{}{
			"bill_of_materials": []interface{}{map[string]interface{}{"quantity": float64(0)}},
			"packaging":         map[string]interface{}{"quantity": float64(0)},
			"logistics":         map[string]interface{}{"distance_km": float64(0)},
		},
	}
	PrepareActivityMapAliases(values)
	for _, key := range []string{"raw_material_kg", "packaging_qty", "transport_km"} {
		if values[key] != float64(0) {
			t.Fatalf("%s invented activity: %v", key, values[key])
		}
	}
}
