package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"

	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/tenant"
)

// ProductReconciler manages asynchronous event-driven reconciliation of Product nodes
// in the Nexus graph using pure Nexus Informers, typed callbacks, and a periodic sweep loop.
type ProductReconciler struct {
	client      *nexus_client.Clientset
	engine      *NexusGraphEngine
	celEngine   *engine.CELEngine
	stopCh      chan struct{}
	wg          sync.WaitGroup
	running     bool
	mu          sync.Mutex
	sweepPeriod time.Duration

	inFlightMu sync.Mutex
	inFlight   map[string]bool
}

// NewProductReconciler creates a new ProductReconciler instance bound to the Nexus Graph Engine.
func NewProductReconciler(graphEngine *NexusGraphEngine, celEngine *engine.CELEngine) *ProductReconciler {
	return NewProductReconcilerWithClient(GetNexusClient(), graphEngine, celEngine)
}

// NewProductReconcilerWithClient creates a ProductReconciler with an explicit Nexus Clientset.
func NewProductReconcilerWithClient(client *nexus_client.Clientset, graphEngine *NexusGraphEngine, celEngine *engine.CELEngine) *ProductReconciler {
	if client == nil {
		client = GetNexusClient()
	}
	if graphEngine == nil {
		graphEngine = GetNexusEngine()
	}
	if celEngine == nil {
		celEngine = engine.NewCELEngine()
	}
	return &ProductReconciler{
		client:      client,
		engine:      graphEngine,
		celEngine:   celEngine,
		stopCh:      make(chan struct{}),
		sweepPeriod: 30 * time.Second,
		inFlight:    make(map[string]bool),
	}
}

func (r *ProductReconciler) tryLockProduct(key string) bool {
	r.inFlightMu.Lock()
	defer r.inFlightMu.Unlock()
	if r.inFlight[key] {
		return false
	}
	r.inFlight[key] = true
	return true
}

func (r *ProductReconciler) unlockProduct(key string) {
	r.inFlightMu.Lock()
	defer r.inFlightMu.Unlock()
	delete(r.inFlight, key)
}

// SetSweepPeriod configures the periodic sweep duration (useful for test acceleration).
func (r *ProductReconciler) SetSweepPeriod(d time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.sweepPeriod = d
}

// Start registers pure Nexus Informer callbacks and starts a background sweep loop.
func (r *ProductReconciler) Start(ctx context.Context) {
	r.mu.Lock()
	if r.running {
		r.mu.Unlock()
		return
	}
	r.running = true
	r.stopCh = make(chan struct{})
	r.mu.Unlock()

	// 1. Subscribe and register typed Informer callbacks if client is available
	if r.client != nil {
		func() {
			defer func() {
				if rec := recover(); rec != nil {
					log.Printf("[ProductReconciler] Nexus informer registration deferred or skipped: %v", rec)
				}
			}()

			// Subscribe to graph trees
			r.client.RootRoot().Inventory().Subscribe()
			r.client.RootRoot().Inventory().Tenants("*").Subscribe()
			r.client.RootRoot().Inventory().Tenants("*").Products("*").Subscribe()
			r.client.RootRoot().Runtime().Subscribe()
			r.client.RootRoot().Runtime().Passports("*").Subscribe()

			// Register pure Informer callbacks
			_, _ = r.client.RootRoot().Inventory().Tenants("*").Products("*").RegisterAddCallback(r.ProcessProductAdd)
			_, _ = r.client.RootRoot().Inventory().Tenants("*").Products("*").RegisterUpdateCallback(r.ProcessProductUpdate)
			_, _ = r.client.RootRoot().Inventory().Tenants("*").Products("*").RegisterDeleteCallback(r.ProcessProductDelete)

			log.Println("[ProductReconciler] Pure Nexus Informer callbacks registered (Add, Update, Delete)")
		}()
	}

	// 2. Initial reconciliation pass for existing pending products
	go r.reconcilePendingProducts(ctx)

	// 3. Periodic sweep loop for resilience against transient disconnects or missed events
	r.wg.Add(1)
	go func() {
		defer r.wg.Done()
		sweepInterval := r.sweepPeriod
		if sweepInterval <= 0 {
			sweepInterval = 30 * time.Second
		}
		ticker := time.NewTicker(sweepInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-r.stopCh:
				return
			case <-ticker.C:
				r.reconcilePendingProducts(ctx)
			}
		}
	}()

	log.Println("[ProductReconciler] Pure Nexus Informer Product Reconciler started successfully")
}

