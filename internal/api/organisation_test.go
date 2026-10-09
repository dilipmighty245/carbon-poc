package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
)

func TestOrganisationHandler_AuthLogin_And_Users(t *testing.T) {
	client := nexus_client.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	engine := nexus.GetNexusEngine()

	handler := NewOrganisationHandlerWithClient(client, engine)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	// 1. Unregistered user login attempt: MUST fail 401 Unauthorized (no auto-seeding or fabrication)
	loginReq := map[string]string{
		"email":    "compliance.officer@saurient.demo",
		"password": "secret-password",
	}
	body, _ := json.Marshal(loginReq)
	reqUnauth := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	reqUnauth.Header.Set("Content-Type", "application/json")
	reqUnauth.Header.Set("X-Tenant-ID", "tenant-org-test")
	recUnauth := httptest.NewRecorder()
	mux.ServeHTTP(recUnauth, reqUnauth)

	if recUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for unregistered user, got %d: %s", recUnauth.Code, recUnauth.Body.String())
	}

	// 2. Register user into Nexus Datamodel via POST /api/v1/auth/register
	regReq := map[string]string{
		"tenant_id": "tenant-org-test",
		"name":      "Compliance Officer",
		"email":     "compliance.officer@saurient.demo",
		"password":  "secret-password",
		"role":      "Compliance Manager",
	}
	regBody, _ := json.Marshal(regReq)
	reqReg := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(regBody))
	reqReg.Header.Set("Content-Type", "application/json")
	recReg := httptest.NewRecorder()
	mux.ServeHTTP(recReg, reqReg)

	if recReg.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created from register, got %d: %s", recReg.Code, recReg.Body.String())
	}

	var regResp LoginResponse
	if err := json.NewDecoder(recReg.Body).Decode(&regResp); err != nil {
		t.Fatalf("failed to decode register response: %v", err)
	}
	if regResp.User == nil || regResp.User.Email != "compliance.officer@saurient.demo" {
		t.Fatalf("unexpected user in register response: %+v", regResp.User)
	}
	if regResp.Token == "" {
		t.Fatal("expected non-empty auth token on register")
	}

	userID := regResp.User.ID

	// 3. Verify User node was persisted in Nexus graph datamodel with secret salt and hash
	uNode, err := nexus.GetUserNode(context.Background(), client, "tenant-org-test", userID)
	if err != nil || uNode == nil {
		t.Fatalf("expected User node in Nexus graph for %s: %v", userID, err)
	}
	if uNode.Spec.Email != "compliance.officer@saurient.demo" {
		t.Errorf("expected node email compliance.officer@saurient.demo, got %s", uNode.Spec.Email)
	}
	if uNode.Spec.PasswordHash == "" || uNode.Spec.Salt == "" {
		t.Errorf("expected datamodel user node to store PasswordHash and Salt secret")
	}

	// 4. Login attempt with WRONG password -> MUST return 401 Unauthorized
	wrongLogin := map[string]string{
		"email":    "compliance.officer@saurient.demo",
		"password": "wrong-password-123",
	}
	wrongBody, _ := json.Marshal(wrongLogin)
	reqWrong := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(wrongBody))
	reqWrong.Header.Set("Content-Type", "application/json")
	reqWrong.Header.Set("X-Tenant-ID", "tenant-org-test")
	recWrong := httptest.NewRecorder()
	mux.ServeHTTP(recWrong, reqWrong)

	if recWrong.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for wrong password, got %d: %s", recWrong.Code, recWrong.Body.String())
	}

	// 5. Login with CORRECT password -> returns 200 OK and valid JWT token
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	reqLogin.Header.Set("Content-Type", "application/json")
	reqLogin.Header.Set("X-Tenant-ID", "tenant-org-test")
	recLogin := httptest.NewRecorder()
	mux.ServeHTTP(recLogin, reqLogin)

	if recLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from valid login, got %d: %s", recLogin.Code, recLogin.Body.String())
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(recLogin.Body).Decode(&loginResp); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}
	if loginResp.User.Email != "compliance.officer@saurient.demo" {
		t.Errorf("expected email compliance.officer@saurient.demo, got %s", loginResp.User.Email)
	}

	// 6. Inspect current session via GET /api/v1/auth/me with Bearer token
	reqMe := httptest.NewRequest(http.MethodGet, "/api/v1/auth/me", nil)
	reqMe.Header.Set("Authorization", "Bearer "+loginResp.Token)
	reqMe.Header.Set("X-Tenant-ID", "tenant-org-test")
	recMe := httptest.NewRecorder()
	mux.ServeHTTP(recMe, reqMe)

	if recMe.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from /auth/me, got %d: %s", recMe.Code, recMe.Body.String())
	}

	// 4. List Users via GET /api/v1/organisation/users
	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/organisation/users", nil)
	reqList.Header.Set("X-Tenant-ID", "tenant-org-test")
	recList := httptest.NewRecorder()
	mux.ServeHTTP(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from list users, got %d", recList.Code)
	}
	var users []*nexus.OrganisationUserModel
	if err := json.NewDecoder(recList.Body).Decode(&users); err != nil {
		t.Fatalf("failed to decode list users: %v", err)
	}
	if len(users) == 0 {
		t.Fatal("expected at least 1 user in list")
	}

	// 5. Update User Role via POST /api/v1/organisation/users/role
	roleReq := map[string]string{
		"userId":  userID,
		"newRole": "Lead Auditor",
	}
	roleBody, _ := json.Marshal(roleReq)
	reqRole := httptest.NewRequest(http.MethodPost, "/api/v1/organisation/users/role", bytes.NewBuffer(roleBody))
	reqRole.Header.Set("Content-Type", "application/json")
	reqRole.Header.Set("X-Tenant-ID", "tenant-org-test")
	recRole := httptest.NewRecorder()
	mux.ServeHTTP(recRole, reqRole)

	if recRole.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from update role, got %d: %s", recRole.Code, recRole.Body.String())
	}

	// Verify role updated in graph
	updatedNode, _ := nexus.GetUserNode(context.Background(), client, "tenant-org-test", userID)
	if updatedNode == nil || updatedNode.Spec.Role != "Lead Auditor" {
		t.Errorf("expected role Lead Auditor, got %+v", updatedNode)
	}
}

