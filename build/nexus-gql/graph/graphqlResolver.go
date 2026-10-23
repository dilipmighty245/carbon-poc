package graph

import (
	"context"
	"fmt"
	"os"
	"sync"

	log "github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/flowcontrol"

	qm "github.com/dilipmighty245/graph-framework-for-microservices/nexus/generated/query-manager"
	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/build/nexus-gql/graph/model"
)

var (
	_ = metav1.ListOptions{}
	_ = (*qm.MetricArg)(nil)
)

var c = GrpcClients{
		mtx: sync.Mutex{},
		Clients: map[string]GrpcClient{},
}
var nc *nexus_client.Clientset

// SetNexusClient allows setting the shared nexus clientset
func SetNexusClient(client *nexus_client.Clientset) {
	nc = client
}

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
vProfileRaw := string(vTenant.Spec.ProfileRaw)

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
	ProfileRaw: &vProfileRaw,
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
vProfileRaw := string(vTenant.Spec.ProfileRaw)

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
	ProfileRaw: &vProfileRaw,
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
// FieldName: Processes Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantProcessesResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryProcess, error) {
	log.Debugf("[getInventoryTenantProcessesResolver]Parent Object %+v", obj)
	var vInventoryProcessList []*model.InventoryProcess
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantProcessesResolver]Id %q", *id)
		vProcess, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetProcesses(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantProcessesResolver]Error getting Processes node %q : %s", *id, err)
            return vInventoryProcessList, nil
        }
		dn := vProcess.DisplayName()
parentLabels := map[string]interface{}{"processes.inventory.saurient.io":dn}
vRecordID := string(vProcess.Spec.RecordID)
vTenantID := string(vProcess.Spec.TenantID)
vFacilityID := string(vProcess.Spec.FacilityID)
vFacilityName := string(vProcess.Spec.FacilityName)
vName := string(vProcess.Spec.Name)
vProductionLine := string(vProcess.Spec.ProductionLine)
vEnergySource := string(vProcess.Spec.EnergySource)
vInputs := string(vProcess.Spec.Inputs)
vOutputs := string(vProcess.Spec.Outputs)
vMeters := string(vProcess.Spec.Meters)
vScopes := string(vProcess.Spec.Scopes)
vStatus := string(vProcess.Spec.Status)
vDescription := string(vProcess.Spec.Description)
vPCFTrace := string(vProcess.Spec.PCFTrace)
vCreatedAt := string(vProcess.Spec.CreatedAt)
vUpdatedAt := string(vProcess.Spec.UpdatedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryProcess {
	Id: &dn,
	ParentLabels: parentLabels,
	RecordID: &vRecordID,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	FacilityName: &vFacilityName,
	Name: &vName,
	ProductionLine: &vProductionLine,
	EnergySource: &vEnergySource,
	Inputs: &vInputs,
	Outputs: &vOutputs,
	Meters: &vMeters,
	Scopes: &vScopes,
	Status: &vStatus,
	Description: &vDescription,
	PCFTrace: &vPCFTrace,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryProcessList = append(vInventoryProcessList, ret)

		log.Debugf("[getInventoryTenantProcessesResolver]Output Processes objects %v", vInventoryProcessList)

		return vInventoryProcessList, nil
	}

	log.Debug("[getInventoryTenantProcessesResolver]Id is empty, process all Processess")

	vProcessParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantProcessesResolver]Error getting parent node %s", err)
        return vInventoryProcessList, nil
    }
	vProcessAllObj, err := vProcessParent.GetAllProcesses(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantProcessesResolver]Error getting Processes objects %s", err)
        return vInventoryProcessList, nil
    }
	for _, i := range vProcessAllObj {
		vProcess, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetProcesses(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantProcessesResolver]Error getting Processes node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vProcess.DisplayName()
parentLabels := map[string]interface{}{"processes.inventory.saurient.io":dn}
vRecordID := string(vProcess.Spec.RecordID)
vTenantID := string(vProcess.Spec.TenantID)
vFacilityID := string(vProcess.Spec.FacilityID)
vFacilityName := string(vProcess.Spec.FacilityName)
vName := string(vProcess.Spec.Name)
vProductionLine := string(vProcess.Spec.ProductionLine)
vEnergySource := string(vProcess.Spec.EnergySource)
vInputs := string(vProcess.Spec.Inputs)
vOutputs := string(vProcess.Spec.Outputs)
vMeters := string(vProcess.Spec.Meters)
vScopes := string(vProcess.Spec.Scopes)
vStatus := string(vProcess.Spec.Status)
vDescription := string(vProcess.Spec.Description)
vPCFTrace := string(vProcess.Spec.PCFTrace)
vCreatedAt := string(vProcess.Spec.CreatedAt)
vUpdatedAt := string(vProcess.Spec.UpdatedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryProcess {
	Id: &dn,
	ParentLabels: parentLabels,
	RecordID: &vRecordID,
	TenantID: &vTenantID,
	FacilityID: &vFacilityID,
	FacilityName: &vFacilityName,
	Name: &vName,
	ProductionLine: &vProductionLine,
	EnergySource: &vEnergySource,
	Inputs: &vInputs,
	Outputs: &vOutputs,
	Meters: &vMeters,
	Scopes: &vScopes,
	Status: &vStatus,
	Description: &vDescription,
	PCFTrace: &vPCFTrace,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryProcessList = append(vInventoryProcessList, ret)
	}

	log.Debugf("[getInventoryTenantProcessesResolver]Output Processes objects %v", vInventoryProcessList)

	return vInventoryProcessList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: ReportingPeriods Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantReportingPeriodsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryReportingPeriod, error) {
	log.Debugf("[getInventoryTenantReportingPeriodsResolver]Parent Object %+v", obj)
	var vInventoryReportingPeriodList []*model.InventoryReportingPeriod
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantReportingPeriodsResolver]Id %q", *id)
		vReportingPeriod, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetReportingPeriods(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantReportingPeriodsResolver]Error getting ReportingPeriods node %q : %s", *id, err)
            return vInventoryReportingPeriodList, nil
        }
		dn := vReportingPeriod.DisplayName()