// Stop terminates the background reconciler worker and sweep loop.
func (r *ProductReconciler) Stop() {
	r.mu.Lock()
	if !r.running {
		r.mu.Unlock()
		return
	}
	close(r.stopCh)
	r.running = false
	r.mu.Unlock()

	r.wg.Wait()
	log.Println("[ProductReconciler] Nexus Product Reconciler stopped")
}

// ProcessProductAdd handles Informer ADD events on InventoryProduct nodes.
func (r *ProductReconciler) ProcessProductAdd(obj *nexus_client.InventoryProduct) {
	if obj == nil || obj.Product == nil {
		return
	}
	if obj.Spec.Phase == "Pending" || obj.Spec.Phase == "" {
		log.Printf("[ProductReconciler] Informer detected Add for Pending Product node: %s", obj.DisplayName())
		if _, err := r.ReconcileProductNode(context.Background(), obj); err != nil {
			log.Printf("[ProductReconciler] Error reconciling product node %s: %v", obj.DisplayName(), err)
		}
	}
}

// ProcessProductUpdate handles Informer UPDATE events on InventoryProduct nodes.
func (r *ProductReconciler) ProcessProductUpdate(oldObj, newObj *nexus_client.InventoryProduct) {
	if newObj == nil || newObj.Product == nil {
		return
	}
	if newObj.Spec.Phase == "Pending" {
		log.Printf("[ProductReconciler] Informer detected Update for Pending Product node: %s", newObj.DisplayName())
		if _, err := r.ReconcileProductNode(context.Background(), newObj); err != nil {
			log.Printf("[ProductReconciler] Error reconciling product node update %s: %v", newObj.DisplayName(), err)
		}
	}
}

// ProcessProductDelete handles Informer DELETE events on InventoryProduct nodes.
func (r *ProductReconciler) ProcessProductDelete(obj *nexus_client.InventoryProduct) {
	if obj == nil || obj.Product == nil {
		return
	}
	log.Printf("[ProductReconciler] Informer detected Delete for Product node: %s", obj.DisplayName())

	tenantID := obj.Spec.TenantID
	if tenantID == "" && obj.Labels != nil {
		tenantID = obj.Labels["tenants.inventory.saurient.io"]
	}
	if tenantID == "" {
		tenantID = "default"
	}
	tenantCtx := tenant.WithTenant(context.Background(), tenantID)

	if r.client != nil {
		if obj.Spec.PassportID != "" {
			_ = DeletePassportNode(tenantCtx, r.client, obj.Spec.PassportID)
		}
	}

	if r.engine != nil {
		if obj.Spec.PassportID != "" {
			_ = r.engine.DeletePassportByPassportID(tenantCtx, obj.Spec.PassportID)
			_ = r.engine.DeletePassportCache(tenantCtx, fmt.Sprintf("%s:%s", tenantID, obj.Spec.PassportID))
		}
		if obj.Spec.BatchID != "" {
			_ = r.engine.DeletePassportByBatchNumber(tenantCtx, obj.Spec.BatchID)
			_ = r.engine.DeletePassportCache(tenantCtx, fmt.Sprintf("%s:%s", tenantID, obj.Spec.BatchID))
		}
	}
}

// reconcilePendingProducts scans for any Product nodes in "Pending" phase
// and executes their calculation. This guarantees eventual consistency.
func (r *ProductReconciler) reconcilePendingProducts(ctx context.Context) {
	if r.client != nil {
		productNodes, err := ListProductNodes(ctx, r.client, "")
		if err == nil {
			for _, node := range productNodes {
				if node != nil && (node.Spec.Phase == "Pending" || node.Spec.Phase == "") {
					log.Printf("[ProductReconciler] Sweep loop reconciling pending product node: %s (%s)", node.DisplayName(), node.Spec.BatchID)
					if _, err := r.ReconcileProductNode(ctx, node); err != nil {
						log.Printf("[ProductReconciler] Sweep loop error reconciling product node %s: %v", node.DisplayName(), err)
					}
				}
			}
		}
	}
}

