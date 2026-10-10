package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	configv1 "saurient-platform/build/apis/config.saurient.io/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/internal/tenant"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// --- Passport Operations ---

func (e *NexusGraphEngine) SavePassportAndAudit(ctx context.Context, p *CarbonPassportModel, audit *PassportAuditTrailModel) error {
	client := GetNexusClient()
	tenantID, _ := tenant.GetTenant(ctx)
	if tenantID != "" {
		p.TenantID = tenantID
	}
	if p.TenantID == "" {
		p.TenantID = "tenant-default"
	}
	if p.IssuedAt.IsZero() {
		p.IssuedAt = time.Now()
	}

	calcDetailsStr := string(p.CalculationDetails)
	if calcDetailsStr == "" {
		calcDetailsStr = "{}"
	}

	frozen := false
	frozenAt := ""
	if p.VerificationStatus == StatusIssued || p.VerificationStatus == StatusSubmittedToAgency || strings.EqualFold(p.VerificationStatus, "VERIFIED") {
		frozen = true
		frozenAt = p.IssuedAt.UTC().Format(time.RFC3339)
	}

	spec := runtimev1.CarbonPassportSpec{
		PassportID:         p.PassportID,
		TenantID:           p.TenantID,
		FacilityID:         p.FacilityID,
		BatchID:            p.BatchNumber,
		CommodityType:      p.CommodityType,
		TotalFootprintKg:   p.TotalFootprintKg,
		Scope1Kg:           p.Scope1KgCO2e,
		Scope2Kg:           p.Scope2KgCO2e,
		Scope3Kg:           p.Scope3KgCO2e,
		VerificationStatus: p.VerificationStatus,
		CalculationDetails: calcDetailsStr,
		DataHash:           p.DataHash,
		Frozen:             frozen,
		FrozenAt:           frozenAt,
		IssuedAt:           p.IssuedAt.UTC().Format(time.RFC3339),
		Version:            "1.0",
	}

	// Fetch linked Product node if available
	var prodNode *nexus_client.InventoryProduct
	if p.BatchNumber != "" {
		prodNode, _ = GetProductNode(ctx, client, p.TenantID, p.BatchNumber)
	}

	pNode, err := CreatePassportNode(ctx, client, spec, prodNode)
	if err != nil {
		return err
	}

	if audit != nil && pNode != nil {
		auditName := fmt.Sprintf("audit-%d", time.Now().UnixNano())
		_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
			ObjectMeta: metav1.ObjectMeta{
				Name: auditName,
			},
			Spec: runtimev1.AuditRecordSpec{
				ActionType:   audit.ActionType,
				PreviousHash: audit.PreviousHash,
				CurrentHash:  audit.CurrentHash,
				Timestamp:    audit.Timestamp.UTC().Format(time.RFC3339),
			},
		})
	}

	// Synchronize with Lineage DAG topology
	e.mu.Lock()
	e.nodes[p.PassportID] = LineageNode{
		NodeID:      p.PassportID,
		NodeType:    "PASSPORT",
		ReferenceID: p.BatchNumber,
		Label:       fmt.Sprintf("Carbon Passport %s", p.BatchNumber),
		Properties: map[string]interface{}{
			"tenant_id":           p.TenantID,
			"facility_id":         p.FacilityID,
			"commodity":           p.CommodityType,
			"verification_status": p.VerificationStatus,
			"total_footprint_kg":  p.TotalFootprintKg,
			"data_hash":           p.DataHash,
		},
		CreatedAt: p.IssuedAt,
	}
	e.mu.Unlock()

	return nil
}

func (e *NexusGraphEngine) SavePassport(ctx context.Context, p *CarbonPassportModel) error {
	return e.SavePassportAndAudit(ctx, p, nil)
}

func (e *NexusGraphEngine) UpdatePassportAndAudit(ctx context.Context, p *CarbonPassportModel, audit *PassportAuditTrailModel) error {
	return e.SavePassportAndAudit(ctx, p, audit)
}

