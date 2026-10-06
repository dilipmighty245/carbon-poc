package graph

import (
	"context"
	"encoding/json"
	"fmt"

	log "github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"

	qm "github.com/vmware-tanzu/graph-framework-for-microservices/nexus/generated/query-manager"
	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/build/nexus-gql/graph/model"
)

var c = GrpcClients{
		mtx: sync.Mutex{},
		Clients: map[string]GrpcClient{},
}
var nc *nexus_client.Clientset

func getParentName(parentLabels map[string]interface{}, key string) string {
    if v, ok := parentLabels[key]; ok && v != nil {
	    return v.(string)
	}
	return ""
}

type NodeMetricTypeEnum string
type ServiceMetricTypeEnum string
type ServiceGroupByEnum string
type HTTPMethodEnum string
type EventSeverityEnum string
type AnalyticsMetricEnum string
type AnalyticsSubMetricEnum string
type TrafficDirectionEnum string
type SloDetailsEnum string

//////////////////////////////////////
// Nexus K8sAPIEndpointConfig
//////////////////////////////////////
func getK8sAPIEndpointConfig() *rest.Config {
    var (
		config *rest.Config
		err    error
	)
	filePath := os.Getenv("KUBECONFIG")
	if filePath != "" {
		config, err = clientcmd.BuildConfigFromFlags("", filePath)
		if err != nil {
			return nil
		}
	} else {
	    config, err = rest.InClusterConfig()
	    if err != nil {
		    return nil
	    }
	}
	config.RateLimiter = flowcontrol.NewTokenBucketRateLimiter(200, 300)
	return config
}
//////////////////////////////////////
// Singleton Resolver for Parent Node
// PKG: Root, NODE: Root
//////////////////////////////////////
func getRootResolver() (*model.RootRoot, error) {
	if nc == nil {
		k8sApiConfig := getK8sAPIEndpointConfig()
		nexusClient, err := nexus_client.NewForConfig(k8sApiConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to get k8s client config: %s", err)
		}
		nc = nexusClient
		nc.SubscribeAll()
		log.Debugf("Subscribed to all nodes in datamodel")
	}

	vRoot, err := nc.GetRootRoot(context.TODO())
	if err != nil {
		log.Errorf("[getRootResolver]Error getting Root node %s", err)
		return nil, nil
	}
	dn := vRoot.DisplayName()
parentLabels := map[string]interface{}{"roots.root.saurient.io":dn}

	ret := &model.RootRoot {
	Id: &dn,
	ParentLabels: parentLabels,
	}
	log.Debugf("[getRootResolver]Output Root object %+v", ret)
	return ret, nil
}
//////////////////////////////////////
// CHILD RESOLVER (Singleton)
// FieldName: Config Node: Root PKG: Root
//////////////////////////////////////
func getRootRootConfigResolver(obj *model.RootRoot) (*model.ConfigConfig, error) {
	log.Debugf("[getRootRootConfigResolver]Parent Object %+v", obj)
	vConfig, err := nc.RootRoot().GetConfig(context.TODO())
	if err != nil {
	    log.Errorf("[getRootRootConfigResolver]Error getting Root node %s", err)
        return &model.ConfigConfig{}, nil
    }
	dn := vConfig.DisplayName()
parentLabels := map[string]interface{}{"configs.config.saurient.io":dn}

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.ConfigConfig {
	Id: &dn,
	ParentLabels: parentLabels,
	}

    log.Debugf("[getRootRootConfigResolver]Output object %+v", ret)
	return ret, nil
}
//////////////////////////////////////
// CHILD RESOLVER (Singleton)
// FieldName: Inventory Node: Root PKG: Root
//////////////////////////////////////
func getRootRootInventoryResolver(obj *model.RootRoot) (*model.InventoryInventory, error) {
	log.Debugf("[getRootRootInventoryResolver]Parent Object %+v", obj)
	vInventory, err := nc.RootRoot().GetInventory(context.TODO())
	if err != nil {
	    log.Errorf("[getRootRootInventoryResolver]Error getting Root node %s", err)
        return &model.InventoryInventory{}, nil
    }
	dn := vInventory.DisplayName()
parentLabels := map[string]interface{}{"inventories.inventory.saurient.io":dn}

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.InventoryInventory {
	Id: &dn,
	ParentLabels: parentLabels,
	}

    log.Debugf("[getRootRootInventoryResolver]Output object %+v", ret)
	return ret, nil
}
//////////////////////////////////////
// CHILD RESOLVER (Singleton)
// FieldName: Runtime Node: Root PKG: Root
//////////////////////////////////////
func getRootRootRuntimeResolver(obj *model.RootRoot) (*model.RuntimeRuntime, error) {
	log.Debugf("[getRootRootRuntimeResolver]Parent Object %+v", obj)
	vRuntime, err := nc.RootRoot().GetRuntime(context.TODO())
	if err != nil {
	    log.Errorf("[getRootRootRuntimeResolver]Error getting Root node %s", err)
        return &model.RuntimeRuntime{}, nil
    }
	dn := vRuntime.DisplayName()
parentLabels := map[string]interface{}{"runtimes.runtime.saurient.io":dn}

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.RuntimeRuntime {
	Id: &dn,
	ParentLabels: parentLabels,
	}

    log.Debugf("[getRootRootRuntimeResolver]Output object %+v", ret)
	return ret, nil
}
//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Rulebooks Node: Config PKG: Config
//////////////////////////////////////
func getConfigConfigRulebooksResolver(obj *model.ConfigConfig, id *string) ([]*model.ConfigRulebook, error) {
	log.Debugf("[getConfigConfigRulebooksResolver]Parent Object %+v", obj)
	var vConfigRulebookList []*model.ConfigRulebook
	if id != nil && *id != "" {
		log.Debugf("[getConfigConfigRulebooksResolver]Id %q", *id)
		vRulebook, err := nc.RootRoot().Config().GetRulebooks(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getConfigConfigRulebooksResolver]Error getting Rulebooks node %q : %s", *id, err)
            return vConfigRulebookList, nil
        }
		dn := vRulebook.DisplayName()
parentLabels := map[string]interface{}{"rulebooks.config.saurient.io":dn}
vRulebookID := string(vRulebook.Spec.RulebookID)
vCommodityType := string(vRulebook.Spec.CommodityType)
vVersion := string(vRulebook.Spec.Version)
vAccountingMode := string(vRulebook.Spec.AccountingMode)
vStandard := string(vRulebook.Spec.Standard)
vRulesRaw := string(vRulebook.Spec.RulesRaw)
vScope1Formula := string(vRulebook.Spec.Scope1Formula)
vScope2Formula := string(vRulebook.Spec.Scope2Formula)
vScope3Formula := string(vRulebook.Spec.Scope3Formula)
vFunctionalUnit := string(vRulebook.Spec.FunctionalUnit)
vBatchQuantity := float64(vRulebook.Spec.BatchQuantity)
vBoundaryType := string(vRulebook.Spec.BoundaryType)
vAllocationMethod := string(vRulebook.Spec.AllocationMethod)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.ConfigRulebook {
	Id: &dn,
	ParentLabels: parentLabels,
	RulebookID: &vRulebookID,
	CommodityType: &vCommodityType,
	Version: &vVersion,
	AccountingMode: &vAccountingMode,
	Standard: &vStandard,
	RulesRaw: &vRulesRaw,
	Scope1Formula: &vScope1Formula,
	Scope2Formula: &vScope2Formula,
	Scope3Formula: &vScope3Formula,
	FunctionalUnit: &vFunctionalUnit,
	BatchQuantity: &vBatchQuantity,
	BoundaryType: &vBoundaryType,
	AllocationMethod: &vAllocationMethod,
	}
		vConfigRulebookList = append(vConfigRulebookList, ret)

		log.Debugf("[getConfigConfigRulebooksResolver]Output Rulebooks objects %v", vConfigRulebookList)

		return vConfigRulebookList, nil
	}

	log.Debug("[getConfigConfigRulebooksResolver]Id is empty, process all Rulebookss")

	vRulebookParent, err := nc.RootRoot().GetConfig(context.TODO())
	if err != nil {
	    log.Errorf("[getConfigConfigRulebooksResolver]Error getting parent node %s", err)
        return vConfigRulebookList, nil
    }
	vRulebookAllObj, err := vRulebookParent.GetAllRulebooks(context.TODO())
	if err != nil {
	    log.Errorf("[getConfigConfigRulebooksResolver]Error getting Rulebooks objects %s", err)
        return vConfigRulebookList, nil
    }
	for _, i := range vRulebookAllObj {
		vRulebook, err := nc.RootRoot().Config().GetRulebooks(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getConfigConfigRulebooksResolver]Error getting Rulebooks node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vRulebook.DisplayName()
parentLabels := map[string]interface{}{"rulebooks.config.saurient.io":dn}
vRulebookID := string(vRulebook.Spec.RulebookID)
vCommodityType := string(vRulebook.Spec.CommodityType)
vVersion := string(vRulebook.Spec.Version)
vAccountingMode := string(vRulebook.Spec.AccountingMode)
vStandard := string(vRulebook.Spec.Standard)
vRulesRaw := string(vRulebook.Spec.RulesRaw)
vScope1Formula := string(vRulebook.Spec.Scope1Formula)
vScope2Formula := string(vRulebook.Spec.Scope2Formula)
vScope3Formula := string(vRulebook.Spec.Scope3Formula)
vFunctionalUnit := string(vRulebook.Spec.FunctionalUnit)
vBatchQuantity := float64(vRulebook.Spec.BatchQuantity)
vBoundaryType := string(vRulebook.Spec.BoundaryType)
vAllocationMethod := string(vRulebook.Spec.AllocationMethod)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.ConfigRulebook {
	Id: &dn,
	ParentLabels: parentLabels,
	RulebookID: &vRulebookID,
	CommodityType: &vCommodityType,
	Version: &vVersion,
	AccountingMode: &vAccountingMode,
	Standard: &vStandard,
	RulesRaw: &vRulesRaw,
	Scope1Formula: &vScope1Formula,
	Scope2Formula: &vScope2Formula,
	Scope3Formula: &vScope3Formula,
	FunctionalUnit: &vFunctionalUnit,
	BatchQuantity: &vBatchQuantity,
	BoundaryType: &vBoundaryType,
	AllocationMethod: &vAllocationMethod,
	}
		vConfigRulebookList = append(vConfigRulebookList, ret)
	}

	log.Debugf("[getConfigConfigRulebooksResolver]Output Rulebooks objects %v", vConfigRulebookList)

	return vConfigRulebookList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: CbamBenchmarks Node: Config PKG: Config
