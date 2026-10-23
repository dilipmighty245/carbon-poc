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

	// Producer Tenant Immutability:
	// A passport's TenantID represents the manufacturer/producer organisation.
	// Never allow cross-tenant actor contexts ("all", "public", "tenant-verifier-agency", or empty) to overwrite a valid producer tenant.
	if p.TenantID == "" || p.TenantID == "all" || p.TenantID == "public" || strings.HasPrefix(p.TenantID, "tenant-verifier") {
		if tenantID != "" && tenantID != "all" && tenantID != "public" && !strings.HasPrefix(tenantID, "tenant-verifier") {
			p.TenantID = tenantID
		}
	}

	// Fetch linked Product node if available, and resolve producer tenant if needed
	var prodNode *nexus_client.InventoryProduct
	if client != nil {
		if p.TenantID != "" && p.TenantID != "all" && p.BatchNumber != "" {
			prodNode, _ = GetProductNode(ctx, client, p.TenantID, p.BatchNumber)
		}
		if prodNode == nil && (p.BatchNumber != "" || p.PassportID != "") {
			if prods, err := client.Inventory().ListProducts(ctx, metav1.ListOptions{}); err == nil {
				for _, pr := range prods {
					if pr != nil && (pr.Spec.BatchID == p.BatchNumber || pr.Spec.PassportID == p.PassportID || pr.DisplayName() == p.BatchNumber) {
						prodNode = pr
						if pr.Spec.TenantID != "" && pr.Spec.TenantID != "all" && pr.Spec.TenantID != "public" {
							p.TenantID = pr.Spec.TenantID
						}
						break
					}
				}
			}
		}
	}

	if p.TenantID == "" || p.TenantID == "all" || p.TenantID == "public" {
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

	pNode, err := CreatePassportNode(ctx, client, spec, prodNode)
	if err != nil {
		return err
	}
	if pNode != nil && pNode.Spec.TenantID != "" && pNode.Spec.TenantID != "all" {
		p.TenantID = pNode.Spec.TenantID
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
		ProductID:        prodID,
		ProductName:      prod.ProductName,
		CommodityType:    prod.CommodityType,
		BatchID:          batchID,
		CnCode:           prod.CnCode,
		HsCode:           prod.HsCode,
		TenantID:         prod.TenantID,
		FacilityID:       prod.FacilityID,
		ActivityDataRaw:  prod.ActivityDataRaw,
		RulebookRef:      prod.RulebookRefName,
		Phase:            prod.Phase,
		PassportID:       prod.PassportID,
		TotalFootprintKg: prod.TotalFootprintKg,
		DataHash:         prod.DataHash,
		LastUpdated:      prod.LastUpdated.UTC().Format(time.RFC3339),
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
		Name:             pNode.DisplayName(),
		TenantID:         spec.TenantID,
		FacilityID:       spec.FacilityID,
		BatchID:          spec.BatchID,
		ProductName:      spec.ProductName,
		CommodityType:    spec.CommodityType,
		CnCode:           spec.CnCode,
		HsCode:           spec.HsCode,
		ActivityDataRaw:  spec.ActivityDataRaw,
		RulebookRefName:  spec.RulebookRef,
		Phase:            spec.Phase,
		PassportID:       spec.PassportID,
		TotalFootprintKg: spec.TotalFootprintKg,
		DataHash:         spec.DataHash,
		CreatedAt:        time.Now(),
		LastUpdated:      time.Now(),
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
			Name:             pNode.DisplayName(),
			TenantID:         spec.TenantID,
			FacilityID:       spec.FacilityID,
			BatchID:          spec.BatchID,
			ProductName:      spec.ProductName,
			CommodityType:    spec.CommodityType,
			CnCode:           spec.CnCode,
			HsCode:           spec.HsCode,
			ActivityDataRaw:  spec.ActivityDataRaw,
			RulebookRefName:  spec.RulebookRef,
			Phase:            spec.Phase,
			PassportID:       spec.PassportID,
			TotalFootprintKg: spec.TotalFootprintKg,
			DataHash:         spec.DataHash,
			CreatedAt:        time.Now(),
			LastUpdated:      time.Now(),
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
	return e.GetTenantProfileWithClient(ctx, GetNexusClient())
}

func (e *NexusGraphEngine) GetTenantProfileWithClient(ctx context.Context, client *nexus_client.Clientset) (*TenantProfileModel, error) {
	tID, _ := tenant.GetTenant(ctx)
	if tID == "" {
		tID = "tenant-default"
	}
	tNode, err := EnsureTenantNode(ctx, client, tID)
	if err != nil {
		return nil, err
	}
	if tNode.Spec.ProfileRaw != "" {
		var profile TenantProfileModel
		if err := json.Unmarshal([]byte(tNode.Spec.ProfileRaw), &profile); err != nil {
			return nil, fmt.Errorf("invalid stored profile for tenant %s: %w", tID, err)
		}
		profile.TenantID = tID
		return &profile, nil
	}
	// Legacy tenants only contain these fields. Do not invent tax or verification data.
	legalName := tNode.Spec.LegalName
	if legalName == "" || legalName == tID {
		if strings.HasPrefix(tID, "org_") {
			legalName = strings.Title(strings.ReplaceAll(strings.TrimPrefix(tID, "org_"), "_", " "))
		} else {
			legalName = "Enterprise Manufacturer"
		}
	}
	return &TenantProfileModel{TenantID: tID, LegalName: legalName, TradingName: legalName,
		CountryOfIncorporation: tNode.Spec.Country, Industry: tNode.Spec.Industry, Status: "Pending Verification"}, nil
}

func (e *NexusGraphEngine) SaveTenantProfile(ctx context.Context, profile *TenantProfileModel) error {
	return e.SaveTenantProfileWithClient(ctx, GetNexusClient(), profile)
}

func (e *NexusGraphEngine) SaveTenantProfileWithClient(ctx context.Context, client *nexus_client.Clientset, profile *TenantProfileModel) error {
	if profile == nil {
		return fmt.Errorf("profile is required")
	}
	tID, _ := tenant.GetTenant(ctx)
	if tID != "" {
		profile.TenantID = tID
	} else if profile.TenantID == "" {
		profile.TenantID = "tenant-default"
	}
	tNode, err := EnsureTenantNode(ctx, client, profile.TenantID)
	if err != nil {
		return fmt.Errorf("ensure tenant: %w", err)
	}
	profile.UpdatedAt = time.Now().UTC()
	if profile.CreatedAt.IsZero() {
		profile.CreatedAt = profile.UpdatedAt
	}
	raw, err := json.Marshal(profile)
	if err != nil {
		return fmt.Errorf("encode profile: %w", err)
	}
	tNode.Spec.LegalName = profile.LegalName
	tNode.Spec.Country = profile.CountryOfIncorporation
	tNode.Spec.Industry = profile.Industry
	tNode.Spec.ProfileRaw = string(raw)
	if err := tNode.Update(ctx); err != nil {
		return fmt.Errorf("persist tenant profile: %w", err)
	}
	return nil
}

// ForgetTenantProfile removes the cache after a rolled-back registration.
func (e *NexusGraphEngine) ForgetTenantProfile(tenantID string) {
	// Profiles are read directly from their persisted Tenant nodes.
}

// FindTenantByEmailOrDomain searches for a registered company in tenant profiles and Nexus datamodel
// that matches an email domain or company name.
func (e *NexusGraphEngine) FindTenantByEmailOrDomain(ctx context.Context, email string) (*TenantProfileModel, bool) {
	return e.FindTenantByEmailOrDomainWithClient(ctx, GetNexusClient(), email)
}

func (e *NexusGraphEngine) FindTenantByEmailOrDomainWithClient(ctx context.Context, client *nexus_client.Clientset, email string) (*TenantProfileModel, bool) {
	email = strings.TrimSpace(strings.ToLower(email))
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return nil, false
	}
	domain := parts[1]
	domainSlug := strings.Split(domain, ".")[0]
	domainSlug = strings.ReplaceAll(domainSlug, "-", "_")

	// Discover companies from persisted profiles, independent of which API replica handled registration.
	if nodes, err := client.Inventory().ListTenants(ctx, metav1.ListOptions{}); err == nil {
		for _, node := range nodes {
			prof, err := e.GetTenantProfileWithClient(tenant.WithTenant(ctx, node.Spec.TenantID), client)
			if err != nil || prof == nil {
				continue
			}
			tIDLower := strings.ToLower(prof.TenantID)
			cleanLegal := strings.ToLower(strings.ReplaceAll(prof.LegalName, " ", ""))
			cleanDomain := strings.ReplaceAll(domainSlug, "_", "")
			if strings.Contains(tIDLower, domainSlug) || (prof.Website != "" && strings.Contains(strings.ToLower(prof.Website), domain)) || (cleanLegal != "" && cleanDomain != "" && (strings.Contains(cleanLegal, cleanDomain) || strings.Contains(cleanDomain, cleanLegal))) {
				return prof, true
			}
		}
	}
	// 2. Check if ANY user exists in the Nexus datamodel with this email domain
	if client != nil {
		allUsers, err := ListUserNodes(ctx, client, "")
		if err == nil {
			for _, u := range allUsers {
				if u != nil && strings.HasSuffix(strings.ToLower(u.Spec.Email), "@"+domain) {
					tCtx := tenant.WithTenant(ctx, u.Spec.TenantID)
					if prof, err := e.GetTenantProfileWithClient(tCtx, client); err == nil && prof != nil {
						return prof, true
					}
					return &TenantProfileModel{
						TenantID:  u.Spec.TenantID,
						LegalName: u.Spec.TenantID,
					}, true
				}
			}
		}
	}

	return nil, false
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
	return listProcessRecords(ctx, GetNexusClient())
}