parentLabels := map[string]interface{}{"reportingperiods.inventory.saurient.io":dn}
vRecordID := string(vReportingPeriod.Spec.RecordID)
vTenantID := string(vReportingPeriod.Spec.TenantID)
vName := string(vReportingPeriod.Spec.Name)
vYear := int(vReportingPeriod.Spec.Year)
vQuarter := string(vReportingPeriod.Spec.Quarter)
vStartDate := string(vReportingPeriod.Spec.StartDate)
vEndDate := string(vReportingPeriod.Spec.EndDate)
vStatus := string(vReportingPeriod.Spec.Status)
vEmissionsTotal := float64(vReportingPeriod.Spec.EmissionsTotal)
vDataCompleteness := float64(vReportingPeriod.Spec.DataCompleteness)
vVerificationStatus := string(vReportingPeriod.Spec.VerificationStatus)
vCreatedAt := string(vReportingPeriod.Spec.CreatedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryReportingPeriod {
	Id: &dn,
	ParentLabels: parentLabels,
	RecordID: &vRecordID,
	TenantID: &vTenantID,
	Name: &vName,
	Year: &vYear,
	Quarter: &vQuarter,
	StartDate: &vStartDate,
	EndDate: &vEndDate,
	Status: &vStatus,
	EmissionsTotal: &vEmissionsTotal,
	DataCompleteness: &vDataCompleteness,
	VerificationStatus: &vVerificationStatus,
	CreatedAt: &vCreatedAt,
	}
		vInventoryReportingPeriodList = append(vInventoryReportingPeriodList, ret)

		log.Debugf("[getInventoryTenantReportingPeriodsResolver]Output ReportingPeriods objects %v", vInventoryReportingPeriodList)

		return vInventoryReportingPeriodList, nil
	}

	log.Debug("[getInventoryTenantReportingPeriodsResolver]Id is empty, process all ReportingPeriodss")

	vReportingPeriodParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantReportingPeriodsResolver]Error getting parent node %s", err)
        return vInventoryReportingPeriodList, nil
    }
	vReportingPeriodAllObj, err := vReportingPeriodParent.GetAllReportingPeriods(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantReportingPeriodsResolver]Error getting ReportingPeriods objects %s", err)
        return vInventoryReportingPeriodList, nil
    }
	for _, i := range vReportingPeriodAllObj {
		vReportingPeriod, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetReportingPeriods(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantReportingPeriodsResolver]Error getting ReportingPeriods node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vReportingPeriod.DisplayName()
parentLabels := map[string]interface{}{"reportingperiods.inventory.saurient.io":dn}
vRecordID := string(vReportingPeriod.Spec.RecordID)
vTenantID := string(vReportingPeriod.Spec.TenantID)
vName := string(vReportingPeriod.Spec.Name)
vYear := int(vReportingPeriod.Spec.Year)
vQuarter := string(vReportingPeriod.Spec.Quarter)
vStartDate := string(vReportingPeriod.Spec.StartDate)
vEndDate := string(vReportingPeriod.Spec.EndDate)
vStatus := string(vReportingPeriod.Spec.Status)
vEmissionsTotal := float64(vReportingPeriod.Spec.EmissionsTotal)
vDataCompleteness := float64(vReportingPeriod.Spec.DataCompleteness)
vVerificationStatus := string(vReportingPeriod.Spec.VerificationStatus)
vCreatedAt := string(vReportingPeriod.Spec.CreatedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryReportingPeriod {
	Id: &dn,
	ParentLabels: parentLabels,
	RecordID: &vRecordID,
	TenantID: &vTenantID,
	Name: &vName,
	Year: &vYear,
	Quarter: &vQuarter,
	StartDate: &vStartDate,
	EndDate: &vEndDate,
	Status: &vStatus,
	EmissionsTotal: &vEmissionsTotal,
	DataCompleteness: &vDataCompleteness,
	VerificationStatus: &vVerificationStatus,
	CreatedAt: &vCreatedAt,
	}
		vInventoryReportingPeriodList = append(vInventoryReportingPeriodList, ret)
	}

	log.Debugf("[getInventoryTenantReportingPeriodsResolver]Output ReportingPeriods objects %v", vInventoryReportingPeriodList)

	return vInventoryReportingPeriodList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Localisation Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantLocalisationResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryLocalisation, error) {
	log.Debugf("[getInventoryTenantLocalisationResolver]Parent Object %+v", obj)
	var vInventoryLocalisationList []*model.InventoryLocalisation
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantLocalisationResolver]Id %q", *id)
		vLocalisation, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetLocalisation(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantLocalisationResolver]Error getting Localisation node %q : %s", *id, err)
            return vInventoryLocalisationList, nil
        }
		dn := vLocalisation.DisplayName()