//////////////////////////////////////
func getConfigConfigCbamBenchmarksResolver(obj *model.ConfigConfig, id *string) ([]*model.ConfigCbamBenchmark, error) {
	log.Debugf("[getConfigConfigCbamBenchmarksResolver]Parent Object %+v", obj)
	var vConfigCbamBenchmarkList []*model.ConfigCbamBenchmark
	if id != nil && *id != "" {
		log.Debugf("[getConfigConfigCbamBenchmarksResolver]Id %q", *id)
		vCbamBenchmark, err := nc.RootRoot().Config().GetCbamBenchmarks(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getConfigConfigCbamBenchmarksResolver]Error getting CbamBenchmarks node %q : %s", *id, err)
            return vConfigCbamBenchmarkList, nil
        }
		dn := vCbamBenchmark.DisplayName()
parentLabels := map[string]interface{}{"cbambenchmarks.config.saurient.io":dn}
vCnCode := string(vCbamBenchmark.Spec.CnCode)
vCommodityName := string(vCbamBenchmark.Spec.CommodityName)
vBfBofBenchmark := float64(vCbamBenchmark.Spec.BfBofBenchmark)
vDriEafBenchmark := float64(vCbamBenchmark.Spec.DriEafBenchmark)
vScrapEafBenchmark := float64(vCbamBenchmark.Spec.ScrapEafBenchmark)
vDefaultFallback := float64(vCbamBenchmark.Spec.DefaultFallback)
vRegulationRef := string(vCbamBenchmark.Spec.RegulationRef)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.ConfigCbamBenchmark {
	Id: &dn,
	ParentLabels: parentLabels,
	CnCode: &vCnCode,
	CommodityName: &vCommodityName,
	BfBofBenchmark: &vBfBofBenchmark,
	DriEafBenchmark: &vDriEafBenchmark,
	ScrapEafBenchmark: &vScrapEafBenchmark,
	DefaultFallback: &vDefaultFallback,
	RegulationRef: &vRegulationRef,
	}
		vConfigCbamBenchmarkList = append(vConfigCbamBenchmarkList, ret)

		log.Debugf("[getConfigConfigCbamBenchmarksResolver]Output CbamBenchmarks objects %v", vConfigCbamBenchmarkList)

		return vConfigCbamBenchmarkList, nil
	}

	log.Debug("[getConfigConfigCbamBenchmarksResolver]Id is empty, process all CbamBenchmarkss")

	vCbamBenchmarkParent, err := nc.RootRoot().GetConfig(context.TODO())
	if err != nil {
	    log.Errorf("[getConfigConfigCbamBenchmarksResolver]Error getting parent node %s", err)
        return vConfigCbamBenchmarkList, nil
    }
	vCbamBenchmarkAllObj, err := vCbamBenchmarkParent.GetAllCbamBenchmarks(context.TODO())
	if err != nil {
	    log.Errorf("[getConfigConfigCbamBenchmarksResolver]Error getting CbamBenchmarks objects %s", err)
        return vConfigCbamBenchmarkList, nil
    }
	for _, i := range vCbamBenchmarkAllObj {
		vCbamBenchmark, err := nc.RootRoot().Config().GetCbamBenchmarks(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getConfigConfigCbamBenchmarksResolver]Error getting CbamBenchmarks node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vCbamBenchmark.DisplayName()
parentLabels := map[string]interface{}{"cbambenchmarks.config.saurient.io":dn}
vCnCode := string(vCbamBenchmark.Spec.CnCode)
vCommodityName := string(vCbamBenchmark.Spec.CommodityName)
vBfBofBenchmark := float64(vCbamBenchmark.Spec.BfBofBenchmark)
vDriEafBenchmark := float64(vCbamBenchmark.Spec.DriEafBenchmark)
vScrapEafBenchmark := float64(vCbamBenchmark.Spec.ScrapEafBenchmark)
vDefaultFallback := float64(vCbamBenchmark.Spec.DefaultFallback)
vRegulationRef := string(vCbamBenchmark.Spec.RegulationRef)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.ConfigCbamBenchmark {
	Id: &dn,
	ParentLabels: parentLabels,
	CnCode: &vCnCode,
	CommodityName: &vCommodityName,
	BfBofBenchmark: &vBfBofBenchmark,
	DriEafBenchmark: &vDriEafBenchmark,
	ScrapEafBenchmark: &vScrapEafBenchmark,
	DefaultFallback: &vDefaultFallback,
	RegulationRef: &vRegulationRef,
	}
		vConfigCbamBenchmarkList = append(vConfigCbamBenchmarkList, ret)
	}

	log.Debugf("[getConfigConfigCbamBenchmarksResolver]Output CbamBenchmarks objects %v", vConfigCbamBenchmarkList)

	return vConfigCbamBenchmarkList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: StoryboardScenes Node: Config PKG: Config
//////////////////////////////////////
func getConfigConfigStoryboardScenesResolver(obj *model.ConfigConfig, id *string) ([]*model.ConfigStoryboardScene, error) {
	log.Debugf("[getConfigConfigStoryboardScenesResolver]Parent Object %+v", obj)
	var vConfigStoryboardSceneList []*model.ConfigStoryboardScene
	if id != nil && *id != "" {
		log.Debugf("[getConfigConfigStoryboardScenesResolver]Id %q", *id)
		vStoryboardScene, err := nc.RootRoot().Config().GetStoryboardScenes(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getConfigConfigStoryboardScenesResolver]Error getting StoryboardScenes node %q : %s", *id, err)
            return vConfigStoryboardSceneList, nil
        }
		dn := vStoryboardScene.DisplayName()
parentLabels := map[string]interface{}{"storyboardscenes.config.saurient.io":dn}
vSceneNumber := int(vStoryboardScene.Spec.SceneNumber)
vTitle := string(vStoryboardScene.Spec.Title)
vScreenRoute := string(vStoryboardScene.Spec.ScreenRoute)
vPresenterNarration := string(vStoryboardScene.Spec.PresenterNarration)
vPrimaryAction := string(vStoryboardScene.Spec.PrimaryAction)
vTargetModule := string(vStoryboardScene.Spec.TargetModule)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.ConfigStoryboardScene {
	Id: &dn,
	ParentLabels: parentLabels,
	SceneNumber: &vSceneNumber,
	Title: &vTitle,
	ScreenRoute: &vScreenRoute,
	PresenterNarration: &vPresenterNarration,
	PrimaryAction: &vPrimaryAction,
	TargetModule: &vTargetModule,
	}
		vConfigStoryboardSceneList = append(vConfigStoryboardSceneList, ret)

		log.Debugf("[getConfigConfigStoryboardScenesResolver]Output StoryboardScenes objects %v", vConfigStoryboardSceneList)

		return vConfigStoryboardSceneList, nil
	}

	log.Debug("[getConfigConfigStoryboardScenesResolver]Id is empty, process all StoryboardSceness")

	vStoryboardSceneParent, err := nc.RootRoot().GetConfig(context.TODO())
	if err != nil {
	    log.Errorf("[getConfigConfigStoryboardScenesResolver]Error getting parent node %s", err)
        return vConfigStoryboardSceneList, nil
    }
	vStoryboardSceneAllObj, err := vStoryboardSceneParent.GetAllStoryboardScenes(context.TODO())
	if err != nil {
	    log.Errorf("[getConfigConfigStoryboardScenesResolver]Error getting StoryboardScenes objects %s", err)
        return vConfigStoryboardSceneList, nil
    }
	for _, i := range vStoryboardSceneAllObj {
		vStoryboardScene, err := nc.RootRoot().Config().GetStoryboardScenes(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getConfigConfigStoryboardScenesResolver]Error getting StoryboardScenes node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vStoryboardScene.DisplayName()
parentLabels := map[string]interface{}{"storyboardscenes.config.saurient.io":dn}
vSceneNumber := int(vStoryboardScene.Spec.SceneNumber)
vTitle := string(vStoryboardScene.Spec.Title)
vScreenRoute := string(vStoryboardScene.Spec.ScreenRoute)
vPresenterNarration := string(vStoryboardScene.Spec.PresenterNarration)
vPrimaryAction := string(vStoryboardScene.Spec.PrimaryAction)
vTargetModule := string(vStoryboardScene.Spec.TargetModule)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.ConfigStoryboardScene {
	Id: &dn,
	ParentLabels: parentLabels,
	SceneNumber: &vSceneNumber,
	Title: &vTitle,
	ScreenRoute: &vScreenRoute,
	PresenterNarration: &vPresenterNarration,
	PrimaryAction: &vPrimaryAction,
	TargetModule: &vTargetModule,
	}
		vConfigStoryboardSceneList = append(vConfigStoryboardSceneList, ret)
	}

	log.Debugf("[getConfigConfigStoryboardScenesResolver]Output StoryboardScenes objects %v", vConfigStoryboardSceneList)

	return vConfigStoryboardSceneList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Agencies Node: Inventory PKG: Inventory
