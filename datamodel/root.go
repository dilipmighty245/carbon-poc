package root

import (
	"saurient-platform/datamodel/config"
	"saurient-platform/datamodel/inventory"
	"saurient-platform/datamodel/runtime"

	"github.com/xmen4xp/graph-framework-for-microservices/nexus/nexus"
)

type Root struct {
	nexus.SingletonNode

	Config    config.Config       `nexus:"child"`
	Inventory inventory.Inventory `nexus:"child"`
	Runtime   runtime.Runtime     `nexus:"child"`
}