parentLabels := map[string]interface{}{"localisations.inventory.saurient.io":dn}
vTenantID := string(vLocalisation.Spec.TenantID)
vCountry := string(vLocalisation.Spec.Country)
vCurrency := string(vLocalisation.Spec.Currency)
vTimezone := string(vLocalisation.Spec.Timezone)
vLanguage := string(vLocalisation.Spec.Language)
vUnits := string(vLocalisation.Spec.Units)
vRegulatory := string(vLocalisation.Spec.Regulatory)
vDefaultLanguage := string(vLocalisation.Spec.DefaultLanguage)
vDefaultCurrency := string(vLocalisation.Spec.DefaultCurrency)
vDefaultTimezone := string(vLocalisation.Spec.DefaultTimezone)
vDefaultEmissionUnit := string(vLocalisation.Spec.DefaultEmissionUnit)
vNumberFormat := string(vLocalisation.Spec.NumberFormat)
vDateFormat := string(vLocalisation.Spec.DateFormat)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryLocalisation {
	Id: &dn,
	ParentLabels: parentLabels,
	TenantID: &vTenantID,
	Country: &vCountry,
	Currency: &vCurrency,
	Timezone: &vTimezone,
	Language: &vLanguage,
	Units: &vUnits,
	Regulatory: &vRegulatory,
	DefaultLanguage: &vDefaultLanguage,
	DefaultCurrency: &vDefaultCurrency,
	DefaultTimezone: &vDefaultTimezone,
	DefaultEmissionUnit: &vDefaultEmissionUnit,
	NumberFormat: &vNumberFormat,
	DateFormat: &vDateFormat,
	}
		vInventoryLocalisationList = append(vInventoryLocalisationList, ret)

		log.Debugf("[getInventoryTenantLocalisationResolver]Output Localisation objects %v", vInventoryLocalisationList)

		return vInventoryLocalisationList, nil
	}

	log.Debug("[getInventoryTenantLocalisationResolver]Id is empty, process all Localisations")

	vLocalisationParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantLocalisationResolver]Error getting parent node %s", err)
        return vInventoryLocalisationList, nil
    }
	vLocalisationAllObj, err := vLocalisationParent.GetAllLocalisation(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantLocalisationResolver]Error getting Localisation objects %s", err)
        return vInventoryLocalisationList, nil
    }
	for _, i := range vLocalisationAllObj {
		vLocalisation, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetLocalisation(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantLocalisationResolver]Error getting Localisation node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vLocalisation.DisplayName()
parentLabels := map[string]interface{}{"localisations.inventory.saurient.io":dn}
vTenantID := string(vLocalisation.Spec.TenantID)
vCountry := string(vLocalisation.Spec.Country)
vCurrency := string(vLocalisation.Spec.Currency)
vTimezone := string(vLocalisation.Spec.Timezone)
vLanguage := string(vLocalisation.Spec.Language)
vUnits := string(vLocalisation.Spec.Units)
vRegulatory := string(vLocalisation.Spec.Regulatory)
vDefaultLanguage := string(vLocalisation.Spec.DefaultLanguage)
vDefaultCurrency := string(vLocalisation.Spec.DefaultCurrency)
vDefaultTimezone := string(vLocalisation.Spec.DefaultTimezone)
vDefaultEmissionUnit := string(vLocalisation.Spec.DefaultEmissionUnit)
vNumberFormat := string(vLocalisation.Spec.NumberFormat)
vDateFormat := string(vLocalisation.Spec.DateFormat)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryLocalisation {
	Id: &dn,
	ParentLabels: parentLabels,
	TenantID: &vTenantID,
	Country: &vCountry,
	Currency: &vCurrency,
	Timezone: &vTimezone,
	Language: &vLanguage,
	Units: &vUnits,
	Regulatory: &vRegulatory,
	DefaultLanguage: &vDefaultLanguage,
	DefaultCurrency: &vDefaultCurrency,
	DefaultTimezone: &vDefaultTimezone,
	DefaultEmissionUnit: &vDefaultEmissionUnit,
	NumberFormat: &vNumberFormat,
	DateFormat: &vDateFormat,
	}
		vInventoryLocalisationList = append(vInventoryLocalisationList, ret)
	}

	log.Debugf("[getInventoryTenantLocalisationResolver]Output Localisation objects %v", vInventoryLocalisationList)

	return vInventoryLocalisationList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Approvals Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantApprovalsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryApproval, error) {
	log.Debugf("[getInventoryTenantApprovalsResolver]Parent Object %+v", obj)
	var vInventoryApprovalList []*model.InventoryApproval
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantApprovalsResolver]Id %q", *id)
		vApproval, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetApprovals(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantApprovalsResolver]Error getting Approvals node %q : %s", *id, err)
            return vInventoryApprovalList, nil
        }
		dn := vApproval.DisplayName()
parentLabels := map[string]interface{}{"approvals.inventory.saurient.io":dn}
vRecordID := string(vApproval.Spec.RecordID)
vTenantID := string(vApproval.Spec.TenantID)
vPassportID := string(vApproval.Spec.PassportID)
vBatchNumber := string(vApproval.Spec.BatchNumber)
vRequestedBy := string(vApproval.Spec.RequestedBy)
vRole := string(vApproval.Spec.Role)
vStatus := string(vApproval.Spec.Status)
vApproverComment := string(vApproval.Spec.ApproverComment)
vSubmittedAt := string(vApproval.Spec.SubmittedAt)
vResolvedAt := string(vApproval.Spec.ResolvedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryApproval {
	Id: &dn,
	ParentLabels: parentLabels,
	RecordID: &vRecordID,
	TenantID: &vTenantID,
	PassportID: &vPassportID,
	BatchNumber: &vBatchNumber,
	RequestedBy: &vRequestedBy,
	Role: &vRole,
	Status: &vStatus,
	ApproverComment: &vApproverComment,
	SubmittedAt: &vSubmittedAt,
	ResolvedAt: &vResolvedAt,
	}
		vInventoryApprovalList = append(vInventoryApprovalList, ret)

		log.Debugf("[getInventoryTenantApprovalsResolver]Output Approvals objects %v", vInventoryApprovalList)

		return vInventoryApprovalList, nil
	}

	log.Debug("[getInventoryTenantApprovalsResolver]Id is empty, process all Approvalss")

	vApprovalParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantApprovalsResolver]Error getting parent node %s", err)
        return vInventoryApprovalList, nil
    }
	vApprovalAllObj, err := vApprovalParent.GetAllApprovals(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantApprovalsResolver]Error getting Approvals objects %s", err)
        return vInventoryApprovalList, nil
    }
	for _, i := range vApprovalAllObj {
		vApproval, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetApprovals(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantApprovalsResolver]Error getting Approvals node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vApproval.DisplayName()
parentLabels := map[string]interface{}{"approvals.inventory.saurient.io":dn}
vRecordID := string(vApproval.Spec.RecordID)
vTenantID := string(vApproval.Spec.TenantID)
vPassportID := string(vApproval.Spec.PassportID)
vBatchNumber := string(vApproval.Spec.BatchNumber)
vRequestedBy := string(vApproval.Spec.RequestedBy)
vRole := string(vApproval.Spec.Role)
vStatus := string(vApproval.Spec.Status)
vApproverComment := string(vApproval.Spec.ApproverComment)
vSubmittedAt := string(vApproval.Spec.SubmittedAt)
vResolvedAt := string(vApproval.Spec.ResolvedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryApproval {
	Id: &dn,
	ParentLabels: parentLabels,
	RecordID: &vRecordID,
	TenantID: &vTenantID,
	PassportID: &vPassportID,
	BatchNumber: &vBatchNumber,
	RequestedBy: &vRequestedBy,
	Role: &vRole,
	Status: &vStatus,
	ApproverComment: &vApproverComment,
	SubmittedAt: &vSubmittedAt,
	ResolvedAt: &vResolvedAt,
	}
		vInventoryApprovalList = append(vInventoryApprovalList, ret)
	}

	log.Debugf("[getInventoryTenantApprovalsResolver]Output Approvals objects %v", vInventoryApprovalList)

	return vInventoryApprovalList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: VerificationAgencies Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantVerificationAgenciesResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryVerificationAgency, error) {
	log.Debugf("[getInventoryTenantVerificationAgenciesResolver]Parent Object %+v", obj)
	var vInventoryVerificationAgencyList []*model.InventoryVerificationAgency
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantVerificationAgenciesResolver]Id %q", *id)
		vVerificationAgency, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetVerificationAgencies(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantVerificationAgenciesResolver]Error getting VerificationAgencies node %q : %s", *id, err)
            return vInventoryVerificationAgencyList, nil
        }
		dn := vVerificationAgency.DisplayName()