//////////////////////////////////////
func getInventoryInventoryAgenciesResolver(obj *model.InventoryInventory, id *string) ([]*model.InventoryACVAgency, error) {
	log.Debugf("[getInventoryInventoryAgenciesResolver]Parent Object %+v", obj)
	var vInventoryACVAgencyList []*model.InventoryACVAgency
	if id != nil && *id != "" {
		log.Debugf("[getInventoryInventoryAgenciesResolver]Id %q", *id)
		vACVAgency, err := nc.RootRoot().Inventory().GetAgencies(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryInventoryAgenciesResolver]Error getting Agencies node %q : %s", *id, err)
            return vInventoryACVAgencyList, nil
        }
		dn := vACVAgency.DisplayName()
parentLabels := map[string]interface{}{"acvagencies.inventory.saurient.io":dn}
vAgencyID := string(vACVAgency.Spec.AgencyID)
vLegalName := string(vACVAgency.Spec.LegalName)
vAccreditationBody := string(vACVAgency.Spec.AccreditationBody)
vAccreditationNumber := string(vACVAgency.Spec.AccreditationNumber)
vAccreditationStatus := string(vACVAgency.Spec.AccreditationStatus)
vAccreditationExpiry := string(vACVAgency.Spec.AccreditationExpiry)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryACVAgency {
	Id: &dn,
	ParentLabels: parentLabels,
	AgencyID: &vAgencyID,
	LegalName: &vLegalName,
	AccreditationBody: &vAccreditationBody,
	AccreditationNumber: &vAccreditationNumber,
	AccreditationStatus: &vAccreditationStatus,
	AccreditationExpiry: &vAccreditationExpiry,
	}
		vInventoryACVAgencyList = append(vInventoryACVAgencyList, ret)

		log.Debugf("[getInventoryInventoryAgenciesResolver]Output Agencies objects %v", vInventoryACVAgencyList)

		return vInventoryACVAgencyList, nil
	}

	log.Debug("[getInventoryInventoryAgenciesResolver]Id is empty, process all Agenciess")

	vACVAgencyParent, err := nc.RootRoot().GetInventory(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryInventoryAgenciesResolver]Error getting parent node %s", err)
        return vInventoryACVAgencyList, nil
    }
	vACVAgencyAllObj, err := vACVAgencyParent.GetAllAgencies(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryInventoryAgenciesResolver]Error getting Agencies objects %s", err)
        return vInventoryACVAgencyList, nil
    }
	for _, i := range vACVAgencyAllObj {
		vACVAgency, err := nc.RootRoot().Inventory().GetAgencies(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryInventoryAgenciesResolver]Error getting Agencies node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vACVAgency.DisplayName()
parentLabels := map[string]interface{}{"acvagencies.inventory.saurient.io":dn}
vAgencyID := string(vACVAgency.Spec.AgencyID)
vLegalName := string(vACVAgency.Spec.LegalName)
vAccreditationBody := string(vACVAgency.Spec.AccreditationBody)
vAccreditationNumber := string(vACVAgency.Spec.AccreditationNumber)
vAccreditationStatus := string(vACVAgency.Spec.AccreditationStatus)
vAccreditationExpiry := string(vACVAgency.Spec.AccreditationExpiry)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryACVAgency {
	Id: &dn,
	ParentLabels: parentLabels,
	AgencyID: &vAgencyID,
	LegalName: &vLegalName,
	AccreditationBody: &vAccreditationBody,
	AccreditationNumber: &vAccreditationNumber,
	AccreditationStatus: &vAccreditationStatus,
	AccreditationExpiry: &vAccreditationExpiry,
	}
		vInventoryACVAgencyList = append(vInventoryACVAgencyList, ret)
	}

	log.Debugf("[getInventoryInventoryAgenciesResolver]Output Agencies objects %v", vInventoryACVAgencyList)

	return vInventoryACVAgencyList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Tenants Node: Inventory PKG: Inventory
//////////////////////////////////////
func getInventoryInventoryTenantsResolver(obj *model.InventoryInventory, id *string) ([]*model.InventoryTenant, error) {
	log.Debugf("[getInventoryInventoryTenantsResolver]Parent Object %+v", obj)
	var vInventoryTenantList []*model.InventoryTenant
	if id != nil && *id != "" {
		log.Debugf("[getInventoryInventoryTenantsResolver]Id %q", *id)
		vTenant, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryInventoryTenantsResolver]Error getting Tenants node %q : %s", *id, err)
            return vInventoryTenantList, nil
        }
		dn := vTenant.DisplayName()
parentLabels := map[string]interface{}{"tenants.inventory.saurient.io":dn}
vTenantID := string(vTenant.Spec.TenantID)
vLegalName := string(vTenant.Spec.LegalName)
vCountry := string(vTenant.Spec.Country)
vIndustry := string(vTenant.Spec.Industry)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryTenant {
	Id: &dn,
	ParentLabels: parentLabels,
	TenantID: &vTenantID,
	LegalName: &vLegalName,
	Country: &vCountry,
	Industry: &vIndustry,
	}
		vInventoryTenantList = append(vInventoryTenantList, ret)

		log.Debugf("[getInventoryInventoryTenantsResolver]Output Tenants objects %v", vInventoryTenantList)

		return vInventoryTenantList, nil
	}

	log.Debug("[getInventoryInventoryTenantsResolver]Id is empty, process all Tenantss")

	vTenantParent, err := nc.RootRoot().GetInventory(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryInventoryTenantsResolver]Error getting parent node %s", err)
        return vInventoryTenantList, nil
    }
	vTenantAllObj, err := vTenantParent.GetAllTenants(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryInventoryTenantsResolver]Error getting Tenants objects %s", err)
        return vInventoryTenantList, nil
    }
	for _, i := range vTenantAllObj {
		vTenant, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryInventoryTenantsResolver]Error getting Tenants node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vTenant.DisplayName()
parentLabels := map[string]interface{}{"tenants.inventory.saurient.io":dn}
vTenantID := string(vTenant.Spec.TenantID)
vLegalName := string(vTenant.Spec.LegalName)
vCountry := string(vTenant.Spec.Country)
vIndustry := string(vTenant.Spec.Industry)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryTenant {
	Id: &dn,
	ParentLabels: parentLabels,
	TenantID: &vTenantID,
	LegalName: &vLegalName,
	Country: &vCountry,
	Industry: &vIndustry,
	}
		vInventoryTenantList = append(vInventoryTenantList, ret)
	}

	log.Debugf("[getInventoryInventoryTenantsResolver]Output Tenants objects %v", vInventoryTenantList)

	return vInventoryTenantList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Suppliers Node: Inventory PKG: Inventory
//////////////////////////////////////
func getInventoryInventorySuppliersResolver(obj *model.InventoryInventory, id *string) ([]*model.InventorySupplier, error) {
	log.Debugf("[getInventoryInventorySuppliersResolver]Parent Object %+v", obj)
	var vInventorySupplierList []*model.InventorySupplier
	if id != nil && *id != "" {
		log.Debugf("[getInventoryInventorySuppliersResolver]Id %q", *id)
		vSupplier, err := nc.RootRoot().Inventory().GetSuppliers(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryInventorySuppliersResolver]Error getting Suppliers node %q : %s", *id, err)
            return vInventorySupplierList, nil
        }
		dn := vSupplier.DisplayName()
parentLabels := map[string]interface{}{"suppliers.inventory.saurient.io":dn}
vSupplierID := string(vSupplier.Spec.SupplierID)
vLegalName := string(vSupplier.Spec.LegalName)
vCountry := string(vSupplier.Spec.Country)
vTier := string(vSupplier.Spec.Tier)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventorySupplier {
	Id: &dn,
	ParentLabels: parentLabels,
	SupplierID: &vSupplierID,
	LegalName: &vLegalName,
	Country: &vCountry,
	Tier: &vTier,
	}
		vInventorySupplierList = append(vInventorySupplierList, ret)

		log.Debugf("[getInventoryInventorySuppliersResolver]Output Suppliers objects %v", vInventorySupplierList)

		return vInventorySupplierList, nil
	}

	log.Debug("[getInventoryInventorySuppliersResolver]Id is empty, process all Supplierss")

	vSupplierParent, err := nc.RootRoot().GetInventory(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryInventorySuppliersResolver]Error getting parent node %s", err)
        return vInventorySupplierList, nil
    }
	vSupplierAllObj, err := vSupplierParent.GetAllSuppliers(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryInventorySuppliersResolver]Error getting Suppliers objects %s", err)
        return vInventorySupplierList, nil
    }
	for _, i := range vSupplierAllObj {
		vSupplier, err := nc.RootRoot().Inventory().GetSuppliers(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryInventorySuppliersResolver]Error getting Suppliers node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vSupplier.DisplayName()
parentLabels := map[string]interface{}{"suppliers.inventory.saurient.io":dn}
vSupplierID := string(vSupplier.Spec.SupplierID)
vLegalName := string(vSupplier.Spec.LegalName)
vCountry := string(vSupplier.Spec.Country)
vTier := string(vSupplier.Spec.Tier)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventorySupplier {
	Id: &dn,
	ParentLabels: parentLabels,
	SupplierID: &vSupplierID,
	LegalName: &vLegalName,
	Country: &vCountry,
	Tier: &vTier,
	}
		vInventorySupplierList = append(vInventorySupplierList, ret)
	}

	log.Debugf("[getInventoryInventorySuppliersResolver]Output Suppliers objects %v", vInventorySupplierList)

	return vInventorySupplierList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Facilities Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantFacilitiesResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryFacility, error) {
	log.Debugf("[getInventoryTenantFacilitiesResolver]Parent Object %+v", obj)
	var vInventoryFacilityList []*model.InventoryFacility
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantFacilitiesResolver]Id %q", *id)
		vFacility, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetFacilities(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantFacilitiesResolver]Error getting Facilities node %q : %s", *id, err)
            return vInventoryFacilityList, nil
        }
		dn := vFacility.DisplayName()