func (e *NexusGraphEngine) SaveProcess(ctx context.Context, proc *ProcessModel) error {
	return saveProcessRecord(ctx, GetNexusClient(), proc, false)
}

func (e *NexusGraphEngine) DeleteProcess(ctx context.Context, processID string) error {
	return deleteProcessRecord(ctx, GetNexusClient(), processID)
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
	return listReportingPeriodRecords(ctx, GetNexusClient())
}

func (e *NexusGraphEngine) SaveReportingPeriod(ctx context.Context, rp *ReportingPeriodModel) error {
	return saveReportingPeriodRecord(ctx, GetNexusClient(), rp, false)
}

// --- Localisation Operations ---

func (e *NexusGraphEngine) GetLocalisation(ctx context.Context) (*LocalisationModel, error) {
	records, err := listLocalisationRecords(ctx, GetNexusClient())
	if err != nil {
		return nil, err
	}
	if len(records) > 0 {
		return records[0], nil
	}
	return &LocalisationModel{TenantID: workspaceTenant(ctx, ""), DefaultLanguage: "en-GB", DefaultCurrency: "EUR", DefaultTimezone: "UTC+01:00 (CET/Brussels)", DefaultEmissionUnit: "kgCO2e", NumberFormat: "1,234.56", DateFormat: "YYYY-MM-DD"}, nil
}