parentLabels := map[string]interface{}{"verificationagencies.inventory.saurient.io":dn}
vAgencyID := string(vVerificationAgency.Spec.AgencyID)
vTenantID := string(vVerificationAgency.Spec.TenantID)
vName := string(vVerificationAgency.Spec.Name)
vAccreditationNumber := string(vVerificationAgency.Spec.AccreditationNumber)
vAccreditationBody := string(vVerificationAgency.Spec.AccreditationBody)
vAccreditationStatus := string(vVerificationAgency.Spec.AccreditationStatus)
vAccreditationExpiry := string(vVerificationAgency.Spec.AccreditationExpiry)
vScopes := string(vVerificationAgency.Spec.Scopes)
vValidFrom := string(vVerificationAgency.Spec.ValidFrom)
vValidTo := string(vVerificationAgency.Spec.ValidTo)
vContactEmail := string(vVerificationAgency.Spec.ContactEmail)
vContactPhone := string(vVerificationAgency.Spec.ContactPhone)
vLeadAuditor := string(vVerificationAgency.Spec.LeadAuditor)
vCreatedAt := string(vVerificationAgency.Spec.CreatedAt)
vUpdatedAt := string(vVerificationAgency.Spec.UpdatedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryVerificationAgency {
	Id: &dn,
	ParentLabels: parentLabels,
	AgencyID: &vAgencyID,
	TenantID: &vTenantID,
	Name: &vName,
	AccreditationNumber: &vAccreditationNumber,
	AccreditationBody: &vAccreditationBody,
	AccreditationStatus: &vAccreditationStatus,
	AccreditationExpiry: &vAccreditationExpiry,
	Scopes: &vScopes,
	ValidFrom: &vValidFrom,
	ValidTo: &vValidTo,
	ContactEmail: &vContactEmail,
	ContactPhone: &vContactPhone,
	LeadAuditor: &vLeadAuditor,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryVerificationAgencyList = append(vInventoryVerificationAgencyList, ret)

		log.Debugf("[getInventoryTenantVerificationAgenciesResolver]Output VerificationAgencies objects %v", vInventoryVerificationAgencyList)

		return vInventoryVerificationAgencyList, nil
	}

	log.Debug("[getInventoryTenantVerificationAgenciesResolver]Id is empty, process all VerificationAgenciess")

	vVerificationAgencyParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantVerificationAgenciesResolver]Error getting parent node %s", err)
        return vInventoryVerificationAgencyList, nil
    }
	vVerificationAgencyAllObj, err := vVerificationAgencyParent.GetAllVerificationAgencies(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantVerificationAgenciesResolver]Error getting VerificationAgencies objects %s", err)
        return vInventoryVerificationAgencyList, nil
    }
	for _, i := range vVerificationAgencyAllObj {
		vVerificationAgency, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetVerificationAgencies(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantVerificationAgenciesResolver]Error getting VerificationAgencies node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vVerificationAgency.DisplayName()
parentLabels := map[string]interface{}{"verificationagencies.inventory.saurient.io":dn}
vAgencyID := string(vVerificationAgency.Spec.AgencyID)
vTenantID := string(vVerificationAgency.Spec.TenantID)
vName := string(vVerificationAgency.Spec.Name)
vAccreditationNumber := string(vVerificationAgency.Spec.AccreditationNumber)
vAccreditationBody := string(vVerificationAgency.Spec.AccreditationBody)
vAccreditationStatus := string(vVerificationAgency.Spec.AccreditationStatus)
vAccreditationExpiry := string(vVerificationAgency.Spec.AccreditationExpiry)
vScopes := string(vVerificationAgency.Spec.Scopes)
vValidFrom := string(vVerificationAgency.Spec.ValidFrom)
vValidTo := string(vVerificationAgency.Spec.ValidTo)
vContactEmail := string(vVerificationAgency.Spec.ContactEmail)
vContactPhone := string(vVerificationAgency.Spec.ContactPhone)
vLeadAuditor := string(vVerificationAgency.Spec.LeadAuditor)
vCreatedAt := string(vVerificationAgency.Spec.CreatedAt)
vUpdatedAt := string(vVerificationAgency.Spec.UpdatedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryVerificationAgency {
	Id: &dn,
	ParentLabels: parentLabels,
	AgencyID: &vAgencyID,
	TenantID: &vTenantID,
	Name: &vName,
	AccreditationNumber: &vAccreditationNumber,
	AccreditationBody: &vAccreditationBody,
	AccreditationStatus: &vAccreditationStatus,
	AccreditationExpiry: &vAccreditationExpiry,
	Scopes: &vScopes,
	ValidFrom: &vValidFrom,
	ValidTo: &vValidTo,
	ContactEmail: &vContactEmail,
	ContactPhone: &vContactPhone,
	LeadAuditor: &vLeadAuditor,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryVerificationAgencyList = append(vInventoryVerificationAgencyList, ret)
	}

	log.Debugf("[getInventoryTenantVerificationAgenciesResolver]Output VerificationAgencies objects %v", vInventoryVerificationAgencyList)

	return vInventoryVerificationAgencyList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: VerificationEngagements Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantVerificationEngagementsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryVerificationEngagement, error) {
	log.Debugf("[getInventoryTenantVerificationEngagementsResolver]Parent Object %+v", obj)
	var vInventoryVerificationEngagementList []*model.InventoryVerificationEngagement
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantVerificationEngagementsResolver]Id %q", *id)
		vVerificationEngagement, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetVerificationEngagements(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantVerificationEngagementsResolver]Error getting VerificationEngagements node %q : %s", *id, err)
            return vInventoryVerificationEngagementList, nil
        }
		dn := vVerificationEngagement.DisplayName()