parentLabels := map[string]interface{}{"facilities.inventory.saurient.io":dn}
vFacilityID := string(vFacility.Spec.FacilityID)
vName := string(vFacility.Spec.Name)
vLocation := string(vFacility.Spec.Location)
vCountryCode := string(vFacility.Spec.CountryCode)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryFacility {
	Id: &dn,
	ParentLabels: parentLabels,
	FacilityID: &vFacilityID,
	Name: &vName,
	Location: &vLocation,
	CountryCode: &vCountryCode,
	}
		vInventoryFacilityList = append(vInventoryFacilityList, ret)

		log.Debugf("[getInventoryTenantFacilitiesResolver]Output Facilities objects %v", vInventoryFacilityList)

		return vInventoryFacilityList, nil
	}

	log.Debug("[getInventoryTenantFacilitiesResolver]Id is empty, process all Facilitiess")

	vFacilityParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantFacilitiesResolver]Error getting parent node %s", err)
        return vInventoryFacilityList, nil
    }
	vFacilityAllObj, err := vFacilityParent.GetAllFacilities(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantFacilitiesResolver]Error getting Facilities objects %s", err)
        return vInventoryFacilityList, nil
    }
	for _, i := range vFacilityAllObj {
		vFacility, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetFacilities(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantFacilitiesResolver]Error getting Facilities node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vFacility.DisplayName()
parentLabels := map[string]interface{}{"facilities.inventory.saurient.io":dn}
vFacilityID := string(vFacility.Spec.FacilityID)
vName := string(vFacility.Spec.Name)
vLocation := string(vFacility.Spec.Location)
vCountryCode := string(vFacility.Spec.CountryCode)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryFacility {
	Id: &dn,
	ParentLabels: parentLabels,
	FacilityID: &vFacilityID,
	Name: &vName,
	Location: &vLocation,
	CountryCode: &vCountryCode,
	}
		vInventoryFacilityList = append(vInventoryFacilityList, ret)
	}

	log.Debugf("[getInventoryTenantFacilitiesResolver]Output Facilities objects %v", vInventoryFacilityList)

	return vInventoryFacilityList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Products Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantProductsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryProduct, error) {
	log.Debugf("[getInventoryTenantProductsResolver]Parent Object %+v", obj)
	var vInventoryProductList []*model.InventoryProduct
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantProductsResolver]Id %q", *id)
		vProduct, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetProducts(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantProductsResolver]Error getting Products node %q : %s", *id, err)
            return vInventoryProductList, nil
        }
		dn := vProduct.DisplayName()
parentLabels := map[string]interface{}{"products.inventory.saurient.io":dn}
vProductID := string(vProduct.Spec.ProductID)
vProductName := string(vProduct.Spec.ProductName)
vCommodityType := string(vProduct.Spec.CommodityType)
vBatchID := string(vProduct.Spec.BatchID)
vCnCode := string(vProduct.Spec.CnCode)
vHsCode := string(vProduct.Spec.HsCode)
vUnit := string(vProduct.Spec.Unit)
vTenantID := string(vProduct.Spec.TenantID)
vFacilityID := string(vProduct.Spec.FacilityID)
vActivityDataRaw := string(vProduct.Spec.ActivityDataRaw)
vRulebookRef := string(vProduct.Spec.RulebookRef)
vPhase := string(vProduct.Spec.Phase)
vPassportID := string(vProduct.Spec.PassportID)
vTotalFootprintKg := float64(vProduct.Spec.TotalFootprintKg)
vDataHash := string(vProduct.Spec.DataHash)
vLastUpdated := string(vProduct.Spec.LastUpdated)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryProduct {
	Id: &dn,
	ParentLabels: parentLabels,
	ProductID: &vProductID,
	ProductName: &vProductName,
	CommodityType: &vCommodityType,
	BatchID: &vBatchID,
	CnCode: &vCnCode,
	HsCode: &vHsCode,
	Unit: &vUnit,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	ActivityDataRaw: &vActivityDataRaw,
	RulebookRef: &vRulebookRef,
	Phase: &vPhase,
	PassportID: &vPassportID,
	TotalFootprintKg: &vTotalFootprintKg,
	DataHash: &vDataHash,
	LastUpdated: &vLastUpdated,
	}
		vInventoryProductList = append(vInventoryProductList, ret)

		log.Debugf("[getInventoryTenantProductsResolver]Output Products objects %v", vInventoryProductList)

		return vInventoryProductList, nil
	}

	log.Debug("[getInventoryTenantProductsResolver]Id is empty, process all Productss")

	vProductParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantProductsResolver]Error getting parent node %s", err)
        return vInventoryProductList, nil
    }
	vProductAllObj, err := vProductParent.GetAllProducts(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantProductsResolver]Error getting Products objects %s", err)
        return vInventoryProductList, nil
    }
	for _, i := range vProductAllObj {
		vProduct, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetProducts(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantProductsResolver]Error getting Products node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vProduct.DisplayName()
parentLabels := map[string]interface{}{"products.inventory.saurient.io":dn}
vProductID := string(vProduct.Spec.ProductID)
vProductName := string(vProduct.Spec.ProductName)
vCommodityType := string(vProduct.Spec.CommodityType)
vBatchID := string(vProduct.Spec.BatchID)
vCnCode := string(vProduct.Spec.CnCode)
vHsCode := string(vProduct.Spec.HsCode)
vUnit := string(vProduct.Spec.Unit)
vTenantID := string(vProduct.Spec.TenantID)
vFacilityID := string(vProduct.Spec.FacilityID)
vActivityDataRaw := string(vProduct.Spec.ActivityDataRaw)
vRulebookRef := string(vProduct.Spec.RulebookRef)
vPhase := string(vProduct.Spec.Phase)
vPassportID := string(vProduct.Spec.PassportID)
vTotalFootprintKg := float64(vProduct.Spec.TotalFootprintKg)
vDataHash := string(vProduct.Spec.DataHash)
vLastUpdated := string(vProduct.Spec.LastUpdated)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryProduct {
	Id: &dn,
	ParentLabels: parentLabels,
	ProductID: &vProductID,
	ProductName: &vProductName,
	CommodityType: &vCommodityType,
	BatchID: &vBatchID,
	CnCode: &vCnCode,
	HsCode: &vHsCode,
	Unit: &vUnit,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	ActivityDataRaw: &vActivityDataRaw,
	RulebookRef: &vRulebookRef,
	Phase: &vPhase,
	PassportID: &vPassportID,
	TotalFootprintKg: &vTotalFootprintKg,
	DataHash: &vDataHash,
	LastUpdated: &vLastUpdated,
	}
		vInventoryProductList = append(vInventoryProductList, ret)
	}

	log.Debugf("[getInventoryTenantProductsResolver]Output Products objects %v", vInventoryProductList)

	return vInventoryProductList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Meters Node: Facility PKG: Inventory
//////////////////////////////////////
func getInventoryFacilityMetersResolver(obj *model.InventoryFacility, id *string) ([]*model.InventoryMeter, error) {
	log.Debugf("[getInventoryFacilityMetersResolver]Parent Object %+v", obj)
	var vInventoryMeterList []*model.InventoryMeter
	if id != nil && *id != "" {
		log.Debugf("[getInventoryFacilityMetersResolver]Id %q", *id)
		vMeter, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).Facilities(getParentName(obj.ParentLabels, "facilities.inventory.saurient.io")).GetMeters(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryFacilityMetersResolver]Error getting Meters node %q : %s", *id, err)
            return vInventoryMeterList, nil
        }
		dn := vMeter.DisplayName()
