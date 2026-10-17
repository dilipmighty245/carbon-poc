// Local kind setup helpers; commands always use an explicit kubeconfig/context.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/tools/clientcmd"
	"sigs.k8s.io/yaml"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	if len(os.Args) < 2 {
		return fmt.Errorf("usage: devcluster crds|import")
	}
	switch os.Args[1] {
	case "crds":
		files, err := filepath.Glob("build/crds/*.yaml")
		if err != nil {
			return err
		}
		list := []interface{}{}
		for _, file := range files {
			data, err := os.ReadFile(file)
			if err != nil {
				return err
			}
			var crd map[string]interface{}
			if err := yaml.Unmarshal(data, &crd); err != nil {
				return err
			}
			spec := crd["spec"].(map[string]interface{})
			// Generated CRDs currently omit structural schemas, which Kubernetes v1 requires.
			for _, v := range spec["versions"].([]interface{}) {
				version := v.(map[string]interface{})
				version["schema"] = map[string]interface{}{"openAPIV3Schema": map[string]interface{}{"type": "object", "x-kubernetes-preserve-unknown-fields": true}}
			}
			delete(crd, "status")
			list = append(list, crd)
		}
		return json.NewEncoder(os.Stdout).Encode(map[string]interface{}{"apiVersion": "v1", "kind": "List", "items": list})
	case "import":
		if len(os.Args) != 4 {
			return fmt.Errorf("usage: devcluster import KUBECONFIG DATA_DIR")
		}
		config, err := clientcmd.BuildConfigFromFlags("", os.Args[2])
		if err != nil {
			return err
		}
		client, err := dynamic.NewForConfig(config)
		if err != nil {
			return err
		}
		ctx := context.Background()
		cm := client.Resource(schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}).Namespace("saurient-system")
		if _, err := cm.Get(ctx, "local-data-imported", metav1.GetOptions{}); err == nil {
			return nil
		} else if !apierrors.IsNotFound(err) {
			return err
		}
		data, err := os.ReadFile(filepath.Join(os.Args[3], "graph.json"))
		if os.IsNotExist(err) {
			return nil
		}
		if err != nil {
			return err
		}
		var snapshot struct {
			Version int               `json:"version"`
			Objects []json.RawMessage `json:"objects"`
		}
		if err := json.Unmarshal(data, &snapshot); err != nil {
			return err
		}
		if snapshot.Version != 1 {
			return fmt.Errorf("unsupported graph snapshot version")
		}
		for _, raw := range snapshot.Objects {
			var obj unstructured.Unstructured
			if err := json.Unmarshal(raw, &obj); err != nil {
				return err
			}
			if !strings.HasSuffix(obj.GroupVersionKind().Group, ".saurient.io") {
				return fmt.Errorf("unexpected snapshot type")
			}
			resource, _ := meta.UnsafeGuessKindToResource(obj.GroupVersionKind())
			obj.SetResourceVersion("")
			obj.SetUID("")
			obj.SetManagedFields(nil)
			if _, err := client.Resource(resource).Create(ctx, &obj, metav1.CreateOptions{}); err != nil && !apierrors.IsAlreadyExists(err) {
				return err
			}
		}
		workspace, err := os.ReadFile(filepath.Join(os.Args[3], "workspace.json"))
		if err != nil && !os.IsNotExist(err) {
			return err
		}
		if err == nil {
			_, err = cm.Create(ctx, &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "ConfigMap", "metadata": map[string]interface{}{"name": "saurient-workspace"}, "data": map[string]interface{}{"workspace.json": string(workspace)}}}, metav1.CreateOptions{})
			if err != nil && !apierrors.IsAlreadyExists(err) {
				return err
			}
		}
		_, err = cm.Create(ctx, &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "ConfigMap", "metadata": map[string]interface{}{"name": "local-data-imported"}}}, metav1.CreateOptions{})
		return err
	default:
		return fmt.Errorf("unknown command")
	}
}