func (e *NexusGraphEngine) GetPassportByID(ctx context.Context, passportID string) (*CarbonPassportModel, error) {
	client := GetNexusClient()
	pNode, err := GetPassportNode(ctx, client, passportID)
	if err == nil && pNode != nil {
		return CarbonPassportModelFromNode(pNode), nil
	}

	// Try lookup by batch ID
	pNode, err = GetPassportNodeByBatchID(ctx, client, passportID)
	if err == nil && pNode != nil {
		return CarbonPassportModelFromNode(pNode), nil
	}

	return nil, fmt.Errorf("passport not found: %s", passportID)
}

func (e *NexusGraphEngine) GetPassportByBatchNumber(ctx context.Context, batchNumber string) (*CarbonPassportModel, error) {
	client := GetNexusClient()
	pNode, err := GetPassportNodeByBatchID(ctx, client, batchNumber)
	if err == nil && pNode != nil {
		return CarbonPassportModelFromNode(pNode), nil
	}
	return nil, fmt.Errorf("passport for batch number %s not found", batchNumber)
}

func (e *NexusGraphEngine) ListPassports(ctx context.Context) ([]*CarbonPassportModel, error) {
	client := GetNexusClient()
	tenantID, _ := tenant.GetTenant(ctx)
	nodes, err := ListPassportNodes(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}
	var res []*CarbonPassportModel
	for _, n := range nodes {
		if m := CarbonPassportModelFromNode(n); m != nil {
			res = append(res, m)
		}
	}
	return res, nil
}

func (e *NexusGraphEngine) DeletePassportByPassportID(ctx context.Context, passportID string) error {
	client := GetNexusClient()
	return DeletePassportNode(ctx, client, passportID)
}

func (e *NexusGraphEngine) DeletePassportByBatchNumber(ctx context.Context, batchNumber string) error {
	client := GetNexusClient()
	pNode, err := GetPassportNodeByBatchID(ctx, client, batchNumber)
	if err != nil || pNode == nil {
		return nil
	}
	return DeletePassportNode(ctx, client, pNode.DisplayName())
}

// --- Product Operations ---

func (e *NexusGraphEngine) SaveProduct(ctx context.Context, prod *ProductModel) error {
	client := GetNexusClient()
	tenantID, _ := tenant.GetTenant(ctx)
	if tenantID != "" {
		prod.TenantID = tenantID
	}
	if prod.TenantID == "" {
		prod.TenantID = "tenant-default"
	}
	if prod.CreatedAt.IsZero() {
		prod.CreatedAt = time.Now()
	}
	prod.LastUpdated = time.Now()

	prodID := prod.Name
	if prodID == "" {
		prodID = prod.BatchID
	}
	batchID := prod.BatchID
	if batchID == "" {
		batchID = prodID
	}

	spec := inventoryv1.ProductSpec{
		ProductID:       prodID,
		ProductName:     prod.ProductName,
		CommodityType:   prod.CommodityType,
		BatchID:         batchID,
		CnCode:          prod.CnCode,
		HsCode:          prod.HsCode,
		TenantID:        prod.TenantID,
		FacilityID:      prod.FacilityID,
		ActivityDataRaw: prod.ActivityDataRaw,
		RulebookRef:     prod.RulebookRefName,
		Phase:           prod.Phase,
		PassportID:      prod.PassportID,
		TotalFootprintKg: prod.TotalFootprintKg,
		DataHash:        prod.DataHash,
		LastUpdated:     prod.LastUpdated.UTC().Format(time.RFC3339),
	}

	_, err := CreateProductNode(ctx, client, prod.TenantID, spec)
	return err
}

func (e *NexusGraphEngine) GetProduct(ctx context.Context, productID string) (*ProductModel, error) {
	client := GetNexusClient()
	tenantID, _ := tenant.GetTenant(ctx)
	if tenantID == "" {
		tenantID = "tenant-default"
	}

	pNode, err := GetProductNode(ctx, client, tenantID, productID)
	if err != nil || pNode == nil {
		// Search across all tenant products
		prods, listErr := ListProductNodes(ctx, client, tenantID)
		if listErr == nil {
			for _, p := range prods {
				if p != nil && (p.Spec.BatchID == productID || p.Spec.ProductID == productID || p.DisplayName() == productID) {
					pNode = p
					break
				}
			}
		}
	}

	if pNode == nil {
		return nil, fmt.Errorf("product not found: %s", productID)
	}

	spec := pNode.Spec
	return &ProductModel{
		Name:            pNode.DisplayName(),
		TenantID:        spec.TenantID,
		FacilityID:      spec.FacilityID,
		BatchID:         spec.BatchID,
		ProductName:     spec.ProductName,
		CommodityType:   spec.CommodityType,
		CnCode:          spec.CnCode,
		HsCode:          spec.HsCode,
		ActivityDataRaw: spec.ActivityDataRaw,
		RulebookRefName: spec.RulebookRef,
		Phase:           spec.Phase,
		PassportID:      spec.PassportID,
		TotalFootprintKg: spec.TotalFootprintKg,
		DataHash:        spec.DataHash,
		CreatedAt:       time.Now(),
		LastUpdated:     time.Now(),
	}, nil
}

