package nexus

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
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

func TestLocalWorkspaceMutationSurvivesRestartAndReset(t *testing.T) {
	dir := t.TempDir()
	engine := &NexusGraphEngine{}
	engine.Reset()
	handler, err := LocalPersistenceHandler(dir, engine, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		engine.opMu.Lock()
		engine.processes["org-test"] = []*ProcessModel{{ID: "process-1", Name: "Steelmaking"}}
		engine.opMu.Unlock()
		w.WriteHeader(http.StatusCreated)
	}))
	if err != nil {
		t.Fatal(err)
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/processes", nil))
	if response.Code != http.StatusCreated {
		t.Fatal(response.Body.String())
	}
	restored := &NexusGraphEngine{}
	restored.Reset()
	if err := restored.loadLocalWorkspace(filepath.Join(dir, "workspace.json")); err != nil {
		t.Fatal(err)
	}
	if len(restored.processes["org-test"]) != 1 {
		t.Fatal("process not restored")
	}
	restored.Reset()
	if err := restored.saveLocalWorkspace(filepath.Join(dir, "workspace.json")); err != nil {
		t.Fatal(err)
	}
	if err := engine.loadLocalWorkspace(filepath.Join(dir, "workspace.json")); err != nil {
		t.Fatal(err)
	}
	if len(engine.processes["org-test"]) != 0 {
		t.Fatal("reset workspace data reappeared")
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