// Reconcile handles an individual ProductEvent received from Nexus.
func (r *ProductReconciler) Reconcile(ctx context.Context, evt ProductEvent) error {
	tenantCtx := tenant.WithTenant(ctx, evt.TenantID)

	if evt.Type == ProductEventDeleted {
		if evt.Product != nil && evt.Product.PassportID != "" {
			_ = r.engine.DeletePassportByPassportID(tenantCtx, evt.Product.PassportID)
			_ = r.engine.DeletePassportCache(tenantCtx, fmt.Sprintf("%s:%s", evt.TenantID, evt.Product.PassportID))
		}
		if evt.Product != nil && evt.Product.BatchID != "" {
			_ = r.engine.DeletePassportByBatchNumber(tenantCtx, evt.Product.BatchID)
			_ = r.engine.DeletePassportCache(tenantCtx, fmt.Sprintf("%s:%s", evt.TenantID, evt.Product.BatchID))
		}
		if r.client != nil && evt.ProductID != "" {
			_ = DeleteProductNode(ctx, r.client, evt.TenantID, evt.ProductID)
		}
		return nil
	}

	product := evt.Product
	if product == nil {
		var err error
		product, err = r.engine.GetProduct(tenantCtx, evt.ProductID)
		if err != nil {
			return fmt.Errorf("could not fetch product %s for reconciliation: %w", evt.ProductID, err)
		}
	}

	// Idempotency: skip if already calculated and hash unchanged
	if product.Phase != "Pending" && product.Phase != "" {
		return nil
	}

	_, err := r.ReconcileProduct(ctx, product)
	return err
}