parentLabels := map[string]interface{}{"verificationengagements.inventory.saurient.io":dn}
vEngagementID := string(vVerificationEngagement.Spec.EngagementID)
vTenantID := string(vVerificationEngagement.Spec.TenantID)
vAgencyID := string(vVerificationEngagement.Spec.AgencyID)
vPassportID := string(vVerificationEngagement.Spec.PassportID)
vBatchID := string(vVerificationEngagement.Spec.BatchID)
vPeriod := string(vVerificationEngagement.Spec.Period)
vMethodology := string(vVerificationEngagement.Spec.Methodology)
vSnapshotHash := string(vVerificationEngagement.Spec.SnapshotHash)
vStatus := string(vVerificationEngagement.Spec.Status)
vAssignedVerifier := string(vVerificationEngagement.Spec.AssignedVerifier)
vScopeMatch := bool(vVerificationEngagement.Spec.ScopeMatch)
vFindingsCount := int(vVerificationEngagement.Spec.FindingsCount)
vTimeline := string(vVerificationEngagement.Spec.Timeline)
vCreatedAt := string(vVerificationEngagement.Spec.CreatedAt)
vUpdatedAt := string(vVerificationEngagement.Spec.UpdatedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryVerificationEngagement {
	Id: &dn,
	ParentLabels: parentLabels,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	AgencyID: &vAgencyID,
	PassportID: &vPassportID,
	BatchID: &vBatchID,
	Period: &vPeriod,
	Methodology: &vMethodology,
	SnapshotHash: &vSnapshotHash,
	Status: &vStatus,
	AssignedVerifier: &vAssignedVerifier,
	ScopeMatch: &vScopeMatch,
	FindingsCount: &vFindingsCount,
	Timeline: &vTimeline,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryVerificationEngagementList = append(vInventoryVerificationEngagementList, ret)

		log.Debugf("[getInventoryTenantVerificationEngagementsResolver]Output VerificationEngagements objects %v", vInventoryVerificationEngagementList)

		return vInventoryVerificationEngagementList, nil
	}

	log.Debug("[getInventoryTenantVerificationEngagementsResolver]Id is empty, process all VerificationEngagementss")

	vVerificationEngagementParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantVerificationEngagementsResolver]Error getting parent node %s", err)
        return vInventoryVerificationEngagementList, nil
    }
	vVerificationEngagementAllObj, err := vVerificationEngagementParent.GetAllVerificationEngagements(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantVerificationEngagementsResolver]Error getting VerificationEngagements objects %s", err)
        return vInventoryVerificationEngagementList, nil
    }
	for _, i := range vVerificationEngagementAllObj {
		vVerificationEngagement, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetVerificationEngagements(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantVerificationEngagementsResolver]Error getting VerificationEngagements node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vVerificationEngagement.DisplayName()
parentLabels := map[string]interface{}{"verificationengagements.inventory.saurient.io":dn}
vEngagementID := string(vVerificationEngagement.Spec.EngagementID)
vTenantID := string(vVerificationEngagement.Spec.TenantID)
vAgencyID := string(vVerificationEngagement.Spec.AgencyID)
vPassportID := string(vVerificationEngagement.Spec.PassportID)
vBatchID := string(vVerificationEngagement.Spec.BatchID)
vPeriod := string(vVerificationEngagement.Spec.Period)
vMethodology := string(vVerificationEngagement.Spec.Methodology)
vSnapshotHash := string(vVerificationEngagement.Spec.SnapshotHash)
vStatus := string(vVerificationEngagement.Spec.Status)
vAssignedVerifier := string(vVerificationEngagement.Spec.AssignedVerifier)
vScopeMatch := bool(vVerificationEngagement.Spec.ScopeMatch)
vFindingsCount := int(vVerificationEngagement.Spec.FindingsCount)
vTimeline := string(vVerificationEngagement.Spec.Timeline)
vCreatedAt := string(vVerificationEngagement.Spec.CreatedAt)
vUpdatedAt := string(vVerificationEngagement.Spec.UpdatedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryVerificationEngagement {
	Id: &dn,
	ParentLabels: parentLabels,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	AgencyID: &vAgencyID,
	PassportID: &vPassportID,
	BatchID: &vBatchID,
	Period: &vPeriod,
	Methodology: &vMethodology,
	SnapshotHash: &vSnapshotHash,
	Status: &vStatus,
	AssignedVerifier: &vAssignedVerifier,
	ScopeMatch: &vScopeMatch,
	FindingsCount: &vFindingsCount,
	Timeline: &vTimeline,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryVerificationEngagementList = append(vInventoryVerificationEngagementList, ret)
	}

	log.Debugf("[getInventoryTenantVerificationEngagementsResolver]Output VerificationEngagements objects %v", vInventoryVerificationEngagementList)

	return vInventoryVerificationEngagementList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: EngagementTeamMembers Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantEngagementTeamMembersResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryEngagementTeamMember, error) {
	log.Debugf("[getInventoryTenantEngagementTeamMembersResolver]Parent Object %+v", obj)
	var vInventoryEngagementTeamMemberList []*model.InventoryEngagementTeamMember
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantEngagementTeamMembersResolver]Id %q", *id)
		vEngagementTeamMember, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetEngagementTeamMembers(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantEngagementTeamMembersResolver]Error getting EngagementTeamMembers node %q : %s", *id, err)
            return vInventoryEngagementTeamMemberList, nil
        }
		dn := vEngagementTeamMember.DisplayName()
