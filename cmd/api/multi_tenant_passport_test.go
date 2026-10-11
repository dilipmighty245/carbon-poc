package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"saurient-platform/build/nexus-client"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/nexus"
)

// TestMultiTenant_PassportIsolationAndSelfHealing verifies that a passport created
// under a tenant (e.g. org_loki) maintains immutable producer ownership through
// verification, signing, and agency submission, even when cross-tenant actors ("all")
// perform actions, and is visible to the organisation and isolated from other tenants.
func TestMultiTenant_PassportIsolationAndSelfHealing(t *testing.T) {
	client := nexus.GetNexusClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	eng := nexus.GetNexusEngine()
	celEng := engine.NewCELEngine()
	rec := nexus.NewProductReconcilerWithClient(client, eng, celEng)
	rec.SetSweepPeriod(50 * time.Millisecond)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	rec.Start(ctx)
	defer rec.Stop()

	srv := &VerificationServer{
		nexusClient: client,
		nexusEngine: eng,
		reconciler:  rec,
	}

	// 1. Create a Product batch under org_loki
	batchID := "CB-2026-LOKI-001"
	lokiTenant := "org_loki"
	createBody := fmt.Sprintf(`{
		"tenant_id": "%s",
		"facility_id": "FAC-LK-001",
		"batch_id": "%s",
		"product_name": "Loki Aluminium Ingot",
		"commodity_type": "Metals & Minerals",
		"activity_data": {
			"fuel_consumed_liters": 1200,
			"electricity_consumed_kwh": 3500,
			"raw_material_kg": 5000,
			"transport_km": 150
		},
		"batch_data": {
			"product_name": "Loki Aluminium Ingot",
			"producer_organization": "Loki",
			"batch_id": "%s"
		}
	}`, lokiTenant, batchID, batchID)

	reqCreate := httptest.NewRequest(http.MethodPost, "/api/v1/products", bytes.NewBufferString(createBody))
	reqCreate.Header.Set("Content-Type", "application/json")
	reqCreate.Header.Set("X-Tenant-ID", lokiTenant)
	rrCreate := httptest.NewRecorder()
	srv.handleCreateProduct(rrCreate, reqCreate)
	if rrCreate.Code != http.StatusCreated {
		t.Fatalf("create product failed: %d: %s", rrCreate.Code, rrCreate.Body.String())
	}

	// Wait for async reconciliation to create draft passport
	var passportID string
	var pNode *nexus_client.RuntimeCarbonPassport
	nClient := srv.getNexusClient()
	for i := 0; i < 40; i++ {
		time.Sleep(50 * time.Millisecond)
		node, err := nexus.GetPassportNodeByBatchID(context.Background(), nClient, batchID)
		if err == nil && node != nil {
			pNode = node
			passportID = node.DisplayName()
			break
		}
	}
	if pNode == nil || passportID == "" {
		t.Fatalf("timed out waiting for draft passport creation for batch %s", batchID)
	}

	// Verify initial tenant ID is org_loki
	if pNode.Spec.TenantID != lokiTenant {
		t.Errorf("expected pNode.Spec.TenantID '%s', got '%s'", lokiTenant, pNode.Spec.TenantID)
	}

	// 2. Operator submits passport for verification with header X-Tenant-ID: org_loki
	submitBody := `{"submitted_by":"Operator Loki","notes":"Ready for verification"}`
	reqSubmit := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/submit", passportID), bytes.NewBufferString(submitBody))
	reqSubmit.Header.Set("Content-Type", "application/json")
	reqSubmit.Header.Set("X-Tenant-ID", lokiTenant)
	reqSubmit.Header.Set("X-User-Role", "Company Operator")
	rrSubmit := httptest.NewRecorder()
	srv.handlePassports(rrSubmit, reqSubmit)
	if rrSubmit.Code != http.StatusOK {
		t.Fatalf("submit failed: %d: %s", rrSubmit.Code, rrSubmit.Body.String())
	}

	// 3. Verifier approves verification using verifier purview header X-Tenant-ID: all
	verifyBody := `{
		"verifier_name": "Bureau Veritas Lead Auditor",
		"agency_name": "Bureau Veritas UK Ltd",
		"assurance_level": "Reasonable Assurance",
		"opinion": "Verified Without Qualification"
	}`
	reqVerify := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/verify", passportID), bytes.NewBufferString(verifyBody))
	reqVerify.Header.Set("Content-Type", "application/json")
	reqVerify.Header.Set("X-Tenant-ID", "all")
	reqVerify.Header.Set("X-User-Role", "Verifier")
	rrVerify := httptest.NewRecorder()
	srv.handlePassports(rrVerify, reqVerify)
	if rrVerify.Code != http.StatusOK {
		t.Fatalf("verify failed: %d: %s", rrVerify.Code, rrVerify.Body.String())
	}

	// 4. Passport Officer signs and issues passport using officer purview header X-Tenant-ID: all
	signBody := `{
		"signer_name": "Chief Sustainability Officer",
		"signer_role": "Passport Officer",
		"key_id": "0xKEY-PROD-LOKI-998811"
	}`
	reqSign := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/sign", passportID), bytes.NewBufferString(signBody))
	reqSign.Header.Set("Content-Type", "application/json")
	reqSign.Header.Set("X-Tenant-ID", "all")
	reqSign.Header.Set("X-User-Role", "Passport Officer")
	rrSign := httptest.NewRecorder()
	srv.handlePassports(rrSign, reqSign)
	if rrSign.Code != http.StatusOK {
		t.Fatalf("sign failed: %d: %s", rrSign.Code, rrSign.Body.String())
	}

	// 5. Submit to Agency with X-Tenant-ID: all
	agencyBody := `{"agency_name":"EU CBAM Registry","declarant_id":"DEC-LOKI-001"}`
	reqAgency := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/api/v1/passports/%s/submit-agency", passportID), bytes.NewBufferString(agencyBody))
	reqAgency.Header.Set("Content-Type", "application/json")
	reqAgency.Header.Set("X-Tenant-ID", "all")
	reqAgency.Header.Set("X-User-Role", "Passport Officer")
	rrAgency := httptest.NewRecorder()
	srv.handlePassports(rrAgency, reqAgency)
	if rrAgency.Code != http.StatusOK {
		t.Fatalf("agency submit failed: %d: %s", rrAgency.Code, rrAgency.Body.String())
	}

	// 6. Query passports with X-Tenant-ID: org_loki -> MUST RETURN the passport
	reqListLoki := httptest.NewRequest(http.MethodGet, "/api/v1/passports", nil)
	reqListLoki.Header.Set("X-Tenant-ID", lokiTenant)
	rrListLoki := httptest.NewRecorder()
	srv.handlePassports(rrListLoki, reqListLoki)
	if rrListLoki.Code != http.StatusOK {
		t.Fatalf("list passports for org_loki failed: %d", rrListLoki.Code)
	}

	var lokiPassports []nexus.RichDigitalCarbonPassportResponse
	if err := json.NewDecoder(rrListLoki.Body).Decode(&lokiPassports); err != nil {
		t.Fatalf("failed to decode loki passports: %v", err)
	}
	if len(lokiPassports) == 0 {
		t.Fatalf("CRITICAL: org_loki query returned 0 passports after verification/submission!")
	}

	found := false
	for _, p := range lokiPassports {
		if p.PassportMetadata.PassportID == passportID {
			found = true
			if p.PassportMetadata.TenantID != lokiTenant {
				t.Errorf("expected passport tenant_id '%s', got '%s'", lokiTenant, p.PassportMetadata.TenantID)
			}
			if p.ProductSummary.ProducerOrganization == "all" {
				t.Errorf("producer organization must NOT be 'all', got '%s'", p.ProductSummary.ProducerOrganization)
			}
			if p.PassportMetadata.Status != "SubmittedToAgency" {
				t.Errorf("expected status 'SubmittedToAgency', got '%s'", p.PassportMetadata.Status)
			}
		}
	}
	if !found {
		t.Fatalf("passport %s not found in org_loki results: %+v", passportID, lokiPassports)
	}

	// 7. Multi-tenant isolation: Query with X-Tenant-ID: org_unrelated -> MUST NOT return Loki's passport
	reqListOther := httptest.NewRequest(http.MethodGet, "/api/v1/passports", nil)
	reqListOther.Header.Set("X-Tenant-ID", "org_unrelated_company")
	rrListOther := httptest.NewRecorder()
	srv.handlePassports(rrListOther, reqListOther)
	if rrListOther.Code != http.StatusOK {
		t.Fatalf("list passports for other tenant failed: %d", rrListOther.Code)
	}
	var otherPassports []nexus.RichDigitalCarbonPassportResponse
	_ = json.NewDecoder(rrListOther.Body).Decode(&otherPassports)
	for _, p := range otherPassports {
		if p.PassportMetadata.PassportID == passportID {
			t.Fatalf("CRITICAL: tenant isolation breach! org_unrelated saw passport %s belonging to org_loki", passportID)
		}
	}

	// 8. Self-Healing test: Corrupt node's Spec.TenantID to "all" in memory to simulate legacy bug
	pNodeFresh, err := nexus.GetPassportNode(context.Background(), nClient, passportID)
	if err != nil || pNodeFresh == nil {
		t.Fatalf("failed to retrieve fresh passport node: %v", err)
	}
	pNodeFresh.Spec.TenantID = "all"
	_ = pNodeFresh.Update(context.Background())

	// Now list for org_loki again -> self-healing must repair it from the linked Product node
	reqHeal := httptest.NewRequest(http.MethodGet, "/api/v1/passports", nil)
	reqHeal.Header.Set("X-Tenant-ID", lokiTenant)
	rrHeal := httptest.NewRecorder()
	srv.handlePassports(rrHeal, reqHeal)
	if rrHeal.Code != http.StatusOK {
		t.Fatalf("self-healing list failed: %d", rrHeal.Code)
	}

	var healedPassports []nexus.RichDigitalCarbonPassportResponse
	_ = json.NewDecoder(rrHeal.Body).Decode(&healedPassports)
	healedFound := false
	for _, p := range healedPassports {
		if p.PassportMetadata.PassportID == passportID {
			healedFound = true
			if p.PassportMetadata.TenantID != lokiTenant {
				t.Errorf("self-healing failed: expected tenant_id '%s', got '%s'", lokiTenant, p.PassportMetadata.TenantID)
			}
		}
	}
	if !healedFound {
		t.Fatalf("self-healing failed: passport %s not recovered for org_loki", passportID)
	}
}