func TestOrganisationHandler_AddUserInOrganisation_And_AssignRole(t *testing.T) {
	client := nexus_client.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	engine := nexus.GetNexusEngine()

	handler := NewOrganisationHandlerWithClient(client, engine)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	tenantID := "tenant-ghana-cocoa"

	// 1. Add team member to organisation via POST /api/v1/organisation/users
	newUserReq := map[string]interface{}{
		"name":           "Kwame Asante",
		"email":          "k.asante@ghana-cocoa.org",
		"password":       "KwamePassword2026!",
		"role":           "Data Operator",
		"facility_scope": "Kumasi Facility",
	}
	body, _ := json.Marshal(newUserReq)
	reqAdd := httptest.NewRequest(http.MethodPost, "/api/v1/organisation/users", bytes.NewBuffer(body))
	reqAdd.Header.Set("Content-Type", "application/json")
	reqAdd.Header.Set("X-Tenant-ID", tenantID)
	recAdd := httptest.NewRecorder()
	mux.ServeHTTP(recAdd, reqAdd)

	if recAdd.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from add user, got %d: %s", recAdd.Code, recAdd.Body.String())
	}

	var createdUser nexus.OrganisationUserModel
	if err := json.NewDecoder(recAdd.Body).Decode(&createdUser); err != nil {
		t.Fatalf("failed to decode created user: %v", err)
	}
	if createdUser.Email != "k.asante@ghana-cocoa.org" || createdUser.Role != "Data Operator" {
		t.Fatalf("unexpected created user: %+v", createdUser)
	}

	// 2. Authenticate the newly added organisation user via POST /api/v1/auth/login
	loginReq := map[string]string{
		"email":    "k.asante@ghana-cocoa.org",
		"password": "KwamePassword2026!",
	}
	loginBody, _ := json.Marshal(loginReq)
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	reqLogin.Header.Set("Content-Type", "application/json")
	reqLogin.Header.Set("X-Tenant-ID", tenantID)
	recLogin := httptest.NewRecorder()
	mux.ServeHTTP(recLogin, reqLogin)

	if recLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for newly added organisation user login, got %d: %s", recLogin.Code, recLogin.Body.String())
	}

	var loginResp LoginResponse
	_ = json.NewDecoder(recLogin.Body).Decode(&loginResp)
	if loginResp.User.Role != "Data Operator" {
		t.Errorf("expected role Data Operator, got %s", loginResp.User.Role)
	}

	// 3. Assign new role via PUT /api/v1/organisation/users/role using snake_case wire format
	assignRoleReq := map[string]string{
		"user_id": createdUser.ID,
		"role":    "Carbon Manager",
	}
	roleBody, _ := json.Marshal(assignRoleReq)
	reqAssign := httptest.NewRequest(http.MethodPut, "/api/v1/organisation/users/role", bytes.NewBuffer(roleBody))
	reqAssign.Header.Set("Content-Type", "application/json")
	reqAssign.Header.Set("X-Tenant-ID", tenantID)
	recAssign := httptest.NewRecorder()
	mux.ServeHTTP(recAssign, reqAssign)

	if recAssign.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from role update, got %d: %s", recAssign.Code, recAssign.Body.String())
	}

	// 4. Verify role is reflected in graph datamodel
	uNode, err := nexus.GetUserNode(context.Background(), client, tenantID, createdUser.ID)
	if err != nil || uNode == nil {
		t.Fatalf("failed to fetch user node after role update: %v", err)
	}
	if uNode.Spec.Role != "Carbon Manager" {
		t.Errorf("expected role Carbon Manager in datamodel, got %s", uNode.Spec.Role)
	}
}