func (e *NexusGraphEngine) ListProducts(ctx context.Context, tenantID string) ([]*ProductModel, error) {
	client := GetNexusClient()
	if tenantID == "" {
		tenantID, _ = tenant.GetTenant(ctx)
	}

	pNodes, err := ListProductNodes(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}

	var res []*ProductModel
	for _, pNode := range pNodes {
		if pNode == nil {
			continue
		}
		spec := pNode.Spec
		res = append(res, &ProductModel{
			Name:            pNode.DisplayName(),
			TenantID:        spec.TenantID,
			FacilityID:      spec.FacilityID,
			BatchID:         spec.BatchID,
			ProductName:     spec.ProductName,
			CommodityType:   spec.CommodityType,
			CnCode:          spec.CnCode,
			HsCode:          spec.HsCode,
			ActivityDataRaw: spec.ActivityDataRaw,
			RulebookRefName: spec.RulebookRef,
			Phase:           spec.Phase,
			PassportID:      spec.PassportID,
			TotalFootprintKg: spec.TotalFootprintKg,
			DataHash:        spec.DataHash,
			CreatedAt:       time.Now(),
			LastUpdated:     time.Now(),
		})
	}
	return res, nil
}

func (e *NexusGraphEngine) DeleteProduct(ctx context.Context, productID string) error {
	client := GetNexusClient()
	tenantID, _ := tenant.GetTenant(ctx)
	if tenantID == "" {
		tenantID = "tenant-default"
	}
	return DeleteProductNode(ctx, client, tenantID, productID)
}

// --- Rulebook Operations ---

func (e *NexusGraphEngine) SaveRulebook(ctx context.Context, rb *RulebookModel) error {
	client := GetNexusClient()
	rulebookID := rb.RulebookID
	if rulebookID == "" {
		rulebookID = rb.ID
	}
	if rulebookID == "" {
		rulebookID = rb.Name
	}
	spec := configv1.RulebookSpec{
		RulebookID:     rulebookID,
		CommodityType:  rb.CommodityType,
		Version:        rb.Version,
		AccountingMode: rb.AccountingMode,
		FunctionalUnit: rb.FunctionalUnit,
		BatchQuantity:  rb.BatchQuantity,
		Scope1Formula:  rb.Scope1Formula,
		Scope2Formula:  rb.Scope2Formula,
		Scope3Formula:  rb.Scope3Formula,
		RulesRaw:       string(rb.RulesRaw),
	}
	_, err := CreateRulebookNode(ctx, client, rulebookID, spec)
	return err
}

func (e *NexusGraphEngine) GetRulebook(ctx context.Context, rulebookID string) (*RulebookModel, error) {
	client := GetNexusClient()
	rbNode, err := GetRulebookNode(ctx, client, rulebookID)
	if err != nil || rbNode == nil {
		return nil, fmt.Errorf("rulebook not found: %s", rulebookID)
	}
	spec := rbNode.Spec
	return &RulebookModel{
		RulebookID:     spec.RulebookID,
		CommodityType:  spec.CommodityType,
		Version:        spec.Version,
		AccountingMode: spec.AccountingMode,
		FunctionalUnit: spec.FunctionalUnit,
		BatchQuantity:  spec.BatchQuantity,
		Scope1Formula:  spec.Scope1Formula,
		Scope2Formula:  spec.Scope2Formula,
		Scope3Formula:  spec.Scope3Formula,
		RulesRaw:       json.RawMessage(spec.RulesRaw),
	}, nil
}

