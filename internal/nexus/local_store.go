package nexus

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"sync"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/testing"
	fake "saurient-platform/build/client/clientset/versioned/fake"
	"saurient-platform/build/client/clientset/versioned/scheme"
	nexusclient "saurient-platform/build/nexus-client"
)

type localGraphStore struct {
	mu   sync.Mutex
	file string
	base *fake.Clientset
}

type localGraphSnapshot struct {
	Version int               `json:"version"`
	Objects []json.RawMessage `json:"objects"`
}

var activeLocalStore *localGraphStore

// atomicLocalWrite keeps the previous snapshot intact if writing is interrupted.
func atomicLocalWrite(file string, value any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(file), 0700); err != nil {
		return err
	}
	f, err := os.CreateTemp(filepath.Dir(file), ".snapshot-*")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	if _, err = f.Write(data); err == nil {
		err = f.Sync()
	}
	closeErr := f.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	return os.Rename(f.Name(), file)
}

func newLocalGraphClient(file string) (*nexusclient.Clientset, *localGraphStore, error) {
	var objects []runtime.Object
	data, err := os.ReadFile(file)
	if err != nil && !os.IsNotExist(err) {
		return nil, nil, err
	}
	if err == nil {
		var snapshot localGraphSnapshot
		if err = json.Unmarshal(data, &snapshot); err != nil {
			return nil, nil, fmt.Errorf("invalid local graph snapshot: %w", err)
		}
		if snapshot.Version != 1 {
			return nil, nil, fmt.Errorf("unsupported local graph snapshot version %d", snapshot.Version)
		}
		for _, raw := range snapshot.Objects {
			obj, _, decodeErr := scheme.Codecs.UniversalDeserializer().Decode(raw, nil, nil)
			if decodeErr != nil {
				return nil, nil, decodeErr
			}
			objects = append(objects, obj)
		}
	}
	store := &localGraphStore{file: file, base: fake.NewSimpleClientset(objects...)}
	reaction := testing.ObjectReaction(store.base.Tracker())
	store.base.PrependReactor("*", "*", func(action testing.Action) (bool, runtime.Object, error) {
		switch action.GetVerb() {
		case "create", "update", "patch", "delete", "delete-collection":
			store.mu.Lock()
			defer store.mu.Unlock()
			handled, obj, actionErr := reaction(action)
			if handled && actionErr == nil {
				actionErr = store.save()
			}
			return handled, obj, actionErr
		default:
			return false, nil, nil
		}
	})
	// Validate write access before accepting traffic; never discard an unreadable snapshot.
	if err := store.save(); err != nil {
		return nil, nil, err
	}
	return nexusclient.NewWithBaseClient(store.base), store, nil
}

func graphKinds() []schema.GroupVersionKind {
	var kinds []schema.GroupVersionKind
	for kind, typ := range scheme.Scheme.AllKnownTypes() {
		if typ.Kind() != reflect.Struct {
			continue
		}
		if _, ok := typ.FieldByName("Spec"); !ok {
			continue
		}
		if strings.HasSuffix(kind.Group, ".saurient.io") && kind.Version == "v1" && !strings.HasSuffix(kind.Kind, "List") {
			kinds = append(kinds, kind)
		}
	}
	return kinds
}

func (s *localGraphStore) save() error {
	snapshot := localGraphSnapshot{Version: 1}
	for _, kind := range graphKinds() {
		resource, _ := meta.UnsafeGuessKindToResource(kind)
		list, err := s.base.Tracker().List(resource, kind, "")
		if err != nil {
			return err
		}
		objects, err := meta.ExtractList(list)
		if err != nil {
			return err
		}
		for _, obj := range objects {
			data, err := runtime.Encode(scheme.Codecs.LegacyCodec(kind.GroupVersion()), obj)
			if err != nil {
				return err
			}
			snapshot.Objects = append(snapshot.Objects, json.RawMessage(data))
		}
	}
	return atomicLocalWrite(s.file, snapshot)
}

func (s *localGraphStore) reset() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, kind := range graphKinds() {
		resource, _ := meta.UnsafeGuessKindToResource(kind)
		list, err := s.base.Tracker().List(resource, kind, "")
		if err != nil {
			return err
		}
		objects, err := meta.ExtractList(list)
		if err != nil {
			return err
		}
		for _, obj := range objects {
			accessor, err := meta.Accessor(obj)
			if err != nil {
				return err
			}
			if err := s.base.Tracker().Delete(resource, accessor.GetNamespace(), accessor.GetName()); err != nil {
				return err
			}
		}
	}
	return s.save()
}