parentLabels := map[string]interface{}{"engagementteammembers.inventory.saurient.io":dn}
vMemberID := string(vEngagementTeamMember.Spec.MemberID)
vEngagementID := string(vEngagementTeamMember.Spec.EngagementID)
vTenantID := string(vEngagementTeamMember.Spec.TenantID)
vName := string(vEngagementTeamMember.Spec.Name)
vRole := string(vEngagementTeamMember.Spec.Role)
vEmail := string(vEngagementTeamMember.Spec.Email)
vAssignedAt := string(vEngagementTeamMember.Spec.AssignedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryEngagementTeamMember {
	Id: &dn,
	ParentLabels: parentLabels,
	MemberID: &vMemberID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	Name: &vName,
	Role: &vRole,
	Email: &vEmail,
	AssignedAt: &vAssignedAt,
	}
		vInventoryEngagementTeamMemberList = append(vInventoryEngagementTeamMemberList, ret)

		log.Debugf("[getInventoryTenantEngagementTeamMembersResolver]Output EngagementTeamMembers objects %v", vInventoryEngagementTeamMemberList)

		return vInventoryEngagementTeamMemberList, nil
	}

	log.Debug("[getInventoryTenantEngagementTeamMembersResolver]Id is empty, process all EngagementTeamMemberss")

	vEngagementTeamMemberParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantEngagementTeamMembersResolver]Error getting parent node %s", err)
        return vInventoryEngagementTeamMemberList, nil
    }
	vEngagementTeamMemberAllObj, err := vEngagementTeamMemberParent.GetAllEngagementTeamMembers(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantEngagementTeamMembersResolver]Error getting EngagementTeamMembers objects %s", err)
        return vInventoryEngagementTeamMemberList, nil
    }
	for _, i := range vEngagementTeamMemberAllObj {
		vEngagementTeamMember, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetEngagementTeamMembers(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantEngagementTeamMembersResolver]Error getting EngagementTeamMembers node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vEngagementTeamMember.DisplayName()
parentLabels := map[string]interface{}{"engagementteammembers.inventory.saurient.io":dn}
vMemberID := string(vEngagementTeamMember.Spec.MemberID)
vEngagementID := string(vEngagementTeamMember.Spec.EngagementID)
vTenantID := string(vEngagementTeamMember.Spec.TenantID)
vName := string(vEngagementTeamMember.Spec.Name)
vRole := string(vEngagementTeamMember.Spec.Role)
vEmail := string(vEngagementTeamMember.Spec.Email)
vAssignedAt := string(vEngagementTeamMember.Spec.AssignedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryEngagementTeamMember {
	Id: &dn,
	ParentLabels: parentLabels,
	MemberID: &vMemberID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	Name: &vName,
	Role: &vRole,
	Email: &vEmail,
	AssignedAt: &vAssignedAt,
	}
		vInventoryEngagementTeamMemberList = append(vInventoryEngagementTeamMemberList, ret)
	}

	log.Debugf("[getInventoryTenantEngagementTeamMembersResolver]Output EngagementTeamMembers objects %v", vInventoryEngagementTeamMemberList)

	return vInventoryEngagementTeamMemberList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: COIDeclarations Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantCOIDeclarationsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryCOIDeclaration, error) {
	log.Debugf("[getInventoryTenantCOIDeclarationsResolver]Parent Object %+v", obj)
	var vInventoryCOIDeclarationList []*model.InventoryCOIDeclaration
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantCOIDeclarationsResolver]Id %q", *id)
		vCOIDeclaration, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetCOIDeclarations(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantCOIDeclarationsResolver]Error getting COIDeclarations node %q : %s", *id, err)
            return vInventoryCOIDeclarationList, nil
        }
		dn := vCOIDeclaration.DisplayName()
parentLabels := map[string]interface{}{"coideclarations.inventory.saurient.io":dn}
vDeclarationID := string(vCOIDeclaration.Spec.DeclarationID)
vEngagementID := string(vCOIDeclaration.Spec.EngagementID)
vTenantID := string(vCOIDeclaration.Spec.TenantID)
vAuditorName := string(vCOIDeclaration.Spec.AuditorName)
vAuditorEmail := string(vCOIDeclaration.Spec.AuditorEmail)
vHasConflict := bool(vCOIDeclaration.Spec.HasConflict)
vExplanation := string(vCOIDeclaration.Spec.Explanation)
vDeclaredAt := string(vCOIDeclaration.Spec.DeclaredAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryCOIDeclaration {
	Id: &dn,
	ParentLabels: parentLabels,
	DeclarationID: &vDeclarationID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	AuditorName: &vAuditorName,
	AuditorEmail: &vAuditorEmail,
	HasConflict: &vHasConflict,
	Explanation: &vExplanation,
	DeclaredAt: &vDeclaredAt,
	}
		vInventoryCOIDeclarationList = append(vInventoryCOIDeclarationList, ret)

		log.Debugf("[getInventoryTenantCOIDeclarationsResolver]Output COIDeclarations objects %v", vInventoryCOIDeclarationList)

		return vInventoryCOIDeclarationList, nil
	}

	log.Debug("[getInventoryTenantCOIDeclarationsResolver]Id is empty, process all COIDeclarationss")

	vCOIDeclarationParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantCOIDeclarationsResolver]Error getting parent node %s", err)
        return vInventoryCOIDeclarationList, nil
    }
	vCOIDeclarationAllObj, err := vCOIDeclarationParent.GetAllCOIDeclarations(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantCOIDeclarationsResolver]Error getting COIDeclarations objects %s", err)
        return vInventoryCOIDeclarationList, nil
    }
	for _, i := range vCOIDeclarationAllObj {
		vCOIDeclaration, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetCOIDeclarations(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantCOIDeclarationsResolver]Error getting COIDeclarations node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vCOIDeclaration.DisplayName()
parentLabels := map[string]interface{}{"coideclarations.inventory.saurient.io":dn}
vDeclarationID := string(vCOIDeclaration.Spec.DeclarationID)
vEngagementID := string(vCOIDeclaration.Spec.EngagementID)
vTenantID := string(vCOIDeclaration.Spec.TenantID)
vAuditorName := string(vCOIDeclaration.Spec.AuditorName)
vAuditorEmail := string(vCOIDeclaration.Spec.AuditorEmail)
vHasConflict := bool(vCOIDeclaration.Spec.HasConflict)
vExplanation := string(vCOIDeclaration.Spec.Explanation)
vDeclaredAt := string(vCOIDeclaration.Spec.DeclaredAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryCOIDeclaration {
	Id: &dn,
	ParentLabels: parentLabels,
	DeclarationID: &vDeclarationID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	AuditorName: &vAuditorName,
	AuditorEmail: &vAuditorEmail,
	HasConflict: &vHasConflict,
	Explanation: &vExplanation,
	DeclaredAt: &vDeclaredAt,
	}
		vInventoryCOIDeclarationList = append(vInventoryCOIDeclarationList, ret)
	}

	log.Debugf("[getInventoryTenantCOIDeclarationsResolver]Output COIDeclarations objects %v", vInventoryCOIDeclarationList)

	return vInventoryCOIDeclarationList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: Findings Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantFindingsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryFinding, error) {
	log.Debugf("[getInventoryTenantFindingsResolver]Parent Object %+v", obj)
	var vInventoryFindingList []*model.InventoryFinding
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantFindingsResolver]Id %q", *id)
		vFinding, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetFindings(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantFindingsResolver]Error getting Findings node %q : %s", *id, err)
            return vInventoryFindingList, nil
        }
		dn := vFinding.DisplayName()
