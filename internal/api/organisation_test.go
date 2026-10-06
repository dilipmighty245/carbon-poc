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

	// 1. Login with new user: should create and persist User node in Nexus
	loginReq := map[string]string{
		"email":    "compliance.officer@saurient.demo",
		"password": "secret-password",
	}
	body, _ := json.Marshal(loginReq)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Tenant-ID", "tenant-org-test")
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from login, got %d: %s", rec.Code, rec.Body.String())
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(rec.Body).Decode(&loginResp); err != nil {
		t.Fatalf("failed to decode login response: %v", err)
	}
	if loginResp.User == nil {
		t.Fatal("expected non-nil user in login response")
	}
	if loginResp.User.Email != "compliance.officer@saurient.demo" {
		t.Errorf("expected email compliance.officer@saurient.demo, got %s", loginResp.User.Email)
	}
	if loginResp.Token == "" {
		t.Error("expected non-empty auth token")
	}

	userID := loginResp.User.ID

	// 2. Verify User node was persisted in Nexus graph
	uNode, err := nexus.GetUserNode(context.Background(), client, "tenant-org-test", userID)
	if err != nil || uNode == nil {
		t.Fatalf("expected User node in Nexus graph for %s: %v", userID, err)
	}
	if uNode.Spec.Email != "compliance.officer@saurient.demo" {
		t.Errorf("expected node email compliance.officer@saurient.demo, got %s", uNode.Spec.Email)
	}

	// 3. Second login with same user: should recognize existing user and update lastLogin
	body2, _ := json.Marshal(loginReq)
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body2))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("X-Tenant-ID", "tenant-org-test")
	rec2 := httptest.NewRecorder()
	mux.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from second login, got %d", rec2.Code)
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