parentLabels := map[string]interface{}{"meters.inventory.saurient.io":dn}
vMeterID := string(vMeter.Spec.MeterID)
vMeterType := string(vMeter.Spec.MeterType)
vManufacturer := string(vMeter.Spec.Manufacturer)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryMeter {
	Id: &dn,
	ParentLabels: parentLabels,
	MeterID: &vMeterID,
	MeterType: &vMeterType,
	Manufacturer: &vManufacturer,
	}
		vInventoryMeterList = append(vInventoryMeterList, ret)

		log.Debugf("[getInventoryFacilityMetersResolver]Output Meters objects %v", vInventoryMeterList)

		return vInventoryMeterList, nil
	}

	log.Debug("[getInventoryFacilityMetersResolver]Id is empty, process all Meterss")

	vMeterParent, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetFacilities(context.TODO(), getParentName(obj.ParentLabels, "facilities.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryFacilityMetersResolver]Error getting parent node %s", err)
        return vInventoryMeterList, nil
    }
	vMeterAllObj, err := vMeterParent.GetAllMeters(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryFacilityMetersResolver]Error getting Meters objects %s", err)
        return vInventoryMeterList, nil
    }
	for _, i := range vMeterAllObj {
		vMeter, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).Facilities(getParentName(obj.ParentLabels, "facilities.inventory.saurient.io")).GetMeters(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryFacilityMetersResolver]Error getting Meters node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vMeter.DisplayName()
parentLabels := map[string]interface{}{"meters.inventory.saurient.io":dn}
vMeterID := string(vMeter.Spec.MeterID)
vMeterType := string(vMeter.Spec.MeterType)
vManufacturer := string(vMeter.Spec.Manufacturer)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryMeter {
	Id: &dn,
	ParentLabels: parentLabels,
	MeterID: &vMeterID,
	MeterType: &vMeterType,
	Manufacturer: &vManufacturer,
	}
		vInventoryMeterList = append(vInventoryMeterList, ret)
	}

	log.Debugf("[getInventoryFacilityMetersResolver]Output Meters objects %v", vInventoryMeterList)

	return vInventoryMeterList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: LogisticsLegs Node: Product PKG: Inventory
//////////////////////////////////////
func getInventoryProductLogisticsLegsResolver(obj *model.InventoryProduct, id *string) ([]*model.InventoryLogisticsLeg, error) {
	log.Debugf("[getInventoryProductLogisticsLegsResolver]Parent Object %+v", obj)
	var vInventoryLogisticsLegList []*model.InventoryLogisticsLeg
	if id != nil && *id != "" {
		log.Debugf("[getInventoryProductLogisticsLegsResolver]Id %q", *id)
		vLogisticsLeg, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).Products(getParentName(obj.ParentLabels, "products.inventory.saurient.io")).GetLogisticsLegs(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryProductLogisticsLegsResolver]Error getting LogisticsLegs node %q : %s", *id, err)
            return vInventoryLogisticsLegList, nil
        }
		dn := vLogisticsLeg.DisplayName()
parentLabels := map[string]interface{}{"logisticslegs.inventory.saurient.io":dn}
vLegSequence := int(vLogisticsLeg.Spec.LegSequence)
vMode := string(vLogisticsLeg.Spec.Mode)
vOrigin := string(vLogisticsLeg.Spec.Origin)
vDestination := string(vLogisticsLeg.Spec.Destination)
vDistanceKm := float64(vLogisticsLeg.Spec.DistanceKm)
vCarrierName := string(vLogisticsLeg.Spec.CarrierName)
vTransportEmissionsKg := float64(vLogisticsLeg.Spec.TransportEmissionsKg)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryLogisticsLeg {
	Id: &dn,
	ParentLabels: parentLabels,
	LegSequence: &vLegSequence,
	Mode: &vMode,
	Origin: &vOrigin,
	Destination: &vDestination,
	DistanceKm: &vDistanceKm,
	CarrierName: &vCarrierName,
	TransportEmissionsKg: &vTransportEmissionsKg,
	}
		vInventoryLogisticsLegList = append(vInventoryLogisticsLegList, ret)

		log.Debugf("[getInventoryProductLogisticsLegsResolver]Output LogisticsLegs objects %v", vInventoryLogisticsLegList)

		return vInventoryLogisticsLegList, nil
	}

	log.Debug("[getInventoryProductLogisticsLegsResolver]Id is empty, process all LogisticsLegss")

	vLogisticsLegParent, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetProducts(context.TODO(), getParentName(obj.ParentLabels, "products.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryProductLogisticsLegsResolver]Error getting parent node %s", err)
        return vInventoryLogisticsLegList, nil
    }
	vLogisticsLegAllObj, err := vLogisticsLegParent.GetAllLogisticsLegs(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryProductLogisticsLegsResolver]Error getting LogisticsLegs objects %s", err)
        return vInventoryLogisticsLegList, nil
    }
	for _, i := range vLogisticsLegAllObj {
		vLogisticsLeg, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).Products(getParentName(obj.ParentLabels, "products.inventory.saurient.io")).GetLogisticsLegs(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryProductLogisticsLegsResolver]Error getting LogisticsLegs node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vLogisticsLeg.DisplayName()
parentLabels := map[string]interface{}{"logisticslegs.inventory.saurient.io":dn}
vLegSequence := int(vLogisticsLeg.Spec.LegSequence)
vMode := string(vLogisticsLeg.Spec.Mode)
vOrigin := string(vLogisticsLeg.Spec.Origin)
vDestination := string(vLogisticsLeg.Spec.Destination)
vDistanceKm := float64(vLogisticsLeg.Spec.DistanceKm)
vCarrierName := string(vLogisticsLeg.Spec.CarrierName)
vTransportEmissionsKg := float64(vLogisticsLeg.Spec.TransportEmissionsKg)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryLogisticsLeg {
	Id: &dn,
	ParentLabels: parentLabels,
	LegSequence: &vLegSequence,
	Mode: &vMode,
	Origin: &vOrigin,
	Destination: &vDestination,
	DistanceKm: &vDistanceKm,
	CarrierName: &vCarrierName,
	TransportEmissionsKg: &vTransportEmissionsKg,
	}
		vInventoryLogisticsLegList = append(vInventoryLogisticsLegList, ret)
	}

	log.Debugf("[getInventoryProductLogisticsLegsResolver]Output LogisticsLegs objects %v", vInventoryLogisticsLegList)

	return vInventoryLogisticsLegList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Declarations Node: Supplier PKG: Inventory
//////////////////////////////////////
func getInventorySupplierDeclarationsResolver(obj *model.InventorySupplier, id *string) ([]*model.InventoryDeclaration, error) {
	log.Debugf("[getInventorySupplierDeclarationsResolver]Parent Object %+v", obj)
	var vInventoryDeclarationList []*model.InventoryDeclaration
	if id != nil && *id != "" {
		log.Debugf("[getInventorySupplierDeclarationsResolver]Id %q", *id)
		vDeclaration, err := nc.RootRoot().Inventory().Suppliers(getParentName(obj.ParentLabels, "suppliers.inventory.saurient.io")).GetDeclarations(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventorySupplierDeclarationsResolver]Error getting Declarations node %q : %s", *id, err)
            return vInventoryDeclarationList, nil
        }
		dn := vDeclaration.DisplayName()
parentLabels := map[string]interface{}{"declarations.inventory.saurient.io":dn}
vDeclarationID := string(vDeclaration.Spec.DeclarationID)
vMaterialName := string(vDeclaration.Spec.MaterialName)
vClaimedPcfIntensity := float64(vDeclaration.Spec.ClaimedPcfIntensity)
vUnit := string(vDeclaration.Spec.Unit)
vDataClassification := string(vDeclaration.Spec.DataClassification)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryDeclaration {
	Id: &dn,
	ParentLabels: parentLabels,
	DeclarationID: &vDeclarationID,
	MaterialName: &vMaterialName,
	ClaimedPcfIntensity: &vClaimedPcfIntensity,
	Unit: &vUnit,
	DataClassification: &vDataClassification,
	}
		vInventoryDeclarationList = append(vInventoryDeclarationList, ret)

		log.Debugf("[getInventorySupplierDeclarationsResolver]Output Declarations objects %v", vInventoryDeclarationList)

		return vInventoryDeclarationList, nil
	}

	log.Debug("[getInventorySupplierDeclarationsResolver]Id is empty, process all Declarationss")

	vDeclarationParent, err := nc.RootRoot().Inventory().GetSuppliers(context.TODO(), getParentName(obj.ParentLabels, "suppliers.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventorySupplierDeclarationsResolver]Error getting parent node %s", err)
        return vInventoryDeclarationList, nil
    }
	vDeclarationAllObj, err := vDeclarationParent.GetAllDeclarations(context.TODO())
	if err != nil {
	    log.Errorf("[getInventorySupplierDeclarationsResolver]Error getting Declarations objects %s", err)
        return vInventoryDeclarationList, nil
    }
	for _, i := range vDeclarationAllObj {
		vDeclaration, err := nc.RootRoot().Inventory().Suppliers(getParentName(obj.ParentLabels, "suppliers.inventory.saurient.io")).GetDeclarations(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventorySupplierDeclarationsResolver]Error getting Declarations node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vDeclaration.DisplayName()
parentLabels := map[string]interface{}{"declarations.inventory.saurient.io":dn}
vDeclarationID := string(vDeclaration.Spec.DeclarationID)
vMaterialName := string(vDeclaration.Spec.MaterialName)
vClaimedPcfIntensity := float64(vDeclaration.Spec.ClaimedPcfIntensity)
vUnit := string(vDeclaration.Spec.Unit)
vDataClassification := string(vDeclaration.Spec.DataClassification)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryDeclaration {
	Id: &dn,
	ParentLabels: parentLabels,
	DeclarationID: &vDeclarationID,
	MaterialName: &vMaterialName,
	ClaimedPcfIntensity: &vClaimedPcfIntensity,
	Unit: &vUnit,
	DataClassification: &vDataClassification,
	}
		vInventoryDeclarationList = append(vInventoryDeclarationList, ret)
	}

	log.Debugf("[getInventorySupplierDeclarationsResolver]Output Declarations objects %v", vInventoryDeclarationList)

	return vInventoryDeclarationList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: TelemetryReadings Node: Runtime PKG: Runtime