// ReconcileProductNode reconciles a typed Nexus InventoryProduct node, executing CEL calculation,
// creating a child CarbonPassport node under Runtime with soft link to Product, and updating
// the Product node's phase to "Calculated".
func (r *ProductReconciler) ReconcileProductNode(ctx context.Context, prodNode *nexus_client.InventoryProduct) (*CarbonPassportModel, error) {
	if prodNode == nil || prodNode.Product == nil {
		return nil, fmt.Errorf("cannot reconcile nil product node")
	}

	tenantID := prodNode.Spec.TenantID
	if tenantID == "" && prodNode.Labels != nil {
		tenantID = prodNode.Labels["tenants.inventory.saurient.io"]
	}
	if tenantID == "" {
		tenantID = "default"
	}
	tenantCtx := tenant.WithTenant(ctx, tenantID)

	// Deduplication lock: prevent concurrent reconciliation between Informer callback and sweep loop
	lockKey := fmt.Sprintf("%s:%s", tenantID, prodNode.DisplayName())
	if !r.tryLockProduct(lockKey) {
		return nil, nil // Reconciliation already in progress by another worker
	}
	defer r.unlockProduct(lockKey)

	// Idempotency: skip if already calculated with an issued passport
	if prodNode.Spec.Phase == "Calculated" && prodNode.Spec.PassportID != "" {
		if r.client != nil {
			if pNode, err := GetPassportNode(ctx, r.client, prodNode.Spec.PassportID); err == nil && pNode != nil {
				return CarbonPassportModelFromNode(pNode), nil
			}
		}
		if r.engine != nil {
			if existing, err := r.engine.GetPassportByID(tenantCtx, prodNode.Spec.PassportID); err == nil && existing != nil {
				return existing, nil
			}
		}
	}

	// 1. Unmarshal Activity Data JSON
	activityMap := make(map[string]interface{})
	if prodNode.Spec.ActivityDataRaw != "" && prodNode.Spec.ActivityDataRaw != "{}" {
		if err := json.Unmarshal([]byte(prodNode.Spec.ActivityDataRaw), &activityMap); err != nil {
			log.Printf("[ProductReconciler] Failed to unmarshal ActivityDataRaw for product node %s: %v", prodNode.DisplayName(), err)
		}
	}
	PrepareActivityMapAliases(activityMap)

	// 2. Resolve Calculation Rulebook
	var rb engine.CalculationRulebook
	if prodNode.Spec.RulebookRef != "" {
		if r.client != nil {
			if rbNode, err := GetRulebookNode(ctx, r.client, prodNode.Spec.RulebookRef); err == nil && rbNode != nil {
				rb = engine.CalculationRulebook{
					CommodityType:  rbNode.Spec.CommodityType,
					AccountingMode: engine.AccountingMode(rbNode.Spec.AccountingMode),
					FunctionalUnit: rbNode.Spec.FunctionalUnit,
					BatchQuantity:  rbNode.Spec.BatchQuantity,
					Scope1Formula:  rbNode.Spec.Scope1Formula,
					Scope2Formula:  rbNode.Spec.Scope2Formula,
					Scope3Formula:  rbNode.Spec.Scope3Formula,
					Version:        rbNode.Spec.Version,
				}
				if rbNode.Spec.RulesRaw != "" {
					var rules []engine.RuleDefinition
					if err := json.Unmarshal([]byte(rbNode.Spec.RulesRaw), &rules); err == nil {
						rb.Rules = rules
					}
				}
			}
		}
		if rb.Scope1Formula == "" && r.engine != nil {
			if rbm, err := r.engine.GetRulebook(tenantCtx, prodNode.Spec.RulebookRef); err == nil && rbm != nil {
				rb = engine.CalculationRulebook{
					CommodityType:  rbm.CommodityType,
					AccountingMode: engine.AccountingMode(rbm.AccountingMode),
					FunctionalUnit: rbm.FunctionalUnit,
					BatchQuantity:  rbm.BatchQuantity,
					Scope1Formula:  rbm.Scope1Formula,
					Scope2Formula:  rbm.Scope2Formula,
					Scope3Formula:  rbm.Scope3Formula,
					Version:        rbm.Version,
				}
				if len(rbm.RulesRaw) > 0 {
					var rules []engine.RuleDefinition
					if err := json.Unmarshal(rbm.RulesRaw, &rules); err == nil {
						rb.Rules = rules
					}
				}
			}
		}
	}
	if rb.Scope1Formula == "" && rb.Scope2Formula == "" && rb.Scope3Formula == "" {
		rb = ResolveRulebookForCommodity(prodNode.Spec.CommodityType)
	}

	// 3. Evaluate CEL Rules
	calcRes, err := r.celEngine.Evaluate(tenantCtx, rb, activityMap)
	if err != nil {
		prodNode.Spec.Phase = "Failed"
		prodNode.Spec.LastUpdated = time.Now().UTC().Format(time.RFC3339)
		_ = prodNode.Update(ctx)
		return nil, fmt.Errorf("CEL calculation failed for product node %s: %w", prodNode.DisplayName(), err)
	}

	// 4. Resolve or Generate Passport ID
	passportID := prodNode.Spec.PassportID
	if passportID == "" {
		if r.client != nil {
			if existingNode, err := GetPassportNodeByBatchID(ctx, r.client, prodNode.Spec.BatchID); err == nil && existingNode != nil {
				passportID = existingNode.DisplayName()
			}
		}
		if passportID == "" && r.engine != nil {
			if existing, err := r.engine.GetPassportByBatchNumber(tenantCtx, prodNode.Spec.BatchID); err == nil && existing != nil {
				passportID = existing.PassportID
			}
		}
		if passportID == "" {
			passportID = uuid.New().String()
		}
	}

	if calcRes.VariableSnapshot != nil {
		activityMap["variable_snapshot"] = calcRes.VariableSnapshot
	}
	if calcRes.RuleResults != nil {
		activityMap["rule_results"] = calcRes.RuleResults
	}
	calcDetailsJSON, _ := json.Marshal(activityMap)

	// 5. Create CarbonPassport Node in Nexus Graph under Runtime branch
	client := r.client
	if client == nil {
		client = GetNexusClient()
	}
	if client != nil {
		passportSpec := runtimev1.CarbonPassportSpec{
			PassportID:         passportID,
			TenantID:           tenantID,
			FacilityID:         prodNode.Spec.FacilityID,
			BatchID:            prodNode.Spec.BatchID,
			CommodityType:      prodNode.Spec.CommodityType,
			TotalFootprintKg:   calcRes.TotalFootprintKg,
			Scope1Kg:           calcRes.Scope1Kg,
			Scope2Kg:           calcRes.Scope2Kg,
			Scope3Kg:           calcRes.Scope3Kg,
			VerificationStatus: "Calculated",
			CalculationDetails: string(calcDetailsJSON),
			DataHash:           calcRes.DataHash,
			IssuedAt:           time.Now().UTC().Format(time.RFC3339),
		}
		_, cpErr := CreatePassportNode(ctx, client, passportSpec, prodNode)
		if cpErr != nil {
			log.Printf("[ProductReconciler] Note on Nexus graph passport creation: %v", cpErr)
		}
	}

	// 6. Transition Product Node to "Calculated" in Nexus graph
	prodNode.Spec.Phase = "Calculated"
	prodNode.Spec.PassportID = passportID
	prodNode.Spec.TotalFootprintKg = calcRes.TotalFootprintKg
	prodNode.Spec.DataHash = calcRes.DataHash
	prodNode.Spec.LastUpdated = time.Now().UTC().Format(time.RFC3339)
	if err := prodNode.Update(ctx); err != nil {
		log.Printf("[ProductReconciler] Warning updating Product node %s: %v", prodNode.DisplayName(), err)
	}

	// 7. Synchronize to NexusGraphEngine store for query and backward compatibility
	passportModel := &CarbonPassportModel{
		PassportID:         passportID,
		TenantID:           tenantID,
		FacilityID:         prodNode.Spec.FacilityID,
		BatchNumber:        prodNode.Spec.BatchID,
		CommodityType:      prodNode.Spec.CommodityType,
		VerificationStatus: "Calculated",
		Scope1KgCO2e:       calcRes.Scope1Kg,
		Scope2KgCO2e:       calcRes.Scope2Kg,
		Scope3KgCO2e:       calcRes.Scope3Kg,
		TotalFootprintKg:   calcRes.TotalFootprintKg,
		CalculationDetails: calcDetailsJSON,
		DataHash:           calcRes.DataHash,
		IssuedAt:           time.Now(),
	}

	actionType := "Calculated"
	if prodNode.Spec.PassportID != "" {
		actionType = "Updated"
	}

	auditModel := &PassportAuditTrailModel{
		PassportID:    passportID,
		ActionType:    actionType,
		PreviousHash:  prodNode.Spec.DataHash,
		CurrentHash:   calcRes.DataHash,
		ChangePayload: calcDetailsJSON,
		Timestamp:     time.Now(),
	}

	if r.engine != nil {
		if err := r.engine.SavePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
			log.Printf("[ProductReconciler] Note saving passport to store: %v", err)
		}

		richPassportObj := BuildRichPassportResponse(passportModel)
		richBytes, _ := json.Marshal(richPassportObj)
		cacheKey := fmt.Sprintf("%s:%s", tenantID, passportID)
		_ = r.engine.CachePassport(tenantCtx, cacheKey, richBytes, 24*time.Hour)

		prodModel := &ProductModel{
			Name:             prodNode.DisplayName(),
			Namespace:        "default",
			TenantID:         tenantID,
			FacilityID:       prodNode.Spec.FacilityID,
			BatchID:          prodNode.Spec.BatchID,
			ProductName:      prodNode.Spec.ProductName,
			CommodityType:    prodNode.Spec.CommodityType,
			ActivityDataRaw:  prodNode.Spec.ActivityDataRaw,
			RulebookRefName:  prodNode.Spec.RulebookRef,
			Phase:            "Calculated",
			PassportID:       passportID,
			TotalFootprintKg: calcRes.TotalFootprintKg,
			DataHash:         calcRes.DataHash,
			LastUpdated:      time.Now(),
		}
		_ = r.engine.SaveProduct(tenantCtx, prodModel)
	}

	log.Printf("[ProductReconciler] Successfully reconciled Nexus Product node %s (footprint: %.2f kg CO2e, passport: %s)",
		prodNode.DisplayName(), calcRes.TotalFootprintKg, passportID)

	return passportModel, nil
}