func TestOrganisationHandler_Facilities_DynamicTelemetry_And_SattricMeters(t *testing.T) {
	client := nexus_client.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	engine := nexus.GetNexusEngine()

	handler := NewOrganisationHandlerWithClient(client, engine)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	tenantID := "tenant-dynamic-telemetry-test"

	// 1. Initial State: Newly onboarded tenant must start at 0 facilities, 0 connected meters
	reqZero := httptest.NewRequest(http.MethodGet, "/api/v1/organisation/facilities", nil)
	reqZero.Header.Set("X-Tenant-ID", tenantID)
	recZero := httptest.NewRecorder()
	mux.ServeHTTP(recZero, reqZero)

	if recZero.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from zero-state facilities, got %d: %s", recZero.Code, recZero.Body.String())
	}
	var zeroFacs []*nexus.FacilityModel
	if err := json.NewDecoder(recZero.Body).Decode(&zeroFacs); err != nil {
		t.Fatalf("failed to decode zero facilities: %v", err)
	}
	if len(zeroFacs) != 0 {
		t.Fatalf("expected 0 facilities for new tenant, got %d", len(zeroFacs))
	}

	// 2. Add Facility 1: Automatically connects 1 Sattric meter
	fac1Req := map[string]interface{}{
		"id":           "FAC-GH-001",
		"name":         "Tema Processing Plant",
		"type":         "Production Facility",
		"country":      "Ghana",
		"country_code": "GH",
		"address":      "Heavy Industrial Area, Tema, Ghana",
	}
	body1, _ := json.Marshal(fac1Req)
	reqAdd1 := httptest.NewRequest(http.MethodPost, "/api/v1/organisation/facilities", bytes.NewBuffer(body1))
	reqAdd1.Header.Set("Content-Type", "application/json")
	reqAdd1.Header.Set("X-Tenant-ID", tenantID)
	recAdd1 := httptest.NewRecorder()
	mux.ServeHTTP(recAdd1, reqAdd1)

	if recAdd1.Code != http.StatusOK {
		t.Fatalf("expected 200 OK adding facility 1, got %d: %s", recAdd1.Code, recAdd1.Body.String())
	}

	// Verify child Meter node created under Facility node in Nexus graph
	f1Node, err := nexus.GetFacilityNode(context.Background(), client, tenantID, "FAC-GH-001")
	if err != nil || f1Node == nil {
		t.Fatalf("failed to get facility 1 node from nexus graph: %v", err)
	}
	meters1, err := f1Node.GetAllMeters(context.Background())
	if err != nil || len(meters1) != 1 {
		t.Fatalf("expected 1 Sattric meter connected under facility 1 in Nexus datamodel, got %d (err: %v)", len(meters1), err)
	}
	if meters1[0].Spec.MeterType != "Sattric IoT Telemetry" {
		t.Errorf("expected meter type 'Sattric IoT Telemetry', got %s", meters1[0].Spec.MeterType)
	}

	// 3. Add Facility 2: Automatically connects another Sattric meter
	fac2Req := map[string]interface{}{
		"id":           "FAC-GH-002",
		"name":         "Kumasi Materials Hub",
		"type":         "Aggregation Warehouse",
		"country":      "Ghana",
		"country_code": "GH",
		"address":      "Boankra Inland Port Zone, Kumasi, Ghana",
	}
	body2, _ := json.Marshal(fac2Req)
	reqAdd2 := httptest.NewRequest(http.MethodPost, "/api/v1/organisation/facilities", bytes.NewBuffer(body2))
	reqAdd2.Header.Set("Content-Type", "application/json")
	reqAdd2.Header.Set("X-Tenant-ID", tenantID)
	recAdd2 := httptest.NewRecorder()
	mux.ServeHTTP(recAdd2, reqAdd2)

	if recAdd2.Code != http.StatusOK {
		t.Fatalf("expected 200 OK adding facility 2, got %d: %s", recAdd2.Code, recAdd2.Body.String())
	}

	// 4. List Facilities: Must return 2 facilities, each with 1 Sattric meter and initial zero emissions
	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/organisation/facilities", nil)
	reqList.Header.Set("X-Tenant-ID", tenantID)
	recList := httptest.NewRecorder()
	mux.ServeHTTP(recList, reqList)

	if recList.Code != http.StatusOK {
		t.Fatalf("expected 200 OK listing facilities, got %d: %s", recList.Code, recList.Body.String())
	}
	var facList []*nexus.FacilityModel
	if err := json.NewDecoder(recList.Body).Decode(&facList); err != nil {
		t.Fatalf("failed to decode facility list: %v", err)
	}
	if len(facList) != 2 {
		t.Fatalf("expected 2 facilities in list, got %d", len(facList))
	}

	totalTelemetryMeters := 0
	for _, f := range facList {
		totalTelemetryMeters += f.DevicesCount
		if f.Emissions != "0 tCO₂e" {
			t.Errorf("expected initial emissions '0 tCO₂e', got %s", f.Emissions)
		}
	}
	if totalTelemetryMeters != 2 {
		t.Fatalf("expected 2 connected Sattric meters across 2 facilities, got %d", totalTelemetryMeters)
	}

	// 5. Delete Facility 1: Telemetry meters and facilities decrement
	reqDel := httptest.NewRequest(http.MethodDelete, "/api/v1/organisation/facilities/FAC-GH-001", nil)
	reqDel.Header.Set("X-Tenant-ID", tenantID)
	recDel := httptest.NewRecorder()
	mux.ServeHTTP(recDel, reqDel)

	if recDel.Code != http.StatusOK {
		t.Fatalf("expected 200 OK deleting facility, got %d: %s", recDel.Code, recDel.Body.String())
	}

	// Verify only 1 facility remains
	reqListAfter := httptest.NewRequest(http.MethodGet, "/api/v1/organisation/facilities", nil)
	reqListAfter.Header.Set("X-Tenant-ID", tenantID)
	recListAfter := httptest.NewRecorder()
	mux.ServeHTTP(recListAfter, reqListAfter)

	var facListAfter []*nexus.FacilityModel
	_ = json.NewDecoder(recListAfter.Body).Decode(&facListAfter)
	if len(facListAfter) != 1 {
		t.Fatalf("expected 1 facility remaining after deletion, got %d", len(facListAfter))
	}
	if facListAfter[0].DevicesCount != 1 {
		t.Fatalf("expected 1 connected Sattric meter remaining, got %d", facListAfter[0].DevicesCount)
	}
}