//////////////////////////////////////
func getRuntimeRuntimeTelemetryReadingsResolver(obj *model.RuntimeRuntime, id *string) ([]*model.RuntimeTelemetryReading, error) {
	log.Debugf("[getRuntimeRuntimeTelemetryReadingsResolver]Parent Object %+v", obj)
	var vRuntimeTelemetryReadingList []*model.RuntimeTelemetryReading
	if id != nil && *id != "" {
		log.Debugf("[getRuntimeRuntimeTelemetryReadingsResolver]Id %q", *id)
		vTelemetryReading, err := nc.RootRoot().Runtime().GetTelemetryReadings(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getRuntimeRuntimeTelemetryReadingsResolver]Error getting TelemetryReadings node %q : %s", *id, err)
            return vRuntimeTelemetryReadingList, nil
        }
		dn := vTelemetryReading.DisplayName()
parentLabels := map[string]interface{}{"telemetryreadings.runtime.saurient.io":dn}
vValue := float64(vTelemetryReading.Spec.Value)
vUnit := string(vTelemetryReading.Spec.Unit)
vReadingType := string(vTelemetryReading.Spec.ReadingType)
vIngestedAt := string(vTelemetryReading.Spec.IngestedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeTelemetryReading {
	Id: &dn,
	ParentLabels: parentLabels,
	Value: &vValue,
	Unit: &vUnit,
	ReadingType: &vReadingType,
	IngestedAt: &vIngestedAt,
	}
		vRuntimeTelemetryReadingList = append(vRuntimeTelemetryReadingList, ret)

		log.Debugf("[getRuntimeRuntimeTelemetryReadingsResolver]Output TelemetryReadings objects %v", vRuntimeTelemetryReadingList)

		return vRuntimeTelemetryReadingList, nil
	}

	log.Debug("[getRuntimeRuntimeTelemetryReadingsResolver]Id is empty, process all TelemetryReadingss")

	vTelemetryReadingParent, err := nc.RootRoot().GetRuntime(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeRuntimeTelemetryReadingsResolver]Error getting parent node %s", err)
        return vRuntimeTelemetryReadingList, nil
    }
	vTelemetryReadingAllObj, err := vTelemetryReadingParent.GetAllTelemetryReadings(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeRuntimeTelemetryReadingsResolver]Error getting TelemetryReadings objects %s", err)
        return vRuntimeTelemetryReadingList, nil
    }
	for _, i := range vTelemetryReadingAllObj {
		vTelemetryReading, err := nc.RootRoot().Runtime().GetTelemetryReadings(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getRuntimeRuntimeTelemetryReadingsResolver]Error getting TelemetryReadings node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vTelemetryReading.DisplayName()
parentLabels := map[string]interface{}{"telemetryreadings.runtime.saurient.io":dn}
vValue := float64(vTelemetryReading.Spec.Value)
vUnit := string(vTelemetryReading.Spec.Unit)
vReadingType := string(vTelemetryReading.Spec.ReadingType)
vIngestedAt := string(vTelemetryReading.Spec.IngestedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeTelemetryReading {
	Id: &dn,
	ParentLabels: parentLabels,
	Value: &vValue,
	Unit: &vUnit,
	ReadingType: &vReadingType,
	IngestedAt: &vIngestedAt,
	}
		vRuntimeTelemetryReadingList = append(vRuntimeTelemetryReadingList, ret)
	}

	log.Debugf("[getRuntimeRuntimeTelemetryReadingsResolver]Output TelemetryReadings objects %v", vRuntimeTelemetryReadingList)

	return vRuntimeTelemetryReadingList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Engagements Node: Runtime PKG: Runtime
//////////////////////////////////////
func getRuntimeRuntimeEngagementsResolver(obj *model.RuntimeRuntime, id *string) ([]*model.RuntimeACVEngagement, error) {
	log.Debugf("[getRuntimeRuntimeEngagementsResolver]Parent Object %+v", obj)
	var vRuntimeACVEngagementList []*model.RuntimeACVEngagement
	if id != nil && *id != "" {
		log.Debugf("[getRuntimeRuntimeEngagementsResolver]Id %q", *id)
		vACVEngagement, err := nc.RootRoot().Runtime().GetEngagements(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getRuntimeRuntimeEngagementsResolver]Error getting Engagements node %q : %s", *id, err)
            return vRuntimeACVEngagementList, nil
        }
		dn := vACVEngagement.DisplayName()
parentLabels := map[string]interface{}{"acvengagements.runtime.saurient.io":dn}
vEngagementID := string(vACVEngagement.Spec.EngagementID)
vAgencyID := string(vACVEngagement.Spec.AgencyID)
vStatus := string(vACVEngagement.Spec.Status)
vAcceptedBy := string(vACVEngagement.Spec.AcceptedBy)
vSignedBy := string(vACVEngagement.Spec.SignedBy)
vOpinion := string(vACVEngagement.Spec.Opinion)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeACVEngagement {
	Id: &dn,
	ParentLabels: parentLabels,
	EngagementID: &vEngagementID,
	AgencyID: &vAgencyID,
	Status: &vStatus,
	AcceptedBy: &vAcceptedBy,
	SignedBy: &vSignedBy,
	Opinion: &vOpinion,
	}
		vRuntimeACVEngagementList = append(vRuntimeACVEngagementList, ret)

		log.Debugf("[getRuntimeRuntimeEngagementsResolver]Output Engagements objects %v", vRuntimeACVEngagementList)

		return vRuntimeACVEngagementList, nil
	}

	log.Debug("[getRuntimeRuntimeEngagementsResolver]Id is empty, process all Engagementss")

	vACVEngagementParent, err := nc.RootRoot().GetRuntime(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeRuntimeEngagementsResolver]Error getting parent node %s", err)
        return vRuntimeACVEngagementList, nil
    }
	vACVEngagementAllObj, err := vACVEngagementParent.GetAllEngagements(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeRuntimeEngagementsResolver]Error getting Engagements objects %s", err)
        return vRuntimeACVEngagementList, nil
    }
	for _, i := range vACVEngagementAllObj {
		vACVEngagement, err := nc.RootRoot().Runtime().GetEngagements(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getRuntimeRuntimeEngagementsResolver]Error getting Engagements node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vACVEngagement.DisplayName()
parentLabels := map[string]interface{}{"acvengagements.runtime.saurient.io":dn}
vEngagementID := string(vACVEngagement.Spec.EngagementID)
vAgencyID := string(vACVEngagement.Spec.AgencyID)
vStatus := string(vACVEngagement.Spec.Status)
vAcceptedBy := string(vACVEngagement.Spec.AcceptedBy)
vSignedBy := string(vACVEngagement.Spec.SignedBy)
vOpinion := string(vACVEngagement.Spec.Opinion)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeACVEngagement {
	Id: &dn,
	ParentLabels: parentLabels,
	EngagementID: &vEngagementID,
	AgencyID: &vAgencyID,
	Status: &vStatus,
	AcceptedBy: &vAcceptedBy,
	SignedBy: &vSignedBy,
	Opinion: &vOpinion,
	}
		vRuntimeACVEngagementList = append(vRuntimeACVEngagementList, ret)
	}

	log.Debugf("[getRuntimeRuntimeEngagementsResolver]Output Engagements objects %v", vRuntimeACVEngagementList)

	return vRuntimeACVEngagementList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Passports Node: Runtime PKG: Runtime
