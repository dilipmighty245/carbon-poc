package nexus

import (
	"net/http"
	"net/http/httptest"
	"path/filepath"
	nexusclient "saurient-platform/build/nexus-client"
	"testing"
)

func TestClusterWorkspaceSurvivesAPIRecreation(t *testing.T) {
	client := nexusclient.NewFakeClient()
	engine := &NexusGraphEngine{}
	engine.Reset()
	handler, err := ClusterPersistenceHandler(client, "saurient-system", engine, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		engine.opMu.Lock()
		engine.processes["org-cluster"] = []*ProcessModel{{ID: "cluster-process", Name: "Etcd workspace"}}
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
	if _, err := ClusterPersistenceHandler(client, "saurient-system", restored, http.NotFoundHandler()); err != nil {
		t.Fatal(err)
	}
	if len(restored.processes["org-cluster"]) != 1 {
		t.Fatal("workspace was not restored from Kubernetes")
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
