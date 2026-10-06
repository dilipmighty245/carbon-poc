package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	saurientv1alpha1 "saurient-platform/api/v1alpha1"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/tenant"
)

// ProductReconciler reconciles Product CRs and manages child CarbonPassport CRs.
type ProductReconciler struct {
	client.Client
	Scheme      *runtime.Scheme
	CELEngine   *engine.CELEngine
	NexusEngine *nexus.NexusGraphEngine
}

func (r *ProductReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	if r.NexusEngine == nil {
		r.NexusEngine = nexus.GetNexusEngine()
	}

	var product saurientv1alpha1.Product
	if err := r.Get(ctx, req.NamespacedName, &product); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	const productFinalizer = "saurient.io/product-finalizer"

	if !product.DeletionTimestamp.IsZero() {
		if controllerutil.ContainsFinalizer(&product, productFinalizer) {
			logger.Info("Cleaning up Nexus graph state for deleted Product CR", "name", product.Name, "batchID", product.Spec.BatchID)
			tenantCtx := tenant.WithTenant(ctx, product.Spec.TenantID)
			if product.Status.PassportID != "" {
				_ = r.NexusEngine.DeletePassportByPassportID(tenantCtx, product.Status.PassportID)
				_ = r.NexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", product.Spec.TenantID, product.Status.PassportID))
			}
			if product.Spec.BatchID != "" {
				_ = r.NexusEngine.DeletePassportByBatchNumber(tenantCtx, product.Spec.BatchID)
				_ = r.NexusEngine.DeletePassportCache(ctx, fmt.Sprintf("%s:%s", product.Spec.TenantID, product.Spec.BatchID))
			}

			controllerutil.RemoveFinalizer(&product, productFinalizer)
			if err := r.Update(ctx, &product); err != nil {
				return ctrl.Result{}, err
			}
		}
		return ctrl.Result{}, nil
	}

	if !controllerutil.ContainsFinalizer(&product, productFinalizer) {
		controllerutil.AddFinalizer(&product, productFinalizer)
		if err := r.Update(ctx, &product); err != nil {
			return ctrl.Result{}, err
		}
	}

	tenantCtx := tenant.WithTenant(ctx, product.Spec.TenantID)

	var activityData map[string]interface{}
	if product.Spec.ActivityDataRaw != "" {
		if err := json.Unmarshal([]byte(product.Spec.ActivityDataRaw), &activityData); err != nil {
			logger.Error(err, "Failed to unmarshal Product activityDataRaw JSON", "name", product.Name)
			product.Status.Phase = "Failed"
			_ = r.Status().Update(ctx, &product)
			return ctrl.Result{}, fmt.Errorf("invalid activityDataRaw JSON: %w", err)
		}
	}
	if activityData == nil {
		activityData = map[string]interface{}{}
	}

	var rulebookList saurientv1alpha1.CalculationRulebookList
	rulebook := engine.CalculationRulebook{
		CommodityType: product.Spec.CommodityType,
	}

	foundRulebook := false
	if err := r.List(ctx, &rulebookList, client.InNamespace(product.Namespace)); err == nil {
		for _, item := range rulebookList.Items {
			if item.Spec.CommodityType == product.Spec.CommodityType {
				rulebook.AccountingMode = engine.AccountingMode(item.Spec.AccountingMode)
				for _, rDef := range item.Spec.Rules {
					rulebook.Rules = append(rulebook.Rules, engine.RuleDefinition{
						ID:          rDef.ID,
						Name:        rDef.Name,
						Scope:       engine.RuleScope(rDef.Scope),
						Mode:        engine.AccountingMode(rDef.Mode),
						OutputType:  engine.RuleOutputType(rDef.OutputType),
						Formula:     rDef.Formula,
						Description: rDef.Description,
					})
				}
				rulebook.Scope1Formula = item.Spec.Scope1Formula
				rulebook.Scope2Formula = item.Spec.Scope2Formula
				rulebook.Scope3Formula = item.Spec.Scope3Formula
				rulebook.FunctionalUnit = item.Spec.FunctionalUnit
				rulebook.Version = item.Spec.Version
				if item.Spec.BatchQuantity > 0 {
					rulebook.BatchQuantity = item.Spec.BatchQuantity
				}
				foundRulebook = true
				break
			}
		}
	}

	if !foundRulebook {
		if product.Spec.CommodityType == "Cement" {
			rulebook.Scope1Formula = "(fuel_liters * fuel_ef) + (limestone_tons * calcination_ef)"
			rulebook.Scope2Formula = "(electricity_kwh * grid_ef) - (renewable_ppa_kwh * ppa_offset_ef)"
			rulebook.Scope3Formula = "(raw_material_kg * material_ef) + (freight_ton_km * transport_ef)"
			rulebook.FunctionalUnit = "kg CO2e per metric ton"
			rulebook.BatchQuantity = 100.0
		} else if product.Spec.CommodityType == "Cocoa" || product.Spec.CommodityType == "Cocoa Beans / Cocoa Butter" {
			rulebook.Scope1Formula = "fuel_consumed_liters * 2.68"
			rulebook.Scope2Formula = "electricity_consumed_kwh * 0.45"
			rulebook.Scope3Formula = "(raw_material_kg * 0.175) + (packaging_qty * 1.875) + (transport_km * 0.12)"
			rulebook.FunctionalUnit = "kg CO2e per kg"
			rulebook.BatchQuantity = 1000.0
		} else {
			rulebook.Scope1Formula = "scope_1_kg_co2e"
			rulebook.Scope2Formula = "scope_2_kg_co2e"
			rulebook.Scope3Formula = "scope_3_kg_co2e"
			rulebook.FunctionalUnit = "kg CO2e per unit"
			rulebook.BatchQuantity = 1.0
		}
	}

	result, err := r.CELEngine.Evaluate(tenantCtx, rulebook, activityData)
	if err != nil {
		logger.Error(err, "CEL engine evaluation failed for Product", "name", product.Name)
		product.Status.Phase = "Failed"
		_ = r.Status().Update(ctx, &product)
		return ctrl.Result{}, fmt.Errorf("CEL calculation error: %w", err)
	}

	passportCRName := fmt.Sprintf("passport-%s", product.Name)
	var childPassport saurientv1alpha1.CarbonPassport
	passportExists := true
	if err := r.Get(ctx, types.NamespacedName{Name: passportCRName, Namespace: product.Namespace}, &childPassport); err != nil {
		passportExists = false
	}

	if passportExists && (product.Status.Phase == "Calculated" || product.Status.Phase == "Verified") && product.Status.DataHash == result.DataHash {
		return ctrl.Result{}, nil
	}

	logger.Info("Reconciling Product CR", "name", product.Name, "namespace", product.Namespace, "tenantID", product.Spec.TenantID)

	calcDetailsJSON, _ := json.Marshal(result.VariableSnapshot)
	passportModel := &nexus.CarbonPassportModel{
		PassportID:         product.Status.PassportID,
		TenantID:           product.Spec.TenantID,
		FacilityID:         product.Spec.FacilityID,
		BatchNumber:        product.Spec.BatchID,
		CommodityType:      product.Spec.CommodityType,
		VerificationStatus: "Calculated",
		Scope1KgCO2e:       result.Scope1Kg,
		Scope2KgCO2e:       result.Scope2Kg,
		Scope3KgCO2e:       result.Scope3Kg,
		TotalFootprintKg:   result.TotalFootprintKg,
		CalculationDetails: calcDetailsJSON,
		DataHash:           result.DataHash,
	}

	actionType := "Calculated"
	if product.Status.PassportID != "" {
		actionType = "Updated"
	}

	auditModel := &nexus.PassportAuditTrailModel{
		PassportID:    product.Status.PassportID,
		ActionType:    actionType,
		PreviousHash:  product.Status.DataHash,
		CurrentHash:   result.DataHash,
		ChangePayload: calcDetailsJSON,
	}

	if r.NexusEngine != nil {
		if product.Status.PassportID == "" {
			if existing, err := r.NexusEngine.GetPassportByBatchNumber(tenantCtx, product.Spec.BatchID); err == nil && existing != nil {
				passportModel.PassportID = existing.PassportID
				auditModel.PassportID = existing.PassportID
				_ = r.NexusEngine.UpdatePassportAndAudit(tenantCtx, passportModel, auditModel)
			} else {
				passportModel.PassportID = uuid.New().String()
				auditModel.PassportID = passportModel.PassportID
				_ = r.NexusEngine.SavePassportAndAudit(tenantCtx, passportModel, auditModel)
			}
		} else {
			_ = r.NexusEngine.UpdatePassportAndAudit(tenantCtx, passportModel, auditModel)
		}
	} else if passportModel.PassportID == "" {
		passportModel.PassportID = uuid.New().String()
		auditModel.PassportID = passportModel.PassportID
	}

	richPassportObj := nexus.BuildRichPassportResponse(passportModel)
	richBytes, _ := json.Marshal(richPassportObj)

	if r.NexusEngine != nil {
		cacheKey := fmt.Sprintf("%s:%s", product.Spec.TenantID, passportModel.PassportID)
		_ = r.NexusEngine.CachePassport(ctx, cacheKey, richPassportObj, 24*time.Hour)
	}

	if passportExists {
		childPassport.Spec.TenantID = product.Spec.TenantID
		childPassport.Spec.FacilityID = product.Spec.FacilityID
		childPassport.Spec.BatchID = product.Spec.BatchID
		childPassport.Spec.CommodityType = product.Spec.CommodityType
		childPassport.Spec.Scope1KgCO2e = result.Scope1Kg
		childPassport.Spec.Scope2KgCO2e = result.Scope2Kg
		childPassport.Spec.Scope3KgCO2e = result.Scope3Kg
		childPassport.Spec.TotalFootprintKg = result.TotalFootprintKg
		childPassport.Spec.CalculationDetails = product.Spec.ActivityDataRaw
		childPassport.Spec.DataHash = result.DataHash
		childPassport.Spec.PassportDataRaw = string(richBytes)
		if err := r.Update(ctx, &childPassport); err != nil {
			logger.Error(err, "Failed to update child CarbonPassport CR", "passportName", passportCRName)
		}
	} else {
		childPassport = saurientv1alpha1.CarbonPassport{
			ObjectMeta: metav1.ObjectMeta{
				Name:      passportCRName,
				Namespace: product.Namespace,
			},
			Spec: saurientv1alpha1.CarbonPassportSpec{
				TenantID:           product.Spec.TenantID,
				FacilityID:         product.Spec.FacilityID,
				BatchID:            product.Spec.BatchID,
				CommodityType:      product.Spec.CommodityType,
				Scope1KgCO2e:       result.Scope1Kg,
				Scope2KgCO2e:       result.Scope2Kg,
				Scope3KgCO2e:       result.Scope3Kg,
				TotalFootprintKg:   result.TotalFootprintKg,
				CalculationDetails: product.Spec.ActivityDataRaw,
				DataHash:           result.DataHash,
				PassportDataRaw:    string(richBytes),
			},
		}
		if err := controllerutil.SetControllerReference(&product, &childPassport, r.Scheme); err != nil {
			logger.Error(err, "Failed to set controller reference on CarbonPassport CR", "passportName", passportCRName)
		} else {
			if err := r.Create(ctx, &childPassport); err != nil {
				logger.Error(err, "Failed to create child CarbonPassport CR", "passportName", passportCRName)
			} else {
				logger.Info("Auto-created child CarbonPassport CR for Product", "passportName", passportCRName)
			}
		}
	}

	product.Status.Phase = "Calculated"
	product.Status.PassportID = passportModel.PassportID
	product.Status.PassportRef = saurientv1alpha1.LocalObjectReference{
		Name:      passportCRName,
		Namespace: product.Namespace,
	}
	product.Status.DataHash = result.DataHash
	product.Status.TotalFootprintKg = result.TotalFootprintKg
	product.Status.LastUpdated = metav1.Now()

	if err := r.Status().Update(ctx, &product); err != nil {
		logger.Error(err, "Failed to update Product status", "name", product.Name)
		return ctrl.Result{}, fmt.Errorf("status update failed: %w", err)
	}

	logger.Info("Product reconciliation successful", "product", product.Name, "passportID", passportModel.PassportID, "totalKg", result.TotalFootprintKg)
	return ctrl.Result{}, nil
}

func (r *ProductReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&saurientv1alpha1.Product{}).
		Owns(&saurientv1alpha1.CarbonPassport{}).
		Complete(r)
}