//////////////////////////////////////
func getRuntimeRuntimePassportsResolver(obj *model.RuntimeRuntime, id *string) ([]*model.RuntimeCarbonPassport, error) {
	log.Debugf("[getRuntimeRuntimePassportsResolver]Parent Object %+v", obj)
	var vRuntimeCarbonPassportList []*model.RuntimeCarbonPassport
	if id != nil && *id != "" {
		log.Debugf("[getRuntimeRuntimePassportsResolver]Id %q", *id)
		vCarbonPassport, err := nc.RootRoot().Runtime().GetPassports(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getRuntimeRuntimePassportsResolver]Error getting Passports node %q : %s", *id, err)
            return vRuntimeCarbonPassportList, nil
        }
		dn := vCarbonPassport.DisplayName()
parentLabels := map[string]interface{}{"carbonpassports.runtime.saurient.io":dn}
vPassportID := string(vCarbonPassport.Spec.PassportID)
vTenantID := string(vCarbonPassport.Spec.TenantID)
vFacilityID := string(vCarbonPassport.Spec.FacilityID)
vBatchID := string(vCarbonPassport.Spec.BatchID)
vCommodityType := string(vCarbonPassport.Spec.CommodityType)
vTotalFootprintKg := float64(vCarbonPassport.Spec.TotalFootprintKg)
vScope1Kg := float64(vCarbonPassport.Spec.Scope1Kg)
vScope2Kg := float64(vCarbonPassport.Spec.Scope2Kg)
vScope3Kg := float64(vCarbonPassport.Spec.Scope3Kg)
vIntensityPerUnit := float64(vCarbonPassport.Spec.IntensityPerUnit)
vVerificationStatus := string(vCarbonPassport.Spec.VerificationStatus)
vCalculationDetails := string(vCarbonPassport.Spec.CalculationDetails)
vPassportDataRaw := string(vCarbonPassport.Spec.PassportDataRaw)
vDataHash := string(vCarbonPassport.Spec.DataHash)
vFrozen := bool(vCarbonPassport.Spec.Frozen)
vFrozenAt := string(vCarbonPassport.Spec.FrozenAt)
vIssuedAt := string(vCarbonPassport.Spec.IssuedAt)
vVersion := string(vCarbonPassport.Spec.Version)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeCarbonPassport {
	Id: &dn,
	ParentLabels: parentLabels,
	PassportID: &vPassportID,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	BatchID: &vBatchID,
	CommodityType: &vCommodityType,
	TotalFootprintKg: &vTotalFootprintKg,
	Scope1Kg: &vScope1Kg,
	Scope2Kg: &vScope2Kg,
	Scope3Kg: &vScope3Kg,
	IntensityPerUnit: &vIntensityPerUnit,
	VerificationStatus: &vVerificationStatus,
	CalculationDetails: &vCalculationDetails,
	PassportDataRaw: &vPassportDataRaw,
	DataHash: &vDataHash,
	Frozen: &vFrozen,
	FrozenAt: &vFrozenAt,
	IssuedAt: &vIssuedAt,
	Version: &vVersion,
	}
		vRuntimeCarbonPassportList = append(vRuntimeCarbonPassportList, ret)

		log.Debugf("[getRuntimeRuntimePassportsResolver]Output Passports objects %v", vRuntimeCarbonPassportList)

		return vRuntimeCarbonPassportList, nil
	}

	log.Debug("[getRuntimeRuntimePassportsResolver]Id is empty, process all Passportss")

	vCarbonPassportParent, err := nc.RootRoot().GetRuntime(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeRuntimePassportsResolver]Error getting parent node %s", err)
        return vRuntimeCarbonPassportList, nil
    }
	vCarbonPassportAllObj, err := vCarbonPassportParent.GetAllPassports(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeRuntimePassportsResolver]Error getting Passports objects %s", err)
        return vRuntimeCarbonPassportList, nil
    }
	for _, i := range vCarbonPassportAllObj {
		vCarbonPassport, err := nc.RootRoot().Runtime().GetPassports(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getRuntimeRuntimePassportsResolver]Error getting Passports node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vCarbonPassport.DisplayName()
parentLabels := map[string]interface{}{"carbonpassports.runtime.saurient.io":dn}
vPassportID := string(vCarbonPassport.Spec.PassportID)
vTenantID := string(vCarbonPassport.Spec.TenantID)
vFacilityID := string(vCarbonPassport.Spec.FacilityID)
vBatchID := string(vCarbonPassport.Spec.BatchID)
vCommodityType := string(vCarbonPassport.Spec.CommodityType)
vTotalFootprintKg := float64(vCarbonPassport.Spec.TotalFootprintKg)
vScope1Kg := float64(vCarbonPassport.Spec.Scope1Kg)
vScope2Kg := float64(vCarbonPassport.Spec.Scope2Kg)
vScope3Kg := float64(vCarbonPassport.Spec.Scope3Kg)
vIntensityPerUnit := float64(vCarbonPassport.Spec.IntensityPerUnit)
vVerificationStatus := string(vCarbonPassport.Spec.VerificationStatus)
vCalculationDetails := string(vCarbonPassport.Spec.CalculationDetails)
vPassportDataRaw := string(vCarbonPassport.Spec.PassportDataRaw)
vDataHash := string(vCarbonPassport.Spec.DataHash)
vFrozen := bool(vCarbonPassport.Spec.Frozen)
vFrozenAt := string(vCarbonPassport.Spec.FrozenAt)
vIssuedAt := string(vCarbonPassport.Spec.IssuedAt)
vVersion := string(vCarbonPassport.Spec.Version)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeCarbonPassport {
	Id: &dn,
	ParentLabels: parentLabels,
	PassportID: &vPassportID,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	BatchID: &vBatchID,
	CommodityType: &vCommodityType,
	TotalFootprintKg: &vTotalFootprintKg,
	Scope1Kg: &vScope1Kg,
	Scope2Kg: &vScope2Kg,
	Scope3Kg: &vScope3Kg,
	IntensityPerUnit: &vIntensityPerUnit,
	VerificationStatus: &vVerificationStatus,
	CalculationDetails: &vCalculationDetails,
	PassportDataRaw: &vPassportDataRaw,
	DataHash: &vDataHash,
	Frozen: &vFrozen,
	FrozenAt: &vFrozenAt,
	IssuedAt: &vIssuedAt,
	Version: &vVersion,
	}
		vRuntimeCarbonPassportList = append(vRuntimeCarbonPassportList, ret)
	}

	log.Debugf("[getRuntimeRuntimePassportsResolver]Output Passports objects %v", vRuntimeCarbonPassportList)

	return vRuntimeCarbonPassportList, nil
}

//////////////////////////////////////
// LINK RESOLVER
// FieldName: MeterRef Node: TelemetryReading PKG: Runtime
//////////////////////////////////////
func getRuntimeTelemetryReadingMeterRefResolver(obj *model.RuntimeTelemetryReading) (*model.InventoryMeter, error) {
    log.Debugf("[getRuntimeTelemetryReadingMeterRefResolver]Parent Object %+v", obj)
	vMeterParent, err := nc.RootRoot().Runtime().GetTelemetryReadings(context.TODO(), getParentName(obj.ParentLabels, "telemetryreadings.runtime.saurient.io"))
	if err != nil {
	    log.Errorf("[getRuntimeTelemetryReadingMeterRefResolver]Error getting parent node %s", err)
        return &model.InventoryMeter{}, nil
    }
	vMeter, err := vMeterParent.GetMeterRef(context.TODO())
	if err != nil {
		log.Errorf("[getRuntimeTelemetryReadingMeterRefResolver]Error getting MeterRef object %s", err)
        return &model.InventoryMeter{}, nil
    }
	dn := vMeter.DisplayName()
parentLabels := map[string]interface{}{"meters.inventory.saurient.io":dn}
vMeterID := string(vMeter.Spec.MeterID)
vMeterType := string(vMeter.Spec.MeterType)
vManufacturer := string(vMeter.Spec.Manufacturer)

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.InventoryMeter {
	Id: &dn,
	ParentLabels: parentLabels,
	MeterID: &vMeterID,
	MeterType: &vMeterType,
	Manufacturer: &vManufacturer,
	}
	log.Debugf("[getRuntimeTelemetryReadingMeterRefResolver]Output object %v", ret)

	return ret, nil
}

//////////////////////////////////////
// LINK RESOLVER
// FieldName: ProductRef Node: CarbonPassport PKG: Runtime
//////////////////////////////////////
func getRuntimeCarbonPassportProductRefResolver(obj *model.RuntimeCarbonPassport) (*model.InventoryProduct, error) {
    log.Debugf("[getRuntimeCarbonPassportProductRefResolver]Parent Object %+v", obj)
	vProductParent, err := nc.RootRoot().Runtime().GetPassports(context.TODO(), getParentName(obj.ParentLabels, "carbonpassports.runtime.saurient.io"))
	if err != nil {
	    log.Errorf("[getRuntimeCarbonPassportProductRefResolver]Error getting parent node %s", err)
        return &model.InventoryProduct{}, nil
    }
	vProduct, err := vProductParent.GetProductRef(context.TODO())
	if err != nil {
		log.Errorf("[getRuntimeCarbonPassportProductRefResolver]Error getting ProductRef object %s", err)
        return &model.InventoryProduct{}, nil
    }
	dn := vProduct.DisplayName()
parentLabels := map[string]interface{}{"products.inventory.saurient.io":dn}
vProductID := string(vProduct.Spec.ProductID)
vProductName := string(vProduct.Spec.ProductName)
vCommodityType := string(vProduct.Spec.CommodityType)
vBatchID := string(vProduct.Spec.BatchID)
vCnCode := string(vProduct.Spec.CnCode)
vHsCode := string(vProduct.Spec.HsCode)
vUnit := string(vProduct.Spec.Unit)
vTenantID := string(vProduct.Spec.TenantID)
vFacilityID := string(vProduct.Spec.FacilityID)
vActivityDataRaw := string(vProduct.Spec.ActivityDataRaw)
vRulebookRef := string(vProduct.Spec.RulebookRef)
vPhase := string(vProduct.Spec.Phase)
vPassportID := string(vProduct.Spec.PassportID)
vTotalFootprintKg := float64(vProduct.Spec.TotalFootprintKg)
vDataHash := string(vProduct.Spec.DataHash)
vLastUpdated := string(vProduct.Spec.LastUpdated)

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.InventoryProduct {
	Id: &dn,
	ParentLabels: parentLabels,
	ProductID: &vProductID,
	ProductName: &vProductName,
	CommodityType: &vCommodityType,
	BatchID: &vBatchID,
	CnCode: &vCnCode,
	HsCode: &vHsCode,
	Unit: &vUnit,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	ActivityDataRaw: &vActivityDataRaw,
	RulebookRef: &vRulebookRef,
	Phase: &vPhase,
	PassportID: &vPassportID,
	TotalFootprintKg: &vTotalFootprintKg,
	DataHash: &vDataHash,
	LastUpdated: &vLastUpdated,
	}
	log.Debugf("[getRuntimeCarbonPassportProductRefResolver]Output object %v", ret)

	return ret, nil
}

