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
	"sigs.k8s.io/controller-runtime/pkg/log"

	saurientv1alpha1 "saurient-platform/api/v1alpha1"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/repository"
	"saurient-platform/internal/tenant"
)

// ProductReconciler reconciles Product CRs and manages child CarbonPassport CRs.
type ProductReconciler struct {
	client.Client
	Scheme       *runtime.Scheme
	CELEngine    *engine.CELEngine
	PostgresRepo *repository.PostgresRepository
	RedisRepo    *repository.RedisRepository
}

func (r *ProductReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	// Step a: Fetch Product CR; ignore if not found.
	var product saurientv1alpha1.Product
	if err := r.Get(ctx, req.NamespacedName, &product); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// Step b: Parse ActivityDataRaw JSON.
	var activityData map[string]interface{}
	if product.Spec.ActivityDataRaw != "" {
		if err := json.Unmarshal([]byte(product.Spec.ActivityDataRaw), &activityData); err != nil {
			logger.Error(err, "Failed to parse ActivityDataRaw JSON", "name", product.Name)
			product.Status.Phase = "Failed"
			_ = r.Status().Update(ctx, &product)
			return ctrl.Result{}, fmt.Errorf("invalid ActivityDataRaw JSON: %w", err)
		}
	}
	if activityData == nil {
		activityData = map[string]interface{}{}
	}

	// Step c: Resolve CalculationRulebook CR.
	rulebook := r.resolveRulebook(ctx, &product)

	// Skip re-reconciliation if already Calculated and data hash unchanged.
	if product.Status.Phase == "Calculated" && product.Status.DataHash != "" {
		// We would need to evaluate first to know the new hash — proceed always on
		// Pending/Failed; for Calculated we let it run (idempotency is handled after eval).
	}

	// Step d: Evaluate formulas via CELEngine.
	tenantCtx := tenant.WithTenant(ctx, product.Spec.TenantID)
	result, err := r.CELEngine.Evaluate(tenantCtx, rulebook, activityData)
	if err != nil {
		logger.Error(err, "CEL engine evaluation failed", "name", product.Name)
		product.Status.Phase = "Failed"
		_ = r.Status().Update(ctx, &product)
		return ctrl.Result{}, fmt.Errorf("CEL calculation error: %w", err)
	}

	// Idempotency: if already Calculated with the same hash, skip.
	if product.Status.Phase == "Calculated" && product.Status.DataHash == result.DataHash {
		return ctrl.Result{}, nil
	}

	logger.Info("Reconciling Product CR", "name", product.Name, "namespace", product.Namespace, "tenantID", product.Spec.TenantID)

	// Step e: Check if child CarbonPassport CR already exists; create if missing.
	passportName := fmt.Sprintf("%s-passport", product.Name)
	var passportCR saurientv1alpha1.CarbonPassport

	// Combine activityData and CEL variable snapshot for full transparency
	calcDetailsMap := make(map[string]interface{})
	for k, v := range activityData {
		calcDetailsMap[k] = v
	}
	for k, v := range result.VariableSnapshot {
		if _, exists := calcDetailsMap[k]; !exists {
			calcDetailsMap[k] = v
		}
	}
	if len(result.RuleResults) > 0 {
		calcDetailsMap["rule_results"] = result.RuleResults
	}
	calcDetailsJSON, _ := json.Marshal(calcDetailsMap)

	// Step f: Prepare passportModel & resolve PassportID early so that PassportID is consistent across
	// Postgres, Redis, CR status, and spec.passportDataRaw.
	passportModel := &repository.CarbonPassportModel{
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

	existing := r.Get(ctx, types.NamespacedName{Name: passportName, Namespace: product.Namespace}, &passportCR)

	actionType := "Calculated"
	if product.Status.PassportRef.Name != "" && passportCR.Status.PassportID != "" {
		actionType = "Updated"
		passportModel.PassportID = passportCR.Status.PassportID
	}

	auditModel := &repository.PassportAuditTrailModel{
		ActionType:    actionType,
		PreviousHash:  product.Status.DataHash,
		CurrentHash:   result.DataHash,
		ChangePayload: calcDetailsJSON,
	}

	if r.PostgresRepo != nil {
		if passportModel.PassportID == "" {
			passportModel.PassportID = uuid.New().String()
			auditModel.PassportID = passportModel.PassportID
			if err := r.PostgresRepo.SavePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
				logger.Error(err, "Failed to save passport to Postgres", "name", product.Name)
				return ctrl.Result{}, fmt.Errorf("postgres persistence error: %w", err)
			}
		} else {
			auditModel.PassportID = passportModel.PassportID
			if err := r.PostgresRepo.UpdatePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
				logger.Error(err, "Failed to update passport in Postgres", "name", product.Name)
				return ctrl.Result{}, fmt.Errorf("postgres update error: %w", err)
			}
		}
	} else {
		if passportModel.PassportID == "" {
			passportModel.PassportID = uuid.New().String()
		}
	}

	// Build rich passport payload using the resolved PassportID
	richPassportObj := repository.BuildRichPassportResponse(passportModel)
	richPassportJSON, _ := json.Marshal(richPassportObj)

	if existing != nil && client.IgnoreNotFound(existing) == nil {
		// CarbonPassport does not exist yet — create it.
		passportCR = saurientv1alpha1.CarbonPassport{
			ObjectMeta: metav1.ObjectMeta{
				Name:      passportName,
				Namespace: product.Namespace,
			},
			Spec: saurientv1alpha1.CarbonPassportSpec{
				TenantID:           product.Spec.TenantID,
				FacilityID:         product.Spec.FacilityID,
				BatchID:            product.Spec.BatchID,
				CommodityType:      product.Spec.CommodityType,
				ProductRef:         product.Name,
				Scope1KgCO2e:       result.Scope1Kg,
				Scope2KgCO2e:       result.Scope2Kg,
				Scope3KgCO2e:       result.Scope3Kg,
				TotalFootprintKg:   result.TotalFootprintKg,
				DataHash:           result.DataHash,
				CalculationDetails: string(calcDetailsJSON),
				PassportDataRaw:    string(richPassportJSON),
			},
		}

		if err := ctrl.SetControllerReference(&product, &passportCR, r.Scheme); err != nil {
			logger.Error(err, "Failed to set controller reference on CarbonPassport", "name", passportName)
			return ctrl.Result{}, fmt.Errorf("set controller reference: %w", err)
		}

		if err := r.Create(ctx, &passportCR); err != nil {
			logger.Error(err, "Failed to create child CarbonPassport CR", "name", passportName)
			return ctrl.Result{}, fmt.Errorf("create CarbonPassport: %w", err)
		}
	} else if existing == nil {
		// CarbonPassport exists — update its spec.
		passportCR.Spec.Scope1KgCO2e = result.Scope1Kg
		passportCR.Spec.Scope2KgCO2e = result.Scope2Kg
		passportCR.Spec.Scope3KgCO2e = result.Scope3Kg
		passportCR.Spec.TotalFootprintKg = result.TotalFootprintKg
		passportCR.Spec.DataHash = result.DataHash
		passportCR.Spec.CalculationDetails = string(calcDetailsJSON)
		passportCR.Spec.PassportDataRaw = string(richPassportJSON)
		if err := r.Update(ctx, &passportCR); err != nil {
			logger.Error(err, "Failed to update child CarbonPassport CR", "name", passportName)
			return ctrl.Result{}, fmt.Errorf("update CarbonPassport: %w", err)
		}
	} else {
		return ctrl.Result{}, fmt.Errorf("get CarbonPassport: %w", existing)
	}

	// Step g: Cache in Redis using tenant_id:passport_id key.
	if r.RedisRepo != nil {
		cacheKey := fmt.Sprintf("%s:%s", product.Spec.TenantID, passportModel.PassportID)
		_ = r.RedisRepo.CachePassport(ctx, cacheKey, richPassportObj, 24*time.Hour)
	}

	// Update child CarbonPassport status subresource
	passportCR.Status.PassportID = passportModel.PassportID
	passportCR.Status.Phase = "Calculated"
	passportCR.Status.CryptographicHash = result.DataHash
	passportCR.Status.LastUpdated = metav1.Now()
	if err := r.Status().Update(ctx, &passportCR); err != nil {
		logger.Error(err, "Failed to update CarbonPassport status", "name", passportCR.Name)
	}

	// Step h: Update Product.Status.
	product.Status.Phase = "Calculated"
	product.Status.PassportID = passportModel.PassportID
	product.Status.PassportRef = saurientv1alpha1.LocalObjectReference{
		Name:      passportCR.Name,
		Namespace: passportCR.Namespace,
	}
	product.Status.TotalFootprintKg = result.TotalFootprintKg
	product.Status.DataHash = result.DataHash
	product.Status.LastUpdated = metav1.Now()

	if err := r.Status().Update(ctx, &product); err != nil {
		logger.Error(err, "Failed to update Product status", "name", product.Name)
		return ctrl.Result{}, fmt.Errorf("status update failed: %w", err)
	}

	logger.Info("Product reconciliation successful",
		"passportName", passportCR.Name,
		"totalKg", result.TotalFootprintKg,
		"hash", result.DataHash)
	return ctrl.Result{}, nil
}

