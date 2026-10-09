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