//////////////////////////////////////
// LINK RESOLVER
// FieldName: EngagementRef Node: CarbonPassport PKG: Runtime
//////////////////////////////////////
func getRuntimeCarbonPassportEngagementRefResolver(obj *model.RuntimeCarbonPassport) (*model.RuntimeACVEngagement, error) {
    log.Debugf("[getRuntimeCarbonPassportEngagementRefResolver]Parent Object %+v", obj)
	vACVEngagementParent, err := nc.RootRoot().Runtime().GetPassports(context.TODO(), getParentName(obj.ParentLabels, "carbonpassports.runtime.saurient.io"))
	if err != nil {
	    log.Errorf("[getRuntimeCarbonPassportEngagementRefResolver]Error getting parent node %s", err)
        return &model.RuntimeACVEngagement{}, nil
    }
	vACVEngagement, err := vACVEngagementParent.GetEngagementRef(context.TODO())
	if err != nil {
		log.Errorf("[getRuntimeCarbonPassportEngagementRefResolver]Error getting EngagementRef object %s", err)
        return &model.RuntimeACVEngagement{}, nil
    }
	dn := vACVEngagement.DisplayName()
parentLabels := map[string]interface{}{"acvengagements.runtime.saurient.io":dn}
vEngagementID := string(vACVEngagement.Spec.EngagementID)
vAgencyID := string(vACVEngagement.Spec.AgencyID)
vStatus := string(vACVEngagement.Spec.Status)
vAcceptedBy := string(vACVEngagement.Spec.AcceptedBy)
vSignedBy := string(vACVEngagement.Spec.SignedBy)
vOpinion := string(vACVEngagement.Spec.Opinion)

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.RuntimeACVEngagement {
	Id: &dn,
	ParentLabels: parentLabels,
	EngagementID: &vEngagementID,
	AgencyID: &vAgencyID,
	Status: &vStatus,
	AcceptedBy: &vAcceptedBy,
	SignedBy: &vSignedBy,
	Opinion: &vOpinion,
	}
	log.Debugf("[getRuntimeCarbonPassportEngagementRefResolver]Output object %v", ret)

	return ret, nil
}

//////////////////////////////////////
// LINK RESOLVER
// FieldName: RulebookRef Node: CarbonPassport PKG: Runtime
//////////////////////////////////////
func getRuntimeCarbonPassportRulebookRefResolver(obj *model.RuntimeCarbonPassport) (*model.ConfigRulebook, error) {
    log.Debugf("[getRuntimeCarbonPassportRulebookRefResolver]Parent Object %+v", obj)
	vRulebookParent, err := nc.RootRoot().Runtime().GetPassports(context.TODO(), getParentName(obj.ParentLabels, "carbonpassports.runtime.saurient.io"))
	if err != nil {
	    log.Errorf("[getRuntimeCarbonPassportRulebookRefResolver]Error getting parent node %s", err)
        return &model.ConfigRulebook{}, nil
    }
	vRulebook, err := vRulebookParent.GetRulebookRef(context.TODO())
	if err != nil {
		log.Errorf("[getRuntimeCarbonPassportRulebookRefResolver]Error getting RulebookRef object %s", err)
        return &model.ConfigRulebook{}, nil
    }
	dn := vRulebook.DisplayName()
parentLabels := map[string]interface{}{"rulebooks.config.saurient.io":dn}
vRulebookID := string(vRulebook.Spec.RulebookID)
vCommodityType := string(vRulebook.Spec.CommodityType)
vVersion := string(vRulebook.Spec.Version)
vAccountingMode := string(vRulebook.Spec.AccountingMode)
vStandard := string(vRulebook.Spec.Standard)
vRulesRaw := string(vRulebook.Spec.RulesRaw)
vScope1Formula := string(vRulebook.Spec.Scope1Formula)
vScope2Formula := string(vRulebook.Spec.Scope2Formula)
vScope3Formula := string(vRulebook.Spec.Scope3Formula)
vFunctionalUnit := string(vRulebook.Spec.FunctionalUnit)
vBatchQuantity := float64(vRulebook.Spec.BatchQuantity)
vBoundaryType := string(vRulebook.Spec.BoundaryType)
vAllocationMethod := string(vRulebook.Spec.AllocationMethod)

    for k, v := range obj.ParentLabels {
        parentLabels[k] = v
    }
	ret := &model.ConfigRulebook {
	Id: &dn,
	ParentLabels: parentLabels,
	RulebookID: &vRulebookID,
	CommodityType: &vCommodityType,
	Version: &vVersion,
	AccountingMode: &vAccountingMode,
	Standard: &vStandard,
	RulesRaw: &vRulesRaw,
	Scope1Formula: &vScope1Formula,
	Scope2Formula: &vScope2Formula,
	Scope3Formula: &vScope3Formula,
	FunctionalUnit: &vFunctionalUnit,
	BatchQuantity: &vBatchQuantity,
	BoundaryType: &vBoundaryType,
	AllocationMethod: &vAllocationMethod,
	}
	log.Debugf("[getRuntimeCarbonPassportRulebookRefResolver]Output object %v", ret)

	return ret, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: AuditRecords Node: CarbonPassport PKG: Runtime
//////////////////////////////////////
func getRuntimeCarbonPassportAuditRecordsResolver(obj *model.RuntimeCarbonPassport, id *string) ([]*model.RuntimeAuditRecord, error) {
	log.Debugf("[getRuntimeCarbonPassportAuditRecordsResolver]Parent Object %+v", obj)
	var vRuntimeAuditRecordList []*model.RuntimeAuditRecord
	if id != nil && *id != "" {
		log.Debugf("[getRuntimeCarbonPassportAuditRecordsResolver]Id %q", *id)
		vAuditRecord, err := nc.RootRoot().Runtime().Passports(getParentName(obj.ParentLabels, "carbonpassports.runtime.saurient.io")).GetAuditRecords(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getRuntimeCarbonPassportAuditRecordsResolver]Error getting AuditRecords node %q : %s", *id, err)
            return vRuntimeAuditRecordList, nil
        }
		dn := vAuditRecord.DisplayName()
parentLabels := map[string]interface{}{"auditrecords.runtime.saurient.io":dn}
vActionType := string(vAuditRecord.Spec.ActionType)
vPreviousHash := string(vAuditRecord.Spec.PreviousHash)
vCurrentHash := string(vAuditRecord.Spec.CurrentHash)
vTimestamp := string(vAuditRecord.Spec.Timestamp)
vUserRef := string(vAuditRecord.Spec.UserRef)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeAuditRecord {
	Id: &dn,
	ParentLabels: parentLabels,
	ActionType: &vActionType,
	PreviousHash: &vPreviousHash,
	CurrentHash: &vCurrentHash,
	Timestamp: &vTimestamp,
	UserRef: &vUserRef,
	}
		vRuntimeAuditRecordList = append(vRuntimeAuditRecordList, ret)

		log.Debugf("[getRuntimeCarbonPassportAuditRecordsResolver]Output AuditRecords objects %v", vRuntimeAuditRecordList)

		return vRuntimeAuditRecordList, nil
	}

	log.Debug("[getRuntimeCarbonPassportAuditRecordsResolver]Id is empty, process all AuditRecordss")

	vAuditRecordParent, err := nc.RootRoot().Runtime().GetPassports(context.TODO(), getParentName(obj.ParentLabels, "carbonpassports.runtime.saurient.io"))
	if err != nil {
	    log.Errorf("[getRuntimeCarbonPassportAuditRecordsResolver]Error getting parent node %s", err)
        return vRuntimeAuditRecordList, nil
    }
	vAuditRecordAllObj, err := vAuditRecordParent.GetAllAuditRecords(context.TODO())
	if err != nil {
	    log.Errorf("[getRuntimeCarbonPassportAuditRecordsResolver]Error getting AuditRecords objects %s", err)
        return vRuntimeAuditRecordList, nil
    }
	for _, i := range vAuditRecordAllObj {
		vAuditRecord, err := nc.RootRoot().Runtime().Passports(getParentName(obj.ParentLabels, "carbonpassports.runtime.saurient.io")).GetAuditRecords(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getRuntimeCarbonPassportAuditRecordsResolver]Error getting AuditRecords node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vAuditRecord.DisplayName()
parentLabels := map[string]interface{}{"auditrecords.runtime.saurient.io":dn}
vActionType := string(vAuditRecord.Spec.ActionType)
vPreviousHash := string(vAuditRecord.Spec.PreviousHash)
vCurrentHash := string(vAuditRecord.Spec.CurrentHash)
vTimestamp := string(vAuditRecord.Spec.Timestamp)
vUserRef := string(vAuditRecord.Spec.UserRef)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.RuntimeAuditRecord {
	Id: &dn,
	ParentLabels: parentLabels,
	ActionType: &vActionType,
	PreviousHash: &vPreviousHash,
	CurrentHash: &vCurrentHash,
	Timestamp: &vTimestamp,
	UserRef: &vUserRef,
	}
		vRuntimeAuditRecordList = append(vRuntimeAuditRecordList, ret)
	}

	log.Debugf("[getRuntimeCarbonPassportAuditRecordsResolver]Output AuditRecords objects %v", vRuntimeAuditRecordList)

	return vRuntimeAuditRecordList, nil
}