func mapCRBRulesToEngine(crbRules []saurientv1alpha1.RuleDefinition) []engine.RuleDefinition {
	var rules []engine.RuleDefinition
	for _, r := range crbRules {
		rules = append(rules, engine.RuleDefinition{
			ID:          r.ID,
			Name:        r.Name,
			Scope:       engine.RuleScope(r.Scope),
			Mode:        engine.AccountingMode(r.Mode),
			OutputType:  engine.RuleOutputType(r.OutputType),
			Formula:     r.Formula,
			Description: r.Description,
		})
	}
	return rules
}

// resolveRulebook returns the engine.CalculationRulebook for this Product.
// It first tries to fetch the CR named in spec.rulebookRef, then falls back
// to commodity-specific hardcoded defaults.
func (r *ProductReconciler) resolveRulebook(ctx context.Context, product *saurientv1alpha1.Product) engine.CalculationRulebook {
	rulebook := engine.CalculationRulebook{
		CommodityType: product.Spec.CommodityType,
	}

	// Try explicit rulebookRef first.
	if product.Spec.RulebookRef.Name != "" {
		ns := product.Spec.RulebookRef.Namespace
		if ns == "" {
			ns = product.Namespace
		}
		var crb saurientv1alpha1.CalculationRulebook
		if err := r.Get(ctx, types.NamespacedName{Name: product.Spec.RulebookRef.Name, Namespace: ns}, &crb); err == nil {
			rulebook.AccountingMode = engine.AccountingMode(crb.Spec.AccountingMode)
			rulebook.Rules = mapCRBRulesToEngine(crb.Spec.Rules)
			rulebook.Scope1Formula = crb.Spec.Scope1Formula
			rulebook.Scope2Formula = crb.Spec.Scope2Formula
			rulebook.Scope3Formula = crb.Spec.Scope3Formula
			rulebook.FunctionalUnit = crb.Spec.FunctionalUnit
			rulebook.Version = crb.Spec.Version
			if crb.Spec.BatchQuantity > 0 {
				rulebook.BatchQuantity = crb.Spec.BatchQuantity
			}
			return rulebook
		}
	}

	// Fallback: scan namespace for a matching CommodityType.
	var rulebookList saurientv1alpha1.CalculationRulebookList
	if err := r.List(ctx, &rulebookList, client.InNamespace(product.Namespace)); err == nil {
		for _, item := range rulebookList.Items {
			if item.Spec.CommodityType == product.Spec.CommodityType {
				rulebook.AccountingMode = engine.AccountingMode(item.Spec.AccountingMode)
				rulebook.Rules = mapCRBRulesToEngine(item.Spec.Rules)
				rulebook.Scope1Formula = item.Spec.Scope1Formula
				rulebook.Scope2Formula = item.Spec.Scope2Formula
				rulebook.Scope3Formula = item.Spec.Scope3Formula
				rulebook.FunctionalUnit = item.Spec.FunctionalUnit
				rulebook.Version = item.Spec.Version
				if item.Spec.BatchQuantity > 0 {
					rulebook.BatchQuantity = item.Spec.BatchQuantity
				}
				return rulebook
			}
		}
	}

	// Hardcoded commodity defaults.
	switch product.Spec.CommodityType {
	case "Cement":
		rulebook.Scope1Formula = "(fuel_liters * fuel_ef) + (limestone_tons * calcination_ef)"
		rulebook.Scope2Formula = "(electricity_kwh * grid_ef) - (renewable_ppa_kwh * ppa_offset_ef)"
		rulebook.Scope3Formula = "(raw_material_kg * material_ef) + (freight_ton_km * transport_ef)"
		rulebook.FunctionalUnit = "kg CO2e per metric ton"
		rulebook.BatchQuantity = 100.0
	case "Cocoa", "Cocoa Beans / Cocoa Butter":
		rulebook.Scope1Formula = "fuel_consumed_liters * 2.68"
		rulebook.Scope2Formula = "electricity_consumed_kwh * 0.45"
		rulebook.Scope3Formula = "(raw_material_kg * 0.175) + (packaging_qty * 1.875) + (transport_km * 0.12)"
		rulebook.FunctionalUnit = "kg CO2e per kg"
		rulebook.BatchQuantity = 1000.0
	default:
		rulebook.Scope1Formula = "scope_1_kg_co2e"
		rulebook.Scope2Formula = "scope_2_kg_co2e"
		rulebook.Scope3Formula = "scope_3_kg_co2e"
		rulebook.FunctionalUnit = "kg CO2e per unit"
		rulebook.BatchQuantity = 1.0
	}
	return rulebook
}

// SetupWithManager registers ProductReconciler with the controller manager.
func (r *ProductReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&saurientv1alpha1.Product{}).
		Owns(&saurientv1alpha1.CarbonPassport{}).
		Complete(r)
}
