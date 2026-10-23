package nexus

import (
	"context"
	"fmt"
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/cache"
	informers "saurient-platform/build/client/informers/externalversions"
	"saurient-platform/build/helper"
	nexusclient "saurient-platform/build/nexus-client"
)

// subscribeGraphRelationships rebuilds the relationship index from initial Add
// events, then maintains it from the datamodel's watch stream for ctx's lifetime.
func subscribeGraphRelationships(ctx context.Context, client *nexusclient.Clientset) error {
	factory := informers.NewSharedInformerFactory(client.BaseClient(), 0)
	var synced []cache.InformerSynced
	for childType, parents := range helper.GetCRDParentsMap() {
		if len(parents) == 0 {
			continue
		}
		parts := strings.SplitN(childType, ".", 2)
		informer, err := factory.ForResource(schema.GroupVersionResource{Group: parts[1], Version: "v1", Resource: parts[0]})
		if err != nil {
			return err
		}
		parentType := parents[len(parents)-1]
		index := func(object interface{}, add bool) {
			if tombstone, ok := object.(cache.DeletedFinalStateUnknown); ok {
				object = tombstone.Obj
			}
			obj, err := meta.Accessor(object)
			if err != nil {
				return
			}
			labels := obj.GetLabels()
			parentName := labels[parentType]
			if parentName == "" {
				parentName = helper.DefaultKey
			}
			parentHash := helper.GetHashedName(parentType, labels, parentName)
			if add {
				client.AddGraphChild(parentType, parentHash, childType, obj.GetName())
			} else {
				client.RemoveGraphChild(parentType, parentHash, childType, obj.GetName())
			}
		}
		registration, err := informer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
			AddFunc:    func(obj interface{}) { index(obj, true) },
			UpdateFunc: func(old, obj interface{}) { index(old, false); index(obj, true) },
			DeleteFunc: func(obj interface{}) { index(obj, false) },
		})
		if err != nil {
			return err
		}
		// Handler sync includes delivery of initial events, unlike store sync alone.
		synced = append(synced, registration.HasSynced)
	}
	watchCtx, stop := context.WithCancel(ctx)
	factory.Start(watchCtx.Done())
	syncCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()
	if !cache.WaitForCacheSync(syncCtx.Done(), synced...) {
		stop()
		return fmt.Errorf("Nexus relationship subscriptions did not sync: %w", syncCtx.Err())
	}
	return nil
}