// ReconcileProduct performs the core CEL calculation, Carbon Passport generation,
// and Nexus graph node state update for a single ProductModel.
func (r *ProductReconciler) ReconcileProduct(ctx context.Context, product *ProductModel) (*CarbonPassportModel, error) {
	if product == nil {
		return nil, fmt.Errorf("cannot reconcile nil product")
	}

	tenantCtx := tenant.WithTenant(ctx, product.TenantID)

	// Attempt reconciliation through Nexus Product node if client is available
	if r.client != nil {
		prodNode, err := GetProductNode(ctx, r.client, product.TenantID, product.BatchID)
		if err == nil && prodNode != nil {
			passport, recErr := r.ReconcileProductNode(ctx, prodNode)
			if recErr == nil && passport != nil {
				product.Phase = "Calculated"
				product.PassportID = passport.PassportID
				product.TotalFootprintKg = passport.TotalFootprintKg
				product.DataHash = passport.DataHash
				product.LastUpdated = time.Now()
				if r.engine != nil {
					_ = r.engine.SaveProduct(tenantCtx, product)
				}
			}
			return passport, recErr
		}
		// Create node under Tenant if not exists
		prodSpec := inventoryv1.ProductSpec{
			ProductID:       product.BatchID,
			ProductName:     product.ProductName,
			CommodityType:   product.CommodityType,
			BatchID:         product.BatchID,
			TenantID:        product.TenantID,
			FacilityID:      product.FacilityID,
			ActivityDataRaw: product.ActivityDataRaw,
			RulebookRef:     product.RulebookRefName,
			Phase:           product.Phase,
			PassportID:      product.PassportID,
			DataHash:        product.DataHash,
			LastUpdated:     time.Now().UTC().Format(time.RFC3339),
		}
		if newNode, createErr := CreateProductNode(ctx, r.client, product.TenantID, prodSpec); createErr == nil && newNode != nil {
			passport, recErr := r.ReconcileProductNode(ctx, newNode)
			if recErr == nil && passport != nil {
				product.Phase = "Calculated"
				product.PassportID = passport.PassportID
				product.TotalFootprintKg = passport.TotalFootprintKg
				product.DataHash = passport.DataHash
				product.LastUpdated = time.Now()
				if r.engine != nil {
					_ = r.engine.SaveProduct(tenantCtx, product)
				}
			}
			return passport, recErr
		}
	}

	// Fallback direct reconciliation for storage engine
	activityMap := make(map[string]interface{})
	if product.ActivityDataRaw != "" && product.ActivityDataRaw != "{}" {
		if err := json.Unmarshal([]byte(product.ActivityDataRaw), &activityMap); err != nil {
			log.Printf("[ProductReconciler] Failed to unmarshal ActivityDataRaw for product %s: %v", product.Name, err)
		}
	}
	PrepareActivityMapAliases(activityMap)

	var rb engine.CalculationRulebook
	if product.RulebookRefName != "" {
		if r.client != nil {
			if rbNode, err := GetRulebookNode(ctx, r.client, product.RulebookRefName); err == nil && rbNode != nil {
				rb = engine.CalculationRulebook{
					CommodityType:  rbNode.Spec.CommodityType,
					AccountingMode: engine.AccountingMode(rbNode.Spec.AccountingMode),
					FunctionalUnit: rbNode.Spec.FunctionalUnit,
					BatchQuantity:  rbNode.Spec.BatchQuantity,
					Scope1Formula:  rbNode.Spec.Scope1Formula,
					Scope2Formula:  rbNode.Spec.Scope2Formula,
					Scope3Formula:  rbNode.Spec.Scope3Formula,
					Version:        rbNode.Spec.Version,
				}
				if rbNode.Spec.RulesRaw != "" {
					var rules []engine.RuleDefinition
					if err := json.Unmarshal([]byte(rbNode.Spec.RulesRaw), &rules); err == nil {
						rb.Rules = rules
					}
				}
			}
		}
		if rb.Scope1Formula == "" && r.engine != nil {
			if rbm, err := r.engine.GetRulebook(tenantCtx, product.RulebookRefName); err == nil && rbm != nil {
				rb = engine.CalculationRulebook{
					CommodityType:  rbm.CommodityType,
					AccountingMode: engine.AccountingMode(rbm.AccountingMode),
					FunctionalUnit: rbm.FunctionalUnit,
					BatchQuantity:  rbm.BatchQuantity,
					Scope1Formula:  rbm.Scope1Formula,
					Scope2Formula:  rbm.Scope2Formula,
					Scope3Formula:  rbm.Scope3Formula,
					Version:        rbm.Version,
				}
				if len(rbm.RulesRaw) > 0 {
					var rules []engine.RuleDefinition
					if err := json.Unmarshal(rbm.RulesRaw, &rules); err == nil {
						rb.Rules = rules
					}
				}
			}
		}
	}
	if rb.Scope1Formula == "" && rb.Scope2Formula == "" && rb.Scope3Formula == "" {
		rb = ResolveRulebookForCommodity(product.CommodityType)
	}

	calcRes, err := r.celEngine.Evaluate(tenantCtx, rb, activityMap)
	if err != nil {
		product.Phase = "Failed"
		product.LastUpdated = time.Now()
		if r.engine != nil {
			_ = r.engine.SaveProduct(tenantCtx, product)
		}
		return nil, fmt.Errorf("CEL calculation failed for product %s: %w", product.Name, err)
	}

	passportID := product.PassportID
	if passportID == "" {
		if r.client != nil {
			if existingNode, err := GetPassportNodeByBatchID(ctx, r.client, product.BatchID); err == nil && existingNode != nil {
				passportID = existingNode.DisplayName()
			}
		}
		if passportID == "" && r.engine != nil {
			if existing, err := r.engine.GetPassportByBatchNumber(tenantCtx, product.BatchID); err == nil && existing != nil {
				passportID = existing.PassportID
			}
		}
		if passportID == "" {
			passportID = uuid.New().String()
		}
	}

	if calcRes.VariableSnapshot != nil {
		activityMap["variable_snapshot"] = calcRes.VariableSnapshot
	}
	if calcRes.RuleResults != nil {
		activityMap["rule_results"] = calcRes.RuleResults
	}
	calcDetailsJSON, _ := json.Marshal(activityMap)

	passportModel := &CarbonPassportModel{
		PassportID:         passportID,
		TenantID:           product.TenantID,
		FacilityID:         product.FacilityID,
		BatchNumber:        product.BatchID,
		CommodityType:      product.CommodityType,
		VerificationStatus: "Calculated",
		Scope1KgCO2e:       calcRes.Scope1Kg,
		Scope2KgCO2e:       calcRes.Scope2Kg,
		Scope3KgCO2e:       calcRes.Scope3Kg,
		TotalFootprintKg:   calcRes.TotalFootprintKg,
		CalculationDetails: calcDetailsJSON,
		DataHash:           calcRes.DataHash,
		IssuedAt:           time.Now(),
	}

	actionType := "Calculated"
	if product.PassportID != "" {
		actionType = "Updated"
	}

	auditModel := &PassportAuditTrailModel{
		PassportID:    passportID,
		ActionType:    actionType,
		PreviousHash:  product.DataHash,
		CurrentHash:   calcRes.DataHash,
		ChangePayload: calcDetailsJSON,
		Timestamp:     time.Now(),
	}

	if r.engine != nil {
		if err := r.engine.SavePassportAndAudit(tenantCtx, passportModel, auditModel); err != nil {
			return nil, fmt.Errorf("failed to save passport to nexus: %w", err)
		}

		richPassportObj := BuildRichPassportResponse(passportModel)
		richBytes, _ := json.Marshal(richPassportObj)
		cacheKey := fmt.Sprintf("%s:%s", product.TenantID, passportID)
		_ = r.engine.CachePassport(tenantCtx, cacheKey, richBytes, 24*time.Hour)
	}

	product.Phase = "Calculated"
	product.PassportID = passportID
	product.TotalFootprintKg = calcRes.TotalFootprintKg
	product.DataHash = calcRes.DataHash
	product.LastUpdated = time.Now()
	if r.engine != nil {
		if err := r.engine.SaveProduct(tenantCtx, product); err != nil {
			return nil, fmt.Errorf("failed to update product status in nexus: %w", err)
		}
	}

	log.Printf("[ProductReconciler] Successfully reconciled product batch %s (footprint: %.2f kg CO2e, passport: %s)",
		product.BatchID, calcRes.TotalFootprintKg, passportID)

	return passportModel, nil
}
