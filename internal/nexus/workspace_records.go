package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/util/retry"
	"saurient-platform/build/helper"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/tenant"
)

func workspaceTenant(ctx context.Context, supplied string) string {
	if id, _ := tenant.GetTenant(ctx); id != "" {
		return id
	}
	if supplied != "" {
		return supplied
	}
	return "tenant-default"
}

func workspaceMetadata(resource, tenantID, id string) metav1.ObjectMeta {
	labels := map[string]string{
		"roots.root.saurient.io": "default", "inventories.inventory.saurient.io": "default",
		"tenants.inventory.saurient.io": tenantID,
		helper.DisplayNameLabel:         id, helper.IsNameHashedLabel: "true",
	}
	return metav1.ObjectMeta{Name: helper.GetHashedName(resource, labels, id), Labels: labels}
}

func workspaceListOptions(ctx context.Context) metav1.ListOptions {
	return metav1.ListOptions{LabelSelector: "tenants.inventory.saurient.io=" + workspaceTenant(ctx, "")}
}

// Preserve structured API fields as JSON strings in the Nexus specification.
// All other fields, including timestamps, retain their normal JSON encoding.
func encodeWorkspaceRecord(model, spec interface{}) error {
	raw, err := json.Marshal(model)
	if err != nil {
		return err
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		return err
	}
	typ := reflect.Indirect(reflect.ValueOf(model)).Type()
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		if field.Type != reflect.TypeOf(json.RawMessage{}) {
			continue
		}
		key := strings.Split(field.Tag.Get("json"), ",")[0]
		value, ok := fields[key]
		if !ok {
			continue
		}
		fields[key], err = json.Marshal(string(value))
		if err != nil {
			return err
		}
	}
	if id, ok := fields["id"]; ok {
		fields["recordID"] = id
		delete(fields, "id")
	}
	raw, err = json.Marshal(fields)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, spec)
}

func decodeWorkspaceRecord(spec, model interface{}) error {
	raw, err := json.Marshal(spec)
	if err != nil {
		return err
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		return err
	}
	typ := reflect.Indirect(reflect.ValueOf(model)).Type()
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		if field.Type != reflect.TypeOf(json.RawMessage{}) {
			continue
		}
		key := strings.Split(field.Tag.Get("json"), ",")[0]
		value, ok := fields[key]
		if !ok {
			continue
		}
		var text string
		if err := json.Unmarshal(value, &text); err != nil {
			return err
		}
		if text == "" {
			delete(fields, key)
		} else {
			fields[key] = json.RawMessage(text)
		}
	}
	if id, ok := fields["recordID"]; ok {
		fields["id"] = id
		delete(fields, "recordID")
	}
	raw, err = json.Marshal(fields)
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, model)
}

type workspaceObject interface {
	runtime.Object
	metav1.Object
}
type workspaceWriter[O workspaceObject] interface {
	Get(context.Context, string, metav1.GetOptions) (O, error)
	Create(context.Context, O, metav1.CreateOptions) (O, error)
	Update(context.Context, O, metav1.UpdateOptions) (O, error)
}

func saveWorkspaceObject[O workspaceObject](ctx context.Context, client *nexusclient.Clientset, writer workspaceWriter[O], resource string, obj O, createOnly bool) error {
	tenantID := obj.GetLabels()["tenants.inventory.saurient.io"]
	if _, err := EnsureTenantNode(ctx, client, tenantID); err != nil {
		return err
	}
	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		existing, err := writer.Get(ctx, obj.GetName(), metav1.GetOptions{})
		if apierrors.IsNotFound(err) {
			_, err = writer.Create(ctx, obj, metav1.CreateOptions{})
			if apierrors.IsAlreadyExists(err) {
				return apierrors.NewConflict(resourceGroup(resource), obj.GetName(), err)
			}
			return err
		}
		if err != nil {
			return err
		}
		if createOnly {
			return nil
		}
		obj.SetResourceVersion(existing.GetResourceVersion())
		_, err = writer.Update(ctx, obj, metav1.UpdateOptions{})
		return err
	})
	if err != nil {
		return fmt.Errorf("persist %s: %w", resource, err)
	}
	parentName := helper.GetHashedName("tenants.inventory.saurient.io", obj.GetLabels(), tenantID)
	client.AddGraphChild("tenants.inventory.saurient.io", parentName, resource, obj.GetName())
	return nil
}

func resourceGroup(resource string) schema.GroupResource {
	parts := strings.SplitN(resource, ".", 2)
	return schema.GroupResource{Group: parts[1], Resource: parts[0]}
}