func TestOrganisationHandler_SystemReset(t *testing.T) {
	client := nexus_client.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	engine := nexus.GetNexusEngine()

	handler := NewOrganisationHandlerWithClient(client, engine)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	// Save profile to create state
	profReq := map[string]interface{}{
		"legal_name": "Loki Pvt Ltd",
		"tax_id":     "TAX-999",
	}
	body, _ := json.Marshal(profReq)
	reqSave := httptest.NewRequest(http.MethodPut, "/api/v1/organisation/profile", bytes.NewBuffer(body))
	reqSave.Header.Set("Content-Type", "application/json")
	reqSave.Header.Set("X-Tenant-ID", "tenant-to-reset")
	recSave := httptest.NewRecorder()
	mux.ServeHTTP(recSave, reqSave)
	if recSave.Code != http.StatusOK {
		t.Fatalf("expected 200 OK saving profile, got %d", recSave.Code)
	}

	// Trigger System Reset via POST /api/v1/system/reset
	reqReset := httptest.NewRequest(http.MethodPost, "/api/v1/system/reset", nil)
	recReset := httptest.NewRecorder()
	mux.ServeHTTP(recReset, reqReset)
	if recReset.Code != http.StatusOK {
		t.Fatalf("expected 200 OK resetting system, got %d: %s", recReset.Code, recReset.Body.String())
	}

	// Assert the profile for tenant-to-reset was cleared of custom data
	reqGet := httptest.NewRequest(http.MethodGet, "/api/v1/organisation/profile", nil)
	reqGet.Header.Set("X-Tenant-ID", "tenant-to-reset")
	recGet := httptest.NewRecorder()
	mux.ServeHTTP(recGet, reqGet)
	if recGet.Code != http.StatusOK {
		t.Fatalf("expected 200 OK after reset, got %d", recGet.Code)
	}
	var profAfter nexus.TenantProfileModel
	_ = json.NewDecoder(recGet.Body).Decode(&profAfter)
	if profAfter.TaxID == "TAX-999" || profAfter.LegalName == "Loki Pvt Ltd" {
		t.Fatalf("expected custom profile data to be wiped after reset, got %+v", profAfter)
	}
}