func (e *NexusGraphEngine) ListRulebooks(ctx context.Context) ([]*RulebookModel, error) {
	client := GetNexusClient()
	nodes, err := ListRulebookNodes(ctx, client)
	if err != nil {
		return nil, err
	}
	var res []*RulebookModel
	for _, n := range nodes {
		if n == nil {
			continue
		}
		spec := n.Spec
		res = append(res, &RulebookModel{
			RulebookID:     spec.RulebookID,
			CommodityType:  spec.CommodityType,
			Version:        spec.Version,
			AccountingMode: spec.AccountingMode,
			FunctionalUnit: spec.FunctionalUnit,
			BatchQuantity:  spec.BatchQuantity,
			Scope1Formula:  spec.Scope1Formula,
			Scope2Formula:  spec.Scope2Formula,
			Scope3Formula:  spec.Scope3Formula,
			RulesRaw:       json.RawMessage(spec.RulesRaw),
		})
	}
	return res, nil
}

// --- Tenant Profile Operations ---

func (e *NexusGraphEngine) GetTenantProfile(ctx context.Context) (*TenantProfileModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	e.opMu.RLock()
	p, ok := e.tenantProfiles[tID]
	e.opMu.RUnlock()

	if ok && p != nil {
		return p, nil
	}

	// Create from Tenant CRD node
	client := GetNexusClient()
	tNode, err := EnsureTenantNode(ctx, client, tID)
	if err == nil && tNode != nil {
		legalName := tNode.Spec.LegalName
		if legalName == "" || legalName == tID || legalName == "org_saurient_demo" {
			if tID == "org_saurient_demo" {
				legalName = "Saurient Industrial Ltd"
			} else if tID == "org_asante_cocoa" {
				legalName = "Asante Cocoa Ltd"
			} else if strings.HasPrefix(tID, "org_") {
				clean := strings.TrimPrefix(tID, "org_")
				clean = strings.ReplaceAll(clean, "_", " ")
				legalName = strings.Title(clean)
			} else {
				legalName = "Sattric Industrial Corp Ltd"
			}
		}
		country := tNode.Spec.Country
		if country == "" {
			country = "India"
		}
		ind := tNode.Spec.Industry
		if ind == "" {
			ind = "Basic Metals & Steel Manufacturing"
		}

		profile := &TenantProfileModel{
			TenantID:               tID,
			LegalName:              legalName,
			TradingName:            legalName,
			CountryOfIncorporation: country,
			Industry:               ind,
			Status:                 "Active",
			CreatedAt:              time.Now(),
			UpdatedAt:              time.Now(),
		}
		e.opMu.Lock()
		e.tenantProfiles[tID] = profile
		e.opMu.Unlock()
		return profile, nil
	}

	return nil, fmt.Errorf("profile for tenant %s not found", tID)
}

func (e *NexusGraphEngine) SaveTenantProfile(ctx context.Context, profile *TenantProfileModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		profile.TenantID = tID
	} else if profile.TenantID == "" {
		profile.TenantID = "tenant-default"
	}

	// Sync with Tenant CRD node in Nexus graph
	client := GetNexusClient()
	tNode, err := EnsureTenantNode(ctx, client, profile.TenantID)
	if err == nil && tNode != nil {
		if profile.LegalName != "" {
			tNode.Spec.LegalName = profile.LegalName
		}
		if profile.CountryOfIncorporation != "" {
			tNode.Spec.Country = profile.CountryOfIncorporation
		}
		if profile.Industry != "" {
			tNode.Spec.Industry = profile.Industry
		}
		_ = tNode.Update(ctx)
	}

	profile.UpdatedAt = time.Now()
	if profile.CreatedAt.IsZero() {
		profile.CreatedAt = time.Now()
	}

	e.opMu.Lock()
	e.tenantProfiles[profile.TenantID] = profile
	e.opMu.Unlock()
	return nil
}

// --- Facility Operations ---

func (e *NexusGraphEngine) ListFacilities(ctx context.Context) ([]*FacilityModel, error) {
	client := GetNexusClient()
	tID, _ := tenant.GetTenant(ctx)
	facNodes, err := ListFacilityNodes(ctx, client, tID)
	if err != nil {
		return nil, err
	}
	var res []*FacilityModel
	for _, fn := range facNodes {
		if fm := FacilityModelFromNode(fn); fm != nil {
			res = append(res, fm)
		}
	}
	return res, nil
}

