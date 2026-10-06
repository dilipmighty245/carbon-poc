package helper

//nolint:gci // generated imports.
import (
	"context"
	//nolint:gosec // only useful fixed strig hashing and not for security.
	"crypto/sha1"
	"encoding/hex"
	"fmt"

	"github.com/elliotchance/orderedmap"

	datamodel "saurient-platform/build/client/clientset/versioned"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const DefaultKey = "default"
const DisplayNameLabel = "nexus/display_name"
const IsNameHashedLabel = "nexus/is_name_hashed"

//nolint:lll // Generated code. Length depends on actual graph depth.
func GetCRDParentsMap() map[string][]string {
	return map[string][]string{
		"acvagencies.inventory.saurient.io":     {"roots.root.saurient.io", "inventories.inventory.saurient.io"},
		"acvengagements.runtime.saurient.io":    {"roots.root.saurient.io", "runtimes.runtime.saurient.io"},
		"auditrecords.runtime.saurient.io":      {"roots.root.saurient.io", "runtimes.runtime.saurient.io", "carbonpassports.runtime.saurient.io"},
		"carbonpassports.runtime.saurient.io":   {"roots.root.saurient.io", "runtimes.runtime.saurient.io"},
		"cbambenchmarks.config.saurient.io":     {"roots.root.saurient.io", "configs.config.saurient.io"},
		"configs.config.saurient.io":            {"roots.root.saurient.io"},
		"declarations.inventory.saurient.io":    {"roots.root.saurient.io", "inventories.inventory.saurient.io", "suppliers.inventory.saurient.io"},
		"facilities.inventory.saurient.io":      {"roots.root.saurient.io", "inventories.inventory.saurient.io", "tenants.inventory.saurient.io"},
		"inventories.inventory.saurient.io":     {"roots.root.saurient.io"},
		"logisticslegs.inventory.saurient.io":   {"roots.root.saurient.io", "inventories.inventory.saurient.io", "tenants.inventory.saurient.io", "products.inventory.saurient.io"},
		"meters.inventory.saurient.io":          {"roots.root.saurient.io", "inventories.inventory.saurient.io", "tenants.inventory.saurient.io", "facilities.inventory.saurient.io"},
		"products.inventory.saurient.io":        {"roots.root.saurient.io", "inventories.inventory.saurient.io", "tenants.inventory.saurient.io"},
		"roots.root.saurient.io":                {},
		"rulebooks.config.saurient.io":          {"roots.root.saurient.io", "configs.config.saurient.io"},
		"runtimes.runtime.saurient.io":          {"roots.root.saurient.io"},
		"storyboardscenes.config.saurient.io":   {"roots.root.saurient.io", "configs.config.saurient.io"},
		"suppliers.inventory.saurient.io":       {"roots.root.saurient.io", "inventories.inventory.saurient.io"},
		"telemetryreadings.runtime.saurient.io": {"roots.root.saurient.io", "runtimes.runtime.saurient.io"},
		"tenants.inventory.saurient.io":         {"roots.root.saurient.io", "inventories.inventory.saurient.io"},
		"users.inventory.saurient.io":           {"roots.root.saurient.io", "inventories.inventory.saurient.io", "tenants.inventory.saurient.io"},
	}
}

//nolint:gocyclo,funlen,cyclop // Generated code. Length depends on actual graph depth.
func GetObjectByCRDName(dmClient *datamodel.Clientset, crdName, name string) interface{} {
	if crdName == "acvagencies.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().ACVAgencies().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "acvengagements.runtime.saurient.io" {
		obj, err := dmClient.RuntimeSaurientV1().ACVEngagements().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "auditrecords.runtime.saurient.io" {
		obj, err := dmClient.RuntimeSaurientV1().AuditRecords().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "carbonpassports.runtime.saurient.io" {
		obj, err := dmClient.RuntimeSaurientV1().CarbonPassports().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "cbambenchmarks.config.saurient.io" {
		obj, err := dmClient.ConfigSaurientV1().CbamBenchmarks().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "configs.config.saurient.io" {
		obj, err := dmClient.ConfigSaurientV1().Configs().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "declarations.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Declarations().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "facilities.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Facilities().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "inventories.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Inventories().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "logisticslegs.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().LogisticsLegs().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "meters.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Meters().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "products.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Products().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "roots.root.saurient.io" {
		obj, err := dmClient.RootSaurientV1().Roots().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "rulebooks.config.saurient.io" {
		obj, err := dmClient.ConfigSaurientV1().Rulebooks().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "runtimes.runtime.saurient.io" {
		obj, err := dmClient.RuntimeSaurientV1().Runtimes().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "storyboardscenes.config.saurient.io" {
		obj, err := dmClient.ConfigSaurientV1().StoryboardScenes().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "suppliers.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Suppliers().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "telemetryreadings.runtime.saurient.io" {
		obj, err := dmClient.RuntimeSaurientV1().TelemetryReadings().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "tenants.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Tenants().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}
	if crdName == "users.inventory.saurient.io" {
		obj, err := dmClient.InventorySaurientV1().Users().Get(context.TODO(), name, metav1.GetOptions{})
		if err != nil {
			return nil
		}
		return obj
	}

	return nil
}

func ParseCRDLabels(crdName string, labels map[string]string) *orderedmap.OrderedMap {
	parents := GetCRDParentsMap()[crdName]

	m := orderedmap.NewOrderedMap()
	for _, parent := range parents {
		if label, ok := labels[parent]; ok {
			m.Set(parent, label)
		} else {
			m.Set(parent, DefaultKey)
		}
	}

	return m
}

func GetHashedName(crdName string, labels map[string]string, name string) string {
	orderedLabels := ParseCRDLabels(crdName, labels)

	var output string
	for i, key := range orderedLabels.Keys() {
		value, _ := orderedLabels.Get(key)

		output += fmt.Sprintf("%s:%s", key, value)
		if i < orderedLabels.Len()-1 {
			output += "/"
		}
	}

	output += fmt.Sprintf("%s:%s", crdName, name)
	//nolint:gosec // only useful fixed strig hashing and not for security.
	h := sha1.New()
	_, _ = h.Write([]byte(output))
	return hex.EncodeToString(h.Sum(nil))
}
