package nexus

import (
	"context"
	"fmt"
	"net/http"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/util/retry"
	nexusclient "saurient-platform/build/nexus-client"
)

// Typed Nexus CRDs hold business records. This namespaced ConfigMap holds the
// remaining workspace settings, so both are stored by Kubernetes in etcd.
func ClusterPersistenceHandler(client *nexusclient.Clientset, namespace string, engine *NexusGraphEngine, next http.Handler) (http.Handler, error) {
	resource := client.DynamicClient.Resource(schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}).Namespace(namespace)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	state, err := resource.Get(ctx, "saurient-workspace", metav1.GetOptions{})
	if err != nil && !apierrors.IsNotFound(err) {
		return nil, err
	}
	if err == nil {
		data, _, _ := unstructured.NestedString(state.Object, "data", "workspace.json")
		if data == "" {
			return nil, fmt.Errorf("cluster workspace snapshot is empty")
		}
		if err := engine.unmarshalWorkspace([]byte(data)); err != nil {
			return nil, err
		}
	}
	save := func() error {
		data, err := engine.marshalWorkspace()
		if err != nil {
			return err
		}
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		return retry.RetryOnConflict(retry.DefaultRetry, func() error {
			current, err := resource.Get(ctx, "saurient-workspace", metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				_, err = resource.Create(ctx, &unstructured.Unstructured{Object: map[string]interface{}{
					"apiVersion": "v1", "kind": "ConfigMap", "metadata": map[string]interface{}{"name": "saurient-workspace", "namespace": namespace},
					"data": map[string]interface{}{"workspace.json": string(data)},
				}}, metav1.CreateOptions{})
				return err
			}
			if err != nil {
				return err
			}
			if err := unstructured.SetNestedField(current.Object, string(data), "data", "workspace.json"); err != nil {
				return err
			}
			_, err = resource.Update(ctx, current, metav1.UpdateOptions{})
			return err
		})
	}
	if err := save(); err != nil {
		return nil, err
	}
	return workspacePersistenceHandler(next, save), nil
}

func resetClusterGraph(ctx context.Context, client *nexusclient.Clientset) error {
	for _, kind := range graphKinds() {
		resource, _ := meta.UnsafeGuessKindToResource(kind)
		objects, err := client.DynamicClient.Resource(resource).List(ctx, metav1.ListOptions{})
		if err != nil {
			return err
		}
		for _, obj := range objects.Items {
			if err := client.DynamicClient.Resource(resource).Delete(ctx, obj.GetName(), metav1.DeleteOptions{}); err != nil && !apierrors.IsNotFound(err) {
				return err
			}
		}
	}
	return nil
}