func (e *NexusGraphEngine) SaveFacility(ctx context.Context, f *FacilityModel) error {
	client := GetNexusClient()
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		f.TenantID = tID
	} else if f.TenantID == "" {
		f.TenantID = "tenant-default"
	}

	spec := inventoryv1.FacilitySpec{
		FacilityID:  f.ID,
		Name:        f.Name,
		Location:    f.Address,
		CountryCode: f.CountryCode,
	}

	_, err := SaveFacilityNode(ctx, client, f.TenantID, spec)
	return err
}

func (e *NexusGraphEngine) DeleteFacility(ctx context.Context, facilityID string) error {
	client := GetNexusClient()
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return DeleteFacilityNode(ctx, client, tID, facilityID)
}

// --- Process Operations ---

func (e *NexusGraphEngine) ListProcesses(ctx context.Context) ([]*ProcessModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	procs := e.processes[tID]
	if procs == nil {
		procs = []*ProcessModel{}
	}
	return procs, nil
}

func (e *NexusGraphEngine) SaveProcess(ctx context.Context, proc *ProcessModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		proc.TenantID = tID
	} else if proc.TenantID == "" {
		proc.TenantID = "tenant-default"
	}
	if proc.CreatedAt.IsZero() {
		proc.CreatedAt = time.Now()
	}
	proc.UpdatedAt = time.Now()

	e.opMu.Lock()
	defer e.opMu.Unlock()
	list := e.processes[proc.TenantID]
	updated := false
	for i, existing := range list {
		if existing.ID == proc.ID {
			list[i] = proc
			updated = true
			break
		}
	}
	if !updated {
		list = append(list, proc)
	}
	e.processes[proc.TenantID] = list
	return nil
}

func (e *NexusGraphEngine) DeleteProcess(ctx context.Context, processID string) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.Lock()
	defer e.opMu.Unlock()
	list := e.processes[tID]
	filtered := make([]*ProcessModel, 0, len(list))
	for _, p := range list {
		if p.ID != processID {
			filtered = append(filtered, p)
		}
	}
	e.processes[tID] = filtered
	return nil
}

// --- User Operations ---

func (e *NexusGraphEngine) ListOrganisationUsers(ctx context.Context) ([]*OrganisationUserModel, error) {
	client := GetNexusClient()
	tID, _ := tenant.GetTenant(ctx)
	uNodes, err := ListUserNodes(ctx, client, tID)
	if err != nil {
		return nil, err
	}
	var res []*OrganisationUserModel
	for _, un := range uNodes {
		if um := UserModelFromNode(un); um != nil {
			res = append(res, um)
		}
	}
	return res, nil
}

func (e *NexusGraphEngine) SaveOrganisationUser(ctx context.Context, user *OrganisationUserModel) error {
	client := GetNexusClient()
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		user.TenantID = tID
	} else if user.TenantID == "" {
		user.TenantID = "tenant-default"
	}

	spec := inventoryv1.UserSpec{
		UserID:        user.ID,
		TenantID:      user.TenantID,
		Name:          user.Name,
		Email:         user.Email,
		PasswordHash:  user.PasswordHash,
		Salt:          user.Salt,
		Role:          user.Role,
		FacilityScope: user.FacilityScope,
		LastLogin:     user.LastLogin,
		Status:        user.Status,
	}

	_, err := CreateUserNode(ctx, client, user.TenantID, spec)
	return err
}

func (e *NexusGraphEngine) UpdateUserRole(ctx context.Context, userID, newRole string) error {
	client := GetNexusClient()
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	return UpdateUserRoleNode(ctx, client, tID, userID, newRole)
}

// --- Reporting Period Operations ---

func (e *NexusGraphEngine) ListReportingPeriods(ctx context.Context) ([]*ReportingPeriodModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	return e.reportingPeriods[tID], nil
}

