package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"saurient-platform/build/nexus-gql/graph/generated"
	"saurient-platform/build/nexus-gql/graph/model"
)

// Root is the resolver for the root field.
func (r *queryResolver) Root(ctx context.Context) (*model.RootRoot, error) {
	return getRootResolver()
}

// Rulebooks is the resolver for the Rulebooks field.
func (r *config_ConfigResolver) Rulebooks(ctx context.Context, obj *model.ConfigConfig, id *string) ([]*model.ConfigRulebook, error) {
	return getConfigConfigRulebooksResolver(obj, id)
}

// CbamBenchmarks is the resolver for the CbamBenchmarks field.
func (r *config_ConfigResolver) CbamBenchmarks(ctx context.Context, obj *model.ConfigConfig, id *string) ([]*model.ConfigCbamBenchmark, error) {
	return getConfigConfigCbamBenchmarksResolver(obj, id)
}

// StoryboardScenes is the resolver for the StoryboardScenes field.
func (r *config_ConfigResolver) StoryboardScenes(ctx context.Context, obj *model.ConfigConfig, id *string) ([]*model.ConfigStoryboardScene, error) {
	return getConfigConfigStoryboardScenesResolver(obj, id)
}

// Meters is the resolver for the Meters field.
func (r *inventory_FacilityResolver) Meters(ctx context.Context, obj *model.InventoryFacility, id *string) ([]*model.InventoryMeter, error) {
	return getInventoryFacilityMetersResolver(obj, id)
}

// Agencies is the resolver for the Agencies field.
func (r *inventory_InventoryResolver) Agencies(ctx context.Context, obj *model.InventoryInventory, id *string) ([]*model.InventoryACVAgency, error) {
	return getInventoryInventoryAgenciesResolver(obj, id)
}

// Tenants is the resolver for the Tenants field.
func (r *inventory_InventoryResolver) Tenants(ctx context.Context, obj *model.InventoryInventory, id *string) ([]*model.InventoryTenant, error) {
	return getInventoryInventoryTenantsResolver(obj, id)
}

// Suppliers is the resolver for the Suppliers field.
func (r *inventory_InventoryResolver) Suppliers(ctx context.Context, obj *model.InventoryInventory, id *string) ([]*model.InventorySupplier, error) {
	return getInventoryInventorySuppliersResolver(obj, id)
}

// LogisticsLegs is the resolver for the LogisticsLegs field.
func (r *inventory_ProductResolver) LogisticsLegs(ctx context.Context, obj *model.InventoryProduct, id *string) ([]*model.InventoryLogisticsLeg, error) {
	return getInventoryProductLogisticsLegsResolver(obj, id)
}

// Declarations is the resolver for the Declarations field.
func (r *inventory_SupplierResolver) Declarations(ctx context.Context, obj *model.InventorySupplier, id *string) ([]*model.InventoryDeclaration, error) {
	return getInventorySupplierDeclarationsResolver(obj, id)
}

// Facilities is the resolver for the Facilities field.
func (r *inventory_TenantResolver) Facilities(ctx context.Context, obj *model.InventoryTenant, id *string) ([]*model.InventoryFacility, error) {
	return getInventoryTenantFacilitiesResolver(obj, id)
}

// Products is the resolver for the Products field.
func (r *inventory_TenantResolver) Products(ctx context.Context, obj *model.InventoryTenant, id *string) ([]*model.InventoryProduct, error) {
	return getInventoryTenantProductsResolver(obj, id)
}

// Users is the resolver for the Users field.
func (r *inventory_TenantResolver) Users(ctx context.Context, obj *model.InventoryTenant, id *string) ([]*model.InventoryUser, error) {
	return getInventoryTenantUsersResolver(obj, id)
}

// Config is the resolver for the Config field.
func (r *root_RootResolver) Config(ctx context.Context, obj *model.RootRoot) (*model.ConfigConfig, error) {
	return getRootRootConfigResolver(obj)
}

// Inventory is the resolver for the Inventory field.
func (r *root_RootResolver) Inventory(ctx context.Context, obj *model.RootRoot) (*model.InventoryInventory, error) {
	return getRootRootInventoryResolver(obj)
}

// Runtime is the resolver for the Runtime field.
func (r *root_RootResolver) Runtime(ctx context.Context, obj *model.RootRoot) (*model.RuntimeRuntime, error) {
	return getRootRootRuntimeResolver(obj)
}

// ProductRef is the resolver for the ProductRef field.
func (r *runtime_CarbonPassportResolver) ProductRef(ctx context.Context, obj *model.RuntimeCarbonPassport) (*model.InventoryProduct, error) {
	return getRuntimeCarbonPassportProductRefResolver(obj)
}

