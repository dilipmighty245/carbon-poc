package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"path/filepath"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8stesting "k8s.io/client-go/testing"
	basefake "saurient-platform/build/client/clientset/versioned/fake"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/tenant"
)

func legacyClusterSnapshot(t *testing.T, client *nexusclient.Clientset, data string) {
	t.Helper()
	_, err := client.DynamicClient.Resource(schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}).Namespace("saurient-system").Create(context.Background(), &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "v1", "kind": "ConfigMap", "metadata": map[string]interface{}{"name": "saurient-workspace", "namespace": "saurient-system"}, "data": map[string]interface{}{"workspace.json": data},
	}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
}

func TestClusterWorkspaceMigrationDoesNotOverwriteOrResurrectRecords(t *testing.T) {
	client := nexusclient.NewFakeClient()
	ctx := tenant.WithTenant(context.Background(), "org-cluster")
	if err := saveProcessRecord(ctx, client, &ProcessModel{ID: "existing", Name: "Latest saved value"}, false); err != nil {
		t.Fatal(err)
	}
	data := `{"version":1,"processes":{"org-cluster":[{"id":"existing","name":"Old snapshot value"},{"id":"migrated","name":"Old version"},{"id":"migrated","name":"Last snapshot version"}]}}`
	legacyClusterSnapshot(t, client, data)
	for i := 0; i < 2; i++ {
		if err := MigrateClusterWorkspace(ctx, client, "saurient-system"); err != nil {
			t.Fatal(err)
		}
	}
	records, err := listProcessRecords(ctx, nexusclient.NewWithBaseClient(client.BaseClient()))
	if err != nil || len(records) != 2 {
		t.Fatalf("expected two records: %+v %v", records, err)
	}
	for _, record := range records {
		if record.ID == "existing" && record.Name != "Latest saved value" {
			t.Fatal("migration overwrote newer record")
		}
		if record.ID == "migrated" && record.Name != "Last snapshot version" {
			t.Fatal("migration kept an obsolete duplicate")
		}
	}
	cm := client.DynamicClient.Resource(schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}).Namespace("saurient-system")
	snapshot, err := cm.Get(ctx, "saurient-workspace", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.GetAnnotations()[workspaceMigrationAnnotation] != "nexus-v1" {
		t.Fatal("missing migration marker")
	}
	stored, _, _ := unstructured.NestedString(snapshot.Object, "data", "workspace.json")
	if stored != data {
		t.Fatal("legacy backup changed")
	}
	// Fake DynamicClient has a separate tracker; emulate deletion of typed CRDs.
	for _, record := range records {
		if err := deleteProcessRecord(ctx, client, record.ID); err != nil {
			t.Fatal(err)
		}
	}
	if err := MigrateClusterWorkspace(ctx, client, "saurient-system"); err != nil {
		t.Fatal(err)
	}
	records, err = listProcessRecords(ctx, client)
	if err != nil || len(records) != 0 {
		t.Fatal("old ConfigMap restored deleted records")
	}
}

func TestClusterWorkspaceMigrationFailureIsRetryable(t *testing.T) {
	client := nexusclient.NewFakeClient()
	legacyClusterSnapshot(t, client, `{"version":1,"processes":{"org-failure":[{"id":"process","name":"Retriable"}]}}`)
	base := client.BaseClient().(*basefake.Clientset)
	fail := true
	base.PrependReactor("create", "processes", func(k8stesting.Action) (bool, runtime.Object, error) {
		if fail {
			return true, nil, fmt.Errorf("storage unavailable")
		}
		return false, nil, nil
	})
	ctx := context.Background()
	if err := MigrateClusterWorkspace(ctx, client, "saurient-system"); err == nil {
		t.Fatal("expected failed migration")
	}
	snapshot, err := client.DynamicClient.Resource(schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}).Namespace("saurient-system").Get(ctx, "saurient-workspace", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if snapshot.GetAnnotations()[workspaceMigrationAnnotation] != "" {
		t.Fatal("failed migration marked complete")
	}
	fail = false
	if err := MigrateClusterWorkspace(ctx, client, "saurient-system"); err != nil {
		t.Fatal(err)
	}
	records, err := listProcessRecords(tenant.WithTenant(ctx, "org-failure"), client)
	if err != nil || len(records) != 1 {
		t.Fatalf("retry failed: %+v %v", records, err)
	}
}

func TestInvalidLegacyWorkspaceIsRejected(t *testing.T) {
	for _, data := range []string{`broken`, `{"version":2}`} {
		if err := migrateLegacyWorkspace(context.Background(), nexusclient.NewFakeClient(), []byte(data)); err == nil {
			t.Fatal("invalid snapshot accepted")
		}
	}
	var snapshot legacyWorkspaceSnapshot
	if err := json.Unmarshal([]byte(`{"version":1}`), &snapshot); err != nil {
		t.Fatal(err)
	}
}

func TestRequiredClusterNeverFallsBackToLocalStore(t *testing.T) {
	t.Setenv("NEXUS_REQUIRE_CLUSTER", "true")
	t.Setenv("KUBECONFIG", filepath.Join(t.TempDir(), "missing-kubeconfig"))
	t.Setenv("LOCAL_DATA_DIR", t.TempDir())
	client, err := NewNexusClient("")
	if client != nil || err == nil {
		t.Fatal("required Kubernetes storage silently fell back")
	}
}