func (e *NexusGraphEngine) SaveReportingPeriod(ctx context.Context, rp *ReportingPeriodModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		rp.TenantID = tID
	} else if rp.TenantID == "" {
		rp.TenantID = "tenant-default"
	}
	if rp.CreatedAt.IsZero() {
		rp.CreatedAt = time.Now()
	}
	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.reportingPeriods[rp.TenantID] = append(e.reportingPeriods[rp.TenantID], rp)
	return nil
}

// --- Localisation Operations ---

func (e *NexusGraphEngine) GetLocalisation(ctx context.Context) (*LocalisationModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	loc, ok := e.localisations[tID]
	if !ok {
		return &LocalisationModel{
			TenantID:            tID,
			DefaultLanguage:     "en-GB",
			DefaultCurrency:     "EUR",
			DefaultTimezone:     "UTC+01:00 (CET/Brussels)",
			DefaultEmissionUnit: "kgCO2e",
			NumberFormat:        "1,234.56",
			DateFormat:          "YYYY-MM-DD",
		}, nil
	}
	return loc, nil
}

func (e *NexusGraphEngine) SaveLocalisation(ctx context.Context, loc *LocalisationModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		loc.TenantID = tID
	} else if loc.TenantID == "" {
		loc.TenantID = "tenant-default"
	}
	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.localisations[loc.TenantID] = loc
	return nil
}

// --- Approvals Operations ---

func (e *NexusGraphEngine) ListApprovals(ctx context.Context) ([]*ApprovalModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	return e.approvals[tID], nil
}

func (e *NexusGraphEngine) SaveApproval(ctx context.Context, a *ApprovalModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		a.TenantID = tID
	} else if a.TenantID == "" {
		a.TenantID = "tenant-default"
	}
	if a.SubmittedAt.IsZero() {
		a.SubmittedAt = time.Now()
	}
	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.approvals[a.TenantID] = append(e.approvals[a.TenantID], a)
	return nil
}

// --- ACV Verification Operations ---

func (e *NexusGraphEngine) CreateAgency(ctx context.Context, agency *AgencyModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		agency.TenantID = tID
	} else if agency.TenantID == "" {
		agency.TenantID = "tenant-default"
	}
	if agency.CreatedAt.IsZero() {
		agency.CreatedAt = time.Now()
	}
	agency.UpdatedAt = time.Now()

	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.agencies[agency.TenantID] = append(e.agencies[agency.TenantID], agency)
	return nil
}

func (e *NexusGraphEngine) ListAgencies(ctx context.Context) ([]*AgencyModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	return e.agencies[tID], nil
}

func (e *NexusGraphEngine) CreateEngagement(ctx context.Context, eng *VerificationEngagementModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		eng.TenantID = tID
	} else if eng.TenantID == "" {
		eng.TenantID = "tenant-default"
	}
	if eng.CreatedAt.IsZero() {
		eng.CreatedAt = time.Now()
	}
	eng.UpdatedAt = time.Now()

	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.engagements[eng.TenantID] = append(e.engagements[eng.TenantID], eng)
	return nil
}

func (e *NexusGraphEngine) ListEngagements(ctx context.Context) ([]*VerificationEngagementModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	return e.engagements[tID], nil
}

func (e *NexusGraphEngine) AssignTeamMember(ctx context.Context, m *EngagementTeamMemberModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		m.TenantID = tID
	} else if m.TenantID == "" {
		m.TenantID = "tenant-default"
	}
	if m.AssignedAt.IsZero() {
		m.AssignedAt = time.Now()
	}

	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.teamMembers[m.TenantID] = append(e.teamMembers[m.TenantID], m)
	return nil
}

func (e *NexusGraphEngine) SubmitCOIDeclaration(ctx context.Context, c *COIDeclarationModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		c.TenantID = tID
	} else if c.TenantID == "" {
		c.TenantID = "tenant-default"
	}
	if c.DeclaredAt.IsZero() {
		c.DeclaredAt = time.Now()
	}

	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.coiDeclarations[c.TenantID] = append(e.coiDeclarations[c.TenantID], c)
	return nil
}

func (e *NexusGraphEngine) CreateFinding(ctx context.Context, f *FindingModel) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		f.TenantID = tID
	} else if f.TenantID == "" {
		f.TenantID = "tenant-default"
	}
	if f.CreatedAt.IsZero() {
		f.CreatedAt = time.Now()
	}
	f.UpdatedAt = time.Now()

	e.opMu.Lock()
	defer e.opMu.Unlock()
	e.findings[f.TenantID] = append(e.findings[f.TenantID], f)
	return nil
}