// EngagementRef is the resolver for the EngagementRef field.
func (r *runtime_CarbonPassportResolver) EngagementRef(ctx context.Context, obj *model.RuntimeCarbonPassport) (*model.RuntimeACVEngagement, error) {
	return getRuntimeCarbonPassportEngagementRefResolver(obj)
}

// RulebookRef is the resolver for the RulebookRef field.
func (r *runtime_CarbonPassportResolver) RulebookRef(ctx context.Context, obj *model.RuntimeCarbonPassport) (*model.ConfigRulebook, error) {
	return getRuntimeCarbonPassportRulebookRefResolver(obj)
}

// AuditRecords is the resolver for the AuditRecords field.
func (r *runtime_CarbonPassportResolver) AuditRecords(ctx context.Context, obj *model.RuntimeCarbonPassport, id *string) ([]*model.RuntimeAuditRecord, error) {
	return getRuntimeCarbonPassportAuditRecordsResolver(obj, id)
}

// TelemetryReadings is the resolver for the TelemetryReadings field.
func (r *runtime_RuntimeResolver) TelemetryReadings(ctx context.Context, obj *model.RuntimeRuntime, id *string) ([]*model.RuntimeTelemetryReading, error) {
	return getRuntimeRuntimeTelemetryReadingsResolver(obj, id)
}

// Engagements is the resolver for the Engagements field.
func (r *runtime_RuntimeResolver) Engagements(ctx context.Context, obj *model.RuntimeRuntime, id *string) ([]*model.RuntimeACVEngagement, error) {
	return getRuntimeRuntimeEngagementsResolver(obj, id)
}

// Passports is the resolver for the Passports field.
func (r *runtime_RuntimeResolver) Passports(ctx context.Context, obj *model.RuntimeRuntime, id *string) ([]*model.RuntimeCarbonPassport, error) {
	return getRuntimeRuntimePassportsResolver(obj, id)
}

// MeterRef is the resolver for the MeterRef field.
func (r *runtime_TelemetryReadingResolver) MeterRef(ctx context.Context, obj *model.RuntimeTelemetryReading) (*model.InventoryMeter, error) {
	return getRuntimeTelemetryReadingMeterRefResolver(obj)
}

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

// Config_Config returns generated.Config_ConfigResolver implementation.
func (r *Resolver) Config_Config() generated.Config_ConfigResolver { return &config_ConfigResolver{r} }

// Inventory_Facility returns generated.Inventory_FacilityResolver implementation.
func (r *Resolver) Inventory_Facility() generated.Inventory_FacilityResolver {
	return &inventory_FacilityResolver{r}
}

// Inventory_Inventory returns generated.Inventory_InventoryResolver implementation.
func (r *Resolver) Inventory_Inventory() generated.Inventory_InventoryResolver {
	return &inventory_InventoryResolver{r}
}

// Inventory_Product returns generated.Inventory_ProductResolver implementation.
func (r *Resolver) Inventory_Product() generated.Inventory_ProductResolver {
	return &inventory_ProductResolver{r}
}

// Inventory_Supplier returns generated.Inventory_SupplierResolver implementation.
func (r *Resolver) Inventory_Supplier() generated.Inventory_SupplierResolver {
	return &inventory_SupplierResolver{r}
}

// Inventory_Tenant returns generated.Inventory_TenantResolver implementation.
func (r *Resolver) Inventory_Tenant() generated.Inventory_TenantResolver {
	return &inventory_TenantResolver{r}
}

// Root_Root returns generated.Root_RootResolver implementation.
func (r *Resolver) Root_Root() generated.Root_RootResolver { return &root_RootResolver{r} }

// Runtime_CarbonPassport returns generated.Runtime_CarbonPassportResolver implementation.
func (r *Resolver) Runtime_CarbonPassport() generated.Runtime_CarbonPassportResolver {
	return &runtime_CarbonPassportResolver{r}
}

// Runtime_Runtime returns generated.Runtime_RuntimeResolver implementation.
func (r *Resolver) Runtime_Runtime() generated.Runtime_RuntimeResolver {
	return &runtime_RuntimeResolver{r}
}

// Runtime_TelemetryReading returns generated.Runtime_TelemetryReadingResolver implementation.
func (r *Resolver) Runtime_TelemetryReading() generated.Runtime_TelemetryReadingResolver {
	return &runtime_TelemetryReadingResolver{r}
}

type queryResolver struct{ *Resolver }
type config_ConfigResolver struct{ *Resolver }
type inventory_FacilityResolver struct{ *Resolver }
type inventory_InventoryResolver struct{ *Resolver }
type inventory_ProductResolver struct{ *Resolver }
type inventory_SupplierResolver struct{ *Resolver }
type inventory_TenantResolver struct{ *Resolver }
type root_RootResolver struct{ *Resolver }
type runtime_CarbonPassportResolver struct{ *Resolver }
type runtime_RuntimeResolver struct{ *Resolver }
type runtime_TelemetryReadingResolver struct{ *Resolver }
