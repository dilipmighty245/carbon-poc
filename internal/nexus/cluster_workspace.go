package nexus

import (
	"context"
	"fmt"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/util/retry"
	nexusclient "saurient-platform/build/nexus-client"
)

const workspaceMigrationAnnotation = "saurient.io/workspace-migration"

// MigrateClusterWorkspace reads the old ConfigMap only during migration. Once
// marked, it is retained as a backup and never used to serve or save records.
func MigrateClusterWorkspace(ctx context.Context, client *nexusclient.Clientset, namespace string) error {
	resource := client.DynamicClient.Resource(schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}).Namespace(namespace)
	return retry.RetryOnConflict(retry.DefaultRetry, func() error {
		snapshot, err := resource.Get(ctx, "saurient-workspace", metav1.GetOptions{})
		if apierrors.IsNotFound(err) {
			return nil
		}
		if err != nil {
			return err
		}
		if snapshot.GetAnnotations()[workspaceMigrationAnnotation] == "nexus-v1" {
			return nil
		}
		data, _, err := unstructured.NestedString(snapshot.Object, "data", "workspace.json")
		if err != nil {
			return err
		}
		if data == "" {
			return fmt.Errorf("legacy cluster workspace is empty")
		}
		if err := migrateLegacyWorkspace(ctx, client, []byte(data)); err != nil {
			return err
		}
		annotations := snapshot.GetAnnotations()
		if annotations == nil {
			annotations = map[string]string{}
		}
		annotations[workspaceMigrationAnnotation] = "nexus-v1"
		snapshot.SetAnnotations(annotations)
		_, err = resource.Update(ctx, snapshot, metav1.UpdateOptions{})
		return err
	})
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