func (e *NexusGraphEngine) SaveLocalisation(ctx context.Context, loc *LocalisationModel) error {
	return saveLocalisationRecord(ctx, GetNexusClient(), loc, false)
}

// --- Approvals Operations ---

func (e *NexusGraphEngine) ListApprovals(ctx context.Context) ([]*ApprovalModel, error) {
	return listApprovalRecords(ctx, GetNexusClient())
}

func (e *NexusGraphEngine) SaveApproval(ctx context.Context, a *ApprovalModel) error {
	return saveApprovalRecord(ctx, GetNexusClient(), a, false)
}

// --- ACV Verification Operations ---

func (e *NexusGraphEngine) CreateAgency(ctx context.Context, agency *AgencyModel) error {
	return saveVerificationAgencyRecord(ctx, GetNexusClient(), agency, false)
}

func (e *NexusGraphEngine) ListAgencies(ctx context.Context) ([]*AgencyModel, error) {
	return listVerificationAgencyRecords(ctx, GetNexusClient())
}

func (e *NexusGraphEngine) CreateEngagement(ctx context.Context, eng *VerificationEngagementModel) error {
	return saveVerificationEngagementRecord(ctx, GetNexusClient(), eng, false)
}

func (e *NexusGraphEngine) ListEngagements(ctx context.Context) ([]*VerificationEngagementModel, error) {
	return listVerificationEngagementRecords(ctx, GetNexusClient())
}

func (e *NexusGraphEngine) AssignTeamMember(ctx context.Context, m *EngagementTeamMemberModel) error {
	return saveEngagementTeamMemberRecord(ctx, GetNexusClient(), m, false)
}

func (e *NexusGraphEngine) SubmitCOIDeclaration(ctx context.Context, c *COIDeclarationModel) error {
	return saveCOIDeclarationRecord(ctx, GetNexusClient(), c, false)
}

func (e *NexusGraphEngine) CreateFinding(ctx context.Context, f *FindingModel) error {
	return saveFindingRecord(ctx, GetNexusClient(), f, false)
}

func (e *NexusGraphEngine) ListFindings(ctx context.Context, engagementID string) ([]*FindingModel, error) {
	records, err := listFindingRecords(ctx, GetNexusClient())
	if err != nil {
		return nil, err
	}
	result := make([]*FindingModel, 0, len(records))
	for _, record := range records {
		if engagementID == "" || record.EngagementID == engagementID {
			result = append(result, record)
		}
	}
	return result, nil
}

func (e *NexusGraphEngine) SignoffEngagement(ctx context.Context, s *ReviewSignoffModel, frozenBy string) error {
	if err := saveReviewVerdictRecord(ctx, GetNexusClient(), s, false); err != nil {
		return err
	}

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

	if !IsPassportPublic(pNode.Spec.VerificationStatus) {
		return nil, fmt.Errorf("passport not released for public access")
	}
	p := CarbonPassportModelFromNode(pNode)
	opinion := "Unqualified"

	signs, err := listReviewVerdictRecords(tenant.WithTenant(ctx, p.TenantID), client)
	if err != nil {
		return nil, err
	}
	for _, sign := range signs {
		if sign.PassportID == p.PassportID {
			opinion = sign.Opinion
			break
		}
	}

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