parentLabels := map[string]interface{}{"findings.inventory.saurient.io":dn}
vFindingID := string(vFinding.Spec.FindingID)
vEngagementID := string(vFinding.Spec.EngagementID)
vTenantID := string(vFinding.Spec.TenantID)
vCategory := string(vFinding.Spec.Category)
vSeverity := string(vFinding.Spec.Severity)
vStatus := string(vFinding.Spec.Status)
vDescription := string(vFinding.Spec.Description)
vDiscrepancy := float64(vFinding.Spec.Discrepancy)
vRaisedBy := string(vFinding.Spec.RaisedBy)
vResolvedBy := string(vFinding.Spec.ResolvedBy)
vCreatedAt := string(vFinding.Spec.CreatedAt)
vUpdatedAt := string(vFinding.Spec.UpdatedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryFinding {
	Id: &dn,
	ParentLabels: parentLabels,
	FindingID: &vFindingID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	Category: &vCategory,
	Severity: &vSeverity,
	Status: &vStatus,
	Description: &vDescription,
	Discrepancy: &vDiscrepancy,
	RaisedBy: &vRaisedBy,
	ResolvedBy: &vResolvedBy,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryFindingList = append(vInventoryFindingList, ret)

		log.Debugf("[getInventoryTenantFindingsResolver]Output Findings objects %v", vInventoryFindingList)

		return vInventoryFindingList, nil
	}

	log.Debug("[getInventoryTenantFindingsResolver]Id is empty, process all Findingss")

	vFindingParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantFindingsResolver]Error getting parent node %s", err)
        return vInventoryFindingList, nil
    }
	vFindingAllObj, err := vFindingParent.GetAllFindings(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantFindingsResolver]Error getting Findings objects %s", err)
        return vInventoryFindingList, nil
    }
	for _, i := range vFindingAllObj {
		vFinding, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetFindings(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantFindingsResolver]Error getting Findings node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vFinding.DisplayName()
parentLabels := map[string]interface{}{"findings.inventory.saurient.io":dn}
vFindingID := string(vFinding.Spec.FindingID)
vEngagementID := string(vFinding.Spec.EngagementID)
vTenantID := string(vFinding.Spec.TenantID)
vCategory := string(vFinding.Spec.Category)
vSeverity := string(vFinding.Spec.Severity)
vStatus := string(vFinding.Spec.Status)
vDescription := string(vFinding.Spec.Description)
vDiscrepancy := float64(vFinding.Spec.Discrepancy)
vRaisedBy := string(vFinding.Spec.RaisedBy)
vResolvedBy := string(vFinding.Spec.ResolvedBy)
vCreatedAt := string(vFinding.Spec.CreatedAt)
vUpdatedAt := string(vFinding.Spec.UpdatedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryFinding {
	Id: &dn,
	ParentLabels: parentLabels,
	FindingID: &vFindingID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	Category: &vCategory,
	Severity: &vSeverity,
	Status: &vStatus,
	Description: &vDescription,
	Discrepancy: &vDiscrepancy,
	RaisedBy: &vRaisedBy,
	ResolvedBy: &vResolvedBy,
	CreatedAt: &vCreatedAt,
	UpdatedAt: &vUpdatedAt,
	}
		vInventoryFindingList = append(vInventoryFindingList, ret)
	}

	log.Debugf("[getInventoryTenantFindingsResolver]Output Findings objects %v", vInventoryFindingList)

	return vInventoryFindingList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: ReviewSignoffs Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantReviewSignoffsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryReviewVerdict, error) {
	log.Debugf("[getInventoryTenantReviewSignoffsResolver]Parent Object %+v", obj)
	var vInventoryReviewVerdictList []*model.InventoryReviewVerdict
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantReviewSignoffsResolver]Id %q", *id)
		vReviewVerdict, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetReviewSignoffs(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantReviewSignoffsResolver]Error getting ReviewSignoffs node %q : %s", *id, err)
            return vInventoryReviewVerdictList, nil
        }
		dn := vReviewVerdict.DisplayName()
parentLabels := map[string]interface{}{"reviewverdicts.inventory.saurient.io":dn}
vSignoffID := string(vReviewVerdict.Spec.SignoffID)
vEngagementID := string(vReviewVerdict.Spec.EngagementID)
vTenantID := string(vReviewVerdict.Spec.TenantID)
vPassportID := string(vReviewVerdict.Spec.PassportID)
vLeadAuditor := string(vReviewVerdict.Spec.LeadAuditor)
vPeerReviewer := string(vReviewVerdict.Spec.PeerReviewer)
vOpinion := string(vReviewVerdict.Spec.Opinion)
vStatementRef := string(vReviewVerdict.Spec.StatementRef)
vFrozen := bool(vReviewVerdict.Spec.Frozen)
vSignedAt := string(vReviewVerdict.Spec.SignedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryReviewVerdict {
	Id: &dn,
	ParentLabels: parentLabels,
	SignoffID: &vSignoffID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	PassportID: &vPassportID,
	LeadAuditor: &vLeadAuditor,
	PeerReviewer: &vPeerReviewer,
	Opinion: &vOpinion,
	StatementRef: &vStatementRef,
	Frozen: &vFrozen,
	SignedAt: &vSignedAt,
	}
		vInventoryReviewVerdictList = append(vInventoryReviewVerdictList, ret)

		log.Debugf("[getInventoryTenantReviewSignoffsResolver]Output ReviewSignoffs objects %v", vInventoryReviewVerdictList)

		return vInventoryReviewVerdictList, nil
	}

	log.Debug("[getInventoryTenantReviewSignoffsResolver]Id is empty, process all ReviewSignoffss")

	vReviewVerdictParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantReviewSignoffsResolver]Error getting parent node %s", err)
        return vInventoryReviewVerdictList, nil
    }
	vReviewVerdictAllObj, err := vReviewVerdictParent.GetAllReviewSignoffs(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantReviewSignoffsResolver]Error getting ReviewSignoffs objects %s", err)
        return vInventoryReviewVerdictList, nil
    }
	for _, i := range vReviewVerdictAllObj {
		vReviewVerdict, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetReviewSignoffs(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantReviewSignoffsResolver]Error getting ReviewSignoffs node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vReviewVerdict.DisplayName()
parentLabels := map[string]interface{}{"reviewverdicts.inventory.saurient.io":dn}
vSignoffID := string(vReviewVerdict.Spec.SignoffID)
vEngagementID := string(vReviewVerdict.Spec.EngagementID)
vTenantID := string(vReviewVerdict.Spec.TenantID)
vPassportID := string(vReviewVerdict.Spec.PassportID)
vLeadAuditor := string(vReviewVerdict.Spec.LeadAuditor)
vPeerReviewer := string(vReviewVerdict.Spec.PeerReviewer)
vOpinion := string(vReviewVerdict.Spec.Opinion)
vStatementRef := string(vReviewVerdict.Spec.StatementRef)
vFrozen := bool(vReviewVerdict.Spec.Frozen)
vSignedAt := string(vReviewVerdict.Spec.SignedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryReviewVerdict {
	Id: &dn,
	ParentLabels: parentLabels,
	SignoffID: &vSignoffID,
	EngagementID: &vEngagementID,
	TenantID: &vTenantID,
	PassportID: &vPassportID,
	LeadAuditor: &vLeadAuditor,
	PeerReviewer: &vPeerReviewer,
	Opinion: &vOpinion,
	StatementRef: &vStatementRef,
	Frozen: &vFrozen,
	SignedAt: &vSignedAt,
	}
		vInventoryReviewVerdictList = append(vInventoryReviewVerdictList, ret)
	}

	log.Debugf("[getInventoryTenantReviewSignoffsResolver]Output ReviewSignoffs objects %v", vInventoryReviewVerdictList)

	return vInventoryReviewVerdictList, nil
}