func TestOrganisationHandler_AccountOwner_OrganisationAdmin_And_TeamProvisioning(t *testing.T) {
	client := nexus_client.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	engine := nexus.GetNexusEngine()

	handler := NewOrganisationHandlerWithClient(client, engine)
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	tenantID := "tenant-omega-steel"

	// 1. Register Account Owner for new organisation -> role must be "Organisation Admin"
	regPayload := map[string]string{
		"tenant_id": tenantID,
		"name":      "Santosh Samudrala",
		"email":     "santosh@omega-steel.com",
		"password":  "OwnerSecurePassword2026!",
		"role":      "Organisation Admin",
	}
	body, _ := json.Marshal(regPayload)
	reqReg := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
	reqReg.Header.Set("Content-Type", "application/json")
	recReg := httptest.NewRecorder()
	mux.ServeHTTP(recReg, reqReg)

	if recReg.Code != http.StatusCreated {
		t.Fatalf("expected 201 Created for account owner registration, got %d: %s", recReg.Code, recReg.Body.String())
	}

	var regResp LoginResponse
	if err := json.NewDecoder(recReg.Body).Decode(&regResp); err != nil {
		t.Fatalf("failed to decode register response: %v", err)
	}
	if regResp.User.Role != "Organisation Admin" {
		t.Fatalf("expected role 'Organisation Admin' for account owner, got '%s'", regResp.User.Role)
	}

	// 2. Verify account owner credentials can log in via POST /api/v1/auth/login
	loginPayload := map[string]string{
		"email":    "santosh@omega-steel.com",
		"password": "OwnerSecurePassword2026!",
	}
	loginBody, _ := json.Marshal(loginPayload)
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	reqLogin.Header.Set("Content-Type", "application/json")
	reqLogin.Header.Set("X-Tenant-ID", tenantID)
	recLogin := httptest.NewRecorder()
	mux.ServeHTTP(recLogin, reqLogin)

	if recLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 OK logging in as Organisation Admin, got %d: %s", recLogin.Code, recLogin.Body.String())
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(recLogin.Body).Decode(&loginResp); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}
	if loginResp.User.Role != "Organisation Admin" {
		t.Fatalf("expected logged in user role 'Organisation Admin', got '%s'", loginResp.User.Role)
	}

	// 3. Logged-in Organisation Admin uses credentials to create a new team member
	newMemberPayload := map[string]interface{}{
		"name":           "Alex Rivera",
		"email":          "a.rivera@omega-steel.com",
		"password":       "AlexPassword2026!",
		"role":           "Data Operator",
		"facility_scope": "Blast Furnace Line 1",
	}
	memberBody, _ := json.Marshal(newMemberPayload)
	reqAddMember := httptest.NewRequest(http.MethodPost, "/api/v1/organisation/users", bytes.NewBuffer(memberBody))
	reqAddMember.Header.Set("Content-Type", "application/json")
	reqAddMember.Header.Set("X-Tenant-ID", tenantID)
	reqAddMember.Header.Set("Authorization", "Bearer "+loginResp.Token)
	recAddMember := httptest.NewRecorder()
	mux.ServeHTTP(recAddMember, reqAddMember)

	if recAddMember.Code != http.StatusOK {
		t.Fatalf("expected 200 OK creating new member, got %d: %s", recAddMember.Code, recAddMember.Body.String())
	}

	var createdMember nexus.OrganisationUserModel
	if err := json.NewDecoder(recAddMember.Body).Decode(&createdMember); err != nil {
		t.Fatalf("failed to decode created member: %v", err)
	}
	if createdMember.Email != "a.rivera@omega-steel.com" || createdMember.Role != "Data Operator" {
		t.Fatalf("unexpected member created: %+v", createdMember)
	}

	// 4. Organisation Admin updates the member's role to "Compliance Manager"
	roleUpdatePayload := map[string]string{
		"userId":  createdMember.ID,
		"newRole": "Compliance Manager",
	}
	roleBody, _ := json.Marshal(roleUpdatePayload)
	reqRoleUpdate := httptest.NewRequest(http.MethodPost, "/api/v1/organisation/users/role", bytes.NewBuffer(roleBody))
	reqRoleUpdate.Header.Set("Content-Type", "application/json")
	reqRoleUpdate.Header.Set("X-Tenant-ID", tenantID)
	reqRoleUpdate.Header.Set("Authorization", "Bearer "+loginResp.Token)
	recRoleUpdate := httptest.NewRecorder()
	mux.ServeHTTP(recRoleUpdate, reqRoleUpdate)

	if recRoleUpdate.Code != http.StatusOK {
		t.Fatalf("expected 200 OK updating role, got %d: %s", recRoleUpdate.Code, recRoleUpdate.Body.String())
	}

	// 5. Verify the created member can now log in with their credentials and has "Compliance Manager" role
	memberLoginPayload := map[string]string{
		"email":    "a.rivera@omega-steel.com",
		"password": "AlexPassword2026!",
	}
	memberLoginBody, _ := json.Marshal(memberLoginPayload)
	reqMemberLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(memberLoginBody))
	reqMemberLogin.Header.Set("Content-Type", "application/json")
	reqMemberLogin.Header.Set("X-Tenant-ID", tenantID)
	recMemberLogin := httptest.NewRecorder()
	mux.ServeHTTP(recMemberLogin, reqMemberLogin)

	if recMemberLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for member login, got %d: %s", recMemberLogin.Code, recMemberLogin.Body.String())
	}

	var memberLoginResp LoginResponse
	if err := json.NewDecoder(recMemberLogin.Body).Decode(&memberLoginResp); err != nil {
		t.Fatalf("failed to decode member login response: %v", err)
	}
	if memberLoginResp.User.Role != "Compliance Manager" {
		t.Fatalf("expected member role 'Compliance Manager', got '%s'", memberLoginResp.User.Role)
	}
}


