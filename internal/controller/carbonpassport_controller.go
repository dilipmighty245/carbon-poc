package controller

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	saurientv1alpha1 "saurient-platform/api/v1alpha1"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/repository"
	"saurient-platform/internal/tenant"
)

type CarbonPassportReconciler struct {
	client.Client
	Scheme     *runtime.Scheme
	CELEngine  *engine.CELEngine
	PostgresRepo *repository.PostgresRepository
	RedisRepo    *repository.RedisRepository
}

func (r *CarbonPassportReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	// Fetch CarbonPassport CR
	var passport saurientv1alpha1.CarbonPassport
	if err := r.Get(ctx, req.NamespacedName, &passport); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	const passportFinalizer = "saurient.io/passport-finalizer"

	// Cleanup database and Redis if CarbonPassport CR is being deleted
	if !passport.DeletionTimestamp.IsZero() {
		if controllerutil.ContainsFinalizer(&passport, passportFinalizer) {
			logger.Info("Cleaning up database and cache for deleted CarbonPassport CR", "name", passport.Name, "batchID", passport.Spec.BatchID)
			tenantCtx := tenant.WithTenant(ctx, passport.Spec.TenantID)
			if r.PostgresRepo != nil {
				if passport.Status.PassportID != "" {
					_ = r.PostgresRepo.DeletePassportByPassportID(tenantCtx, passport.Status.PassportID)
				}
				if passport.Spec.BatchID != "" {
					_ = r.PostgresRepo.DeletePassportByBatchNumber(tenantCtx, passport.Spec.BatchID)
				}
			}
			if r.RedisRepo != nil {
				if passport.Status.PassportID != "" {
					_ = r.RedisRepo.DeletePassport(ctx, fmt.Sprintf("%s:%s", passport.Spec.TenantID, passport.Status.PassportID))
				}
				if passport.Spec.BatchID != "" {
					_ = r.RedisRepo.DeletePassport(ctx, fmt.Sprintf("%s:%s", passport.Spec.TenantID, passport.Spec.BatchID))
				}
			}

			controllerutil.RemoveFinalizer(&passport, passportFinalizer)
			if err := r.Update(ctx, &passport); err != nil {
				return ctrl.Result{}, err
			}
		}
		return ctrl.Result{}, nil
	}

	// Ensure finalizer is present
	if !controllerutil.ContainsFinalizer(&passport, passportFinalizer) {
		controllerutil.AddFinalizer(&passport, passportFinalizer)
		if err := r.Update(ctx, &passport); err != nil {
			return ctrl.Result{}, err
		}
	}

	// Evaluate CEL calculation early to check if update is required
	tenantCtx := tenant.WithTenant(ctx, passport.Spec.TenantID)

	// Unmarshal calculation details JSON (activity snapshot stored in Spec)
	var activityData map[string]interface{}
	if passport.Spec.CalculationDetails != "" {
		if err := json.Unmarshal([]byte(passport.Spec.CalculationDetails), &activityData); err != nil {
			logger.Error(err, "Failed to unmarshal calculationDetails JSON", "name", passport.Name)
			return ctrl.Result{}, fmt.Errorf("invalid calculationDetails JSON: %w", err)
		}
	}
	if activityData == nil {
		activityData = map[string]interface{}{}
	}

	// Look up Rulebook CR in the same namespace
	var rulebookList saurientv1alpha1.CalculationRulebookList
	rulebook := engine.CalculationRulebook{
		CommodityType: passport.Spec.CommodityType,
	}

	foundRulebook := false
	if err := r.List(ctx, &rulebookList, client.InNamespace(passport.Namespace)); err == nil {
		for _, item := range rulebookList.Items {
			if item.Spec.CommodityType == passport.Spec.CommodityType {
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

	// Fallback rulebooks if no custom rulebook CR was found
	if !foundRulebook {
		if passport.Spec.CommodityType == "Cement" {
			rulebook.Scope1Formula = "(fuel_liters * fuel_ef) + (limestone_tons * calcination_ef)"
			rulebook.Scope2Formula = "(electricity_kwh * grid_ef) - (renewable_ppa_kwh * ppa_offset_ef)"
			rulebook.Scope3Formula = "(raw_material_kg * material_ef) + (freight_ton_km * transport_ef)"
			rulebook.FunctionalUnit = "kg CO2e per metric ton"
			rulebook.BatchQuantity = 100.0
		} else if passport.Spec.CommodityType == "Cocoa" || passport.Spec.CommodityType == "Cocoa Beans / Cocoa Butter" {
			rulebook.Scope1Formula = "fuel_consumed_liters * 2.68"
			rulebook.Scope2Formula = "electricity_consumed_kwh * 0.45"
			rulebook.Scope3Formula = "(raw_material_kg * 0.175) + (packaging_qty * 1.875) + (transport_km * 0.12)"
			rulebook.FunctionalUnit = "kg CO2e per kg"
			rulebook.BatchQuantity = 1000.0
		} else {
			// Generic robust fallback for any commodity
			rulebook.Scope1Formula = "scope_1_kg_co2e"
			rulebook.Scope2Formula = "scope_2_kg_co2e"
			rulebook.Scope3Formula = "scope_3_kg_co2e"
			rulebook.FunctionalUnit = "kg CO2e per unit"
			rulebook.BatchQuantity = 1.0
		}
	}

	// Execute CEL calculation
	result, err := r.CELEngine.Evaluate(tenantCtx, rulebook, activityData)
	if err != nil {
		logger.Error(err, "CEL engine evaluation failed", "name", passport.Name)
		passport.Status.Phase = "Failed"
		_ = r.Status().Update(ctx, &passport)
		return ctrl.Result{}, fmt.Errorf("CEL calculation error: %w", err)
	}

	// Skip reconciliation if already processed and data hash has not changed
	if (passport.Status.Phase == "Calculated" || passport.Status.Phase == "Verified") && passport.Spec.DataHash == result.DataHash {
		return ctrl.Result{}, nil
	}

	logger.Info("Reconciling CarbonPassport CR", "name", passport.Name, "namespace", passport.Namespace, "tenantID", passport.Spec.TenantID, "existingPassportID", passport.Status.PassportID)

	// Prepare Postgres models
	calcDetailsJSON, _ := json.Marshal(result.VariableSnapshot)
	passportModel := &repository.CarbonPassportModel{
		PassportID:         passport.Status.PassportID,
		TenantID:           passport.Spec.TenantID,
		FacilityID:         passport.Spec.FacilityID,
		BatchNumber:        passport.Spec.BatchID,
		CommodityType:      passport.Spec.CommodityType,
		VerificationStatus: "Calculated",
		Scope1KgCO2e:       result.Scope1Kg,
		Scope2KgCO2e:       result.Scope2Kg,
		Scope3KgCO2e:       result.Scope3Kg,
		CalculationDetails: calcDetailsJSON,
		DataHash:           result.DataHash,
	}

	actionType := "Calculated"
	if passport.Status.PassportID != "" {
		actionType = "Updated"
	}

	auditModel := &repository.PassportAuditTrailModel{
		PassportID:    passport.Status.PassportID,
		ActionType:    actionType,
		PreviousHash:  passport.Spec.DataHash,
		CurrentHash:   result.DataHash,
		ChangePayload: calcDetailsJSON,
	}

	// Persist to Postgres using RLS transaction wrapper
	if r.PostgresRepo != nil {
		if passport.Status.PassportID == "" {
			// Check if a passport for this batch already exists in Postgres for this tenant to prevent duplicates
			if existing, err := r.PostgresRepo.GetPassportByBatchNumber(tenantCtx, passport.Spec.BatchID); err == nil && existing != nil {
				passportModel.PassportID = existing.PassportID
				auditModel.PassportID = existing.PassportID
				if err := r.PostgresRepo.UpdatePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
					logger.Error(err, "Failed to update existing passport in Postgres database", "name", passport.Name)
					return ctrl.Result{}, fmt.Errorf("postgres update error: %w", err)
				}
			} else {
				passportModel.PassportID = uuid.New().String()
				auditModel.PassportID = passportModel.PassportID
				if err := r.PostgresRepo.SavePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
					logger.Error(err, "Failed to save passport to Postgres database", "name", passport.Name)
					return ctrl.Result{}, fmt.Errorf("postgres persistence error: %w", err)
				}
			}
		} else {
			if err := r.PostgresRepo.UpdatePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
				logger.Error(err, "Failed to update passport in Postgres database", "name", passport.Name)
				return ctrl.Result{}, fmt.Errorf("postgres update error: %w", err)
			}
		}
	} else {
		if passportModel.PassportID == "" {
			passportModel.PassportID = uuid.New().String()
		}
		passportModel.TotalFootprintKg = result.TotalFootprintKg
	}

	// Cache rich digital carbon passport in Redis using tenant-scoped key format
	richResp := repository.BuildRichPassportResponse(passportModel)
	richBytes, _ := json.Marshal(richResp)

	if r.RedisRepo != nil {
		cacheKey := fmt.Sprintf("%s:%s", passport.Spec.TenantID, passportModel.PassportID)
		_ = r.RedisRepo.CachePassport(ctx, cacheKey, richResp, 24*time.Hour)
	}

	if passport.Spec.PassportDataRaw != string(richBytes) {
		passport.Spec.PassportDataRaw = string(richBytes)
		if err := r.Update(ctx, &passport); err != nil {
			logger.Error(err, "Failed to update CarbonPassport spec passportDataRaw", "name", passport.Name)
		}
	}

	// Update CR Status
	passport.Status.Phase = "Calculated"
	passport.Status.PassportID = passportModel.PassportID
	passport.Status.CryptographicHash = result.DataHash
	passport.Status.LastUpdated = metav1.Now()

	if err := r.Status().Update(ctx, &passport); err != nil {
		logger.Error(err, "Failed to update CarbonPassport status", "name", passport.Name)
		return ctrl.Result{}, fmt.Errorf("status update failed: %w", err)
	}

	logger.Info("CarbonPassport reconciliation successful", "passportID", passportModel.PassportID, "totalKg", result.TotalFootprintKg, "hash", result.DataHash)
	return ctrl.Result{}, nil
}

func (r *CarbonPassportReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&saurientv1alpha1.CarbonPassport{}).
		Complete(r)
}