//////////////////////////////////////
// CHILDREN RESOLVER
// FieldName: InputCorrections Node: Tenant PKG: Inventory
//////////////////////////////////////
func getInventoryTenantInputCorrectionsResolver(obj *model.InventoryTenant, id *string) ([]*model.InventoryInputCorrection, error) {
	log.Debugf("[getInventoryTenantInputCorrectionsResolver]Parent Object %+v", obj)
	var vInventoryInputCorrectionList []*model.InventoryInputCorrection
	if id != nil && *id != "" {
		log.Debugf("[getInventoryTenantInputCorrectionsResolver]Id %q", *id)
		vInputCorrection, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetInputCorrections(context.TODO(), *id)
		if err != nil {
			log.Errorf("[getInventoryTenantInputCorrectionsResolver]Error getting InputCorrections node %q : %s", *id, err)
            return vInventoryInputCorrectionList, nil
        }
		dn := vInputCorrection.DisplayName()
parentLabels := map[string]interface{}{"inputcorrections.inventory.saurient.io":dn}
vCorrectionID := string(vInputCorrection.Spec.CorrectionID)
vTenantID := string(vInputCorrection.Spec.TenantID)
vInputNodeID := string(vInputCorrection.Spec.InputNodeID)
vNewValue := float64(vInputCorrection.Spec.NewValue)
vReason := string(vInputCorrection.Spec.Reason)
vResultRaw := string(vInputCorrection.Spec.ResultRaw)
vNodesRaw := string(vInputCorrection.Spec.NodesRaw)
vEdgesRaw := string(vInputCorrection.Spec.EdgesRaw)
vCreatedAt := string(vInputCorrection.Spec.CreatedAt)

        for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryInputCorrection {
	Id: &dn,
	ParentLabels: parentLabels,
	CorrectionID: &vCorrectionID,
	TenantID: &vTenantID,
	InputNodeID: &vInputNodeID,
	NewValue: &vNewValue,
	Reason: &vReason,
	ResultRaw: &vResultRaw,
	NodesRaw: &vNodesRaw,
	EdgesRaw: &vEdgesRaw,
	CreatedAt: &vCreatedAt,
	}
		vInventoryInputCorrectionList = append(vInventoryInputCorrectionList, ret)

		log.Debugf("[getInventoryTenantInputCorrectionsResolver]Output InputCorrections objects %v", vInventoryInputCorrectionList)

		return vInventoryInputCorrectionList, nil
	}

	log.Debug("[getInventoryTenantInputCorrectionsResolver]Id is empty, process all InputCorrectionss")

	vInputCorrectionParent, err := nc.RootRoot().Inventory().GetTenants(context.TODO(), getParentName(obj.ParentLabels, "tenants.inventory.saurient.io"))
	if err != nil {
	    log.Errorf("[getInventoryTenantInputCorrectionsResolver]Error getting parent node %s", err)
        return vInventoryInputCorrectionList, nil
    }
	vInputCorrectionAllObj, err := vInputCorrectionParent.GetAllInputCorrections(context.TODO())
	if err != nil {
	    log.Errorf("[getInventoryTenantInputCorrectionsResolver]Error getting InputCorrections objects %s", err)
        return vInventoryInputCorrectionList, nil
    }
	for _, i := range vInputCorrectionAllObj {
		vInputCorrection, err := nc.RootRoot().Inventory().Tenants(getParentName(obj.ParentLabels, "tenants.inventory.saurient.io")).GetInputCorrections(context.TODO(), i.DisplayName())
		if err != nil {
	        log.Errorf("[getInventoryTenantInputCorrectionsResolver]Error getting InputCorrections node %q : %s", i.DisplayName(), err)
            continue
		}
		dn := vInputCorrection.DisplayName()
parentLabels := map[string]interface{}{"inputcorrections.inventory.saurient.io":dn}
vCorrectionID := string(vInputCorrection.Spec.CorrectionID)
vTenantID := string(vInputCorrection.Spec.TenantID)
vInputNodeID := string(vInputCorrection.Spec.InputNodeID)
vNewValue := float64(vInputCorrection.Spec.NewValue)
vReason := string(vInputCorrection.Spec.Reason)
vResultRaw := string(vInputCorrection.Spec.ResultRaw)
vNodesRaw := string(vInputCorrection.Spec.NodesRaw)
vEdgesRaw := string(vInputCorrection.Spec.EdgesRaw)
vCreatedAt := string(vInputCorrection.Spec.CreatedAt)

		for k, v := range obj.ParentLabels {
            parentLabels[k] = v
        }
		ret := &model.InventoryInputCorrection {
	Id: &dn,
	ParentLabels: parentLabels,
	CorrectionID: &vCorrectionID,
	TenantID: &vTenantID,
	InputNodeID: &vInputNodeID,
	NewValue: &vNewValue,
	Reason: &vReason,
	ResultRaw: &vResultRaw,
	NodesRaw: &vNodesRaw,
	EdgesRaw: &vEdgesRaw,
	CreatedAt: &vCreatedAt,
	}
		vInventoryInputCorrectionList = append(vInventoryInputCorrectionList, ret)
	}

	log.Debugf("[getInventoryTenantInputCorrectionsResolver]Output InputCorrections objects %v", vInventoryInputCorrectionList)

	return vInventoryInputCorrectionList, nil
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