func (e *NexusGraphEngine) ListFindings(ctx context.Context, engagementID string) ([]*FindingModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	var res []*FindingModel
	for _, f := range e.findings[tID] {
		if engagementID == "" || f.EngagementID == engagementID {
			res = append(res, f)
		}
	}
	return res, nil
}

func (e *NexusGraphEngine) SignoffEngagement(ctx context.Context, s *ReviewSignoffModel, frozenBy string) error {
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		s.TenantID = tID
	} else if s.TenantID == "" {
		s.TenantID = "tenant-default"
	}
	if s.SignedAt.IsZero() {
		s.SignedAt = time.Now()
	}

	e.opMu.Lock()
	e.signoffs[s.TenantID] = append(e.signoffs[s.TenantID], s)
	e.opMu.Unlock()

	// Update RuntimeCarbonPassport node in Nexus graph
	client := GetNexusClient()
	if client != nil {
		pNode, err := GetPassportNode(ctx, client, s.PassportID)
		if err == nil && pNode != nil {
			pNode.Spec.VerificationStatus = "Verified"
			pNode.Spec.Frozen = true
			pNode.Spec.FrozenAt = time.Now().UTC().Format(time.RFC3339)
			_ = pNode.Update(ctx)

			auditName := fmt.Sprintf("audit-signoff-%d", time.Now().UnixNano())
			_, _ = pNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
				ObjectMeta: metav1.ObjectMeta{
					Name: auditName,
				},
				Spec: runtimev1.AuditRecordSpec{
					ActionType:   "VerifiedAndSignedOff",
					PreviousHash: pNode.Spec.DataHash,
					CurrentHash:  pNode.Spec.DataHash,
					Timestamp:    time.Now().UTC().Format(time.RFC3339),
					UserRef:      fmt.Sprintf("%s (LeadAuditor, StatementRef: %s, Opinion: %s)", s.LeadAuditor, s.StatementRef, s.Opinion),
				},
			})
		}
	}

	return nil
}

func (e *NexusGraphEngine) GetPublicPassportSummary(ctx context.Context, passportID string) (*PublicPassportSummaryModel, error) {
	client := GetNexusClient()
	pNode, err := GetPassportNode(ctx, client, passportID)
	if err != nil || pNode == nil {
		pNode, err = GetPassportNodeByBatchID(ctx, client, passportID)
	}
	if err != nil || pNode == nil {
		return nil, fmt.Errorf("passport not found: %s", passportID)
	}

	p := CarbonPassportModelFromNode(pNode)
	opinion := "Unqualified"
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}

	e.opMu.RLock()
	for _, sign := range e.signoffs[tID] {
		if sign.PassportID == passportID {
			opinion = sign.Opinion
			break
		}
	}
	e.opMu.RUnlock()

	return &PublicPassportSummaryModel{
		PassportID:         p.PassportID,
		CommodityType:      p.CommodityType,
		TotalFootprintKg:   p.TotalFootprintKg,
		VerificationStatus: p.VerificationStatus,
		ReviewOpinion:      opinion,
		IssuedAt:           p.IssuedAt,
	}, nil
}

// --- Response Caching ---

func (e *NexusGraphEngine) CachePassport(ctx context.Context, key string, data []byte, ttl time.Duration) error {
	e.cacheMu.Lock()
	defer e.cacheMu.Unlock()
	e.cacheMap[key] = data
	return nil
}

func (e *NexusGraphEngine) GetPassportCache(ctx context.Context, key string) ([]byte, error) {
	e.cacheMu.RLock()
	defer e.cacheMu.RUnlock()
	data, ok := e.cacheMap[key]
	if !ok || len(data) == 0 {
		return nil, fmt.Errorf("cache miss for %s", key)
	}
	return data, nil
}

func (e *NexusGraphEngine) DeletePassportCache(ctx context.Context, key string) error {
	e.cacheMu.Lock()
	defer e.cacheMu.Unlock()
	delete(e.cacheMap, key)
	return nil
}
