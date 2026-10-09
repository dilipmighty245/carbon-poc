package nexus

import (
	root "saurient-platform/datamodel"
	"saurient-platform/datamodel/config"
	"saurient-platform/datamodel/inventory"
	"saurient-platform/datamodel/runtime"

	nexusSDK "github.com/vmware-tanzu/graph-framework-for-microservices/nexus/nexus"
)

// Re-export Datamodel Node Types adhering strictly to Nexus DSL Specifications
type (
	RootNode             = root.Root
	ConfigNode           = config.Config
	RulebookNode         = config.Rulebook
	CbamBenchmarkNode    = config.CbamBenchmark
	StoryboardSceneNode  = config.StoryboardScene
	InventoryNode        = inventory.Inventory
	ACVAgencyNode        = inventory.ACVAgency
	TenantNode           = inventory.Tenant
	FacilityNode         = inventory.Facility
	MeterNode            = inventory.Meter
	ProductNode          = inventory.Product
	LogisticsLegNode     = inventory.LogisticsLeg
	SupplierNode         = inventory.Supplier
	DeclarationNode      = inventory.Declaration
	RuntimeNode          = runtime.Runtime
	TelemetryReadingNode = runtime.TelemetryReading
	ACVEngagementNode    = runtime.ACVEngagement
	CarbonPassportNode   = runtime.CarbonPassport
	AuditRecordNode      = runtime.AuditRecord

	// Core Nexus Base Node Types
	NexusNode          = nexusSDK.Node
	NexusSingletonNode = nexusSDK.SingletonNode
	NexusRestAPISpec   = nexusSDK.RestAPISpec
)
