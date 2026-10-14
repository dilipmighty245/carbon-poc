package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/tenant"
)

func registrationFixture() OrganisationRegistrationRequest {
	return OrganisationRegistrationRequest{
		Owner: RegisterRequest{Name: "Organisation Owner", Email: "owner@example.test", Password: " secret123 "},
		Profile: nexus.TenantProfileModel{LegalName: "Example Manufacturing", RegistrationNumber: "REG-001",
			CountryOfIncorporation: "India", TaxID: "TAX-001", RegisteredAddress: "42 Example Road",
			Boundary:   json.RawMessage(`{"baseYear":"2026","reportingCurrency":"EUR"}`),
			Onboarding: json.RawMessage(`{"vatNumber":"VAT-001","incorporationDate":"2020-01-01"}`)},
		Declarations: RegistrationDeclarations{OrganisationDetails: true, DataAccuracy: true},
	}
}

type registrationTestStore struct {
	profiles []*nexus.TenantProfileModel
	users    []*nexus.OrganisationUserModel
	fail     string
	saves    int
	deleted  bool
}

func (s *registrationTestStore) Profiles(context.Context) ([]*nexus.TenantProfileModel, error) {
	if s.fail == "lookup" {
		return nil, errors.New("storage unavailable")
	}
	return s.profiles, nil
}
func (s *registrationTestStore) Users(context.Context) ([]*nexus.OrganisationUserModel, error) {
	return s.users, nil
}
func (s *registrationTestStore) SaveProfile(_ context.Context, p *nexus.TenantProfileModel) error {
	s.saves++
	if (s.fail == "profile" && s.saves == 1) || (s.fail == "finalize" && s.saves == 2) {
		return errors.New("write failed")
	}
	copy := *p
	s.profiles = []*nexus.TenantProfileModel{&copy}
	return nil
}
func (s *registrationTestStore) CreateOwner(_ context.Context, spec inventoryv1.UserSpec) error {
	if s.fail == "owner" || s.fail == "cleanup" {
		return errors.New("owner write failed")
	}
	s.users = []*nexus.OrganisationUserModel{{ID: spec.UserID, TenantID: spec.TenantID, Email: spec.Email}}
	return nil
}
func (s *registrationTestStore) DeleteRegistration(context.Context, string) error {
	if s.fail == "cleanup" {
		return errors.New("delete failed")
	}
	s.deleted = true
	s.profiles = nil
	s.users = nil
	return nil
}

func TestOrganisationRegistrationRollback(t *testing.T) {
	for _, stage := range []string{"profile", "owner", "finalize"} {
		t.Run(stage, func(t *testing.T) {
			store := &registrationTestStore{fail: stage}
			response, status, err := registerOrganisation(context.Background(), store, registrationFixture())
			if err == nil || response != nil || status != 500 || !store.deleted || len(store.users) != 0 || len(store.profiles) != 0 {
				t.Fatalf("failed registration left state or returned success: status=%d, err=%v, store=%+v", status, err, store)
			}
		})
	}
	t.Run("cleanup failure is explicit", func(t *testing.T) {
		store := &registrationTestStore{fail: "cleanup"}
		_, status, err := registerOrganisation(context.Background(), store, registrationFixture())
		if status != 500 || err == nil || !strings.Contains(err.Error(), "cleanup requires support") {
			t.Fatalf("cleanup failure hidden: %v", err)
		}
	})
}

func TestOrganisationRegistrationValidationAndDuplicates(t *testing.T) {
	for _, name := range []string{"short password", "invalid email", "missing country", "unchecked declarations", "duplicate email", "duplicate legal identity", "lookup failure"} {
		t.Run(name, func(t *testing.T) {
			req := registrationFixture()
			store := &registrationTestStore{}
			want := 400
			switch name {
			case "short password":
				req.Owner.Password = "abc"
			case "invalid email":
				req.Owner.Email = "not-an-email"
			case "missing country":
				req.Profile.CountryOfIncorporation = ""
			case "unchecked declarations":
				req.Declarations.DataAccuracy = false
			case "duplicate email":
				store.users = []*nexus.OrganisationUserModel{{Email: "OWNER@EXAMPLE.TEST", TenantID: "another-tenant"}}
				want = 409
			case "duplicate legal identity":
				store.profiles = []*nexus.TenantProfileModel{&req.Profile}
				want = 409
			case "lookup failure":
				store.fail = "lookup"
				want = 503
			}
			_, status, err := registerOrganisation(context.Background(), store, req)
			if status != want || err == nil || store.saves != 0 || store.deleted {
				t.Fatalf("validation wrote data: status=%d err=%v", status, err)
			}
		})
	}
}

func TestOrganisationRegistrationPersistenceAndFreshLogin(t *testing.T) {
	client := nexusclient.NewFakeClient()
	_, _ = nexus.EnsureGraphRoots(context.Background(), client)
	engine := nexus.GetNexusEngine()
	h := NewOrganisationHandlerWithClient(client, engine)
	req := registrationFixture()
	req.Owner.Role = "Passport Officer" // The public endpoint must ignore requested privileges.
	req.Profile.TenantID = "existing-tenant"
	req.Profile.Verification = json.RawMessage(`{"provider":"fabricated"}`)
	response, status, err := registerOrganisation(context.Background(), nexusRegistrationStore{h}, req)
	if err != nil || status != 201 {
		t.Fatalf("registration failed: %d %v", status, err)
	}
	if response.TenantID == req.Profile.TenantID || response.User.TenantID != response.TenantID || response.Profile.TenantID != response.TenantID || response.User.Role != "Organisation Owner" {
		t.Fatalf("invalid account identity: %+v", response)
	}
	if response.Profile.Status != "Pending Verification" || string(response.Profile.Verification) != "{}" {
		t.Fatal("registration fabricated verification")
	}
	engine.ForgetTenantProfile(response.TenantID)
	freshHandler := NewOrganisationHandlerWithClient(client, engine)
	profile, err := engine.GetTenantProfileWithClient(tenant.WithTenant(context.Background(), response.TenantID), client)
	if err != nil || profile.TaxID != req.Profile.TaxID || profile.RegistrationNumber != req.Profile.RegistrationNumber || string(profile.Boundary) != string(req.Profile.Boundary) || string(profile.Onboarding) != string(req.Profile.Onboarding) {
		t.Fatalf("full profile was not persisted: %+v %v", profile, err)
	}
	body, _ := json.Marshal(LoginRequest{Email: req.Owner.Email, Password: req.Owner.Password})
	login := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	recorder := httptest.NewRecorder()
	freshHandler.HandleAuthLogin(recorder, login)
	if recorder.Code != 200 {
		t.Fatalf("fresh-session login failed: %s", recorder.Body.String())
	}
	var loggedIn LoginResponse
	_ = json.Unmarshal(recorder.Body.Bytes(), &loggedIn)
	if loggedIn.TenantID != response.TenantID {
		t.Fatal("login changed tenant")
	}
	profile.Status = "Registration Pending"
	if err := engine.SaveTenantProfileWithClient(tenant.WithTenant(context.Background(), response.TenantID), client, profile); err != nil {
		t.Fatal(err)
	}
	interrupted := httptest.NewRecorder()
	freshHandler.HandleAuthLogin(interrupted, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body)))
	if interrupted.Code != 503 {
		t.Fatal("interrupted registration was allowed to log in")
	}
	if _, err := nexus.GetUserNodeByEmail(context.Background(), client, "wrong-tenant", req.Owner.Email); err == nil {
		t.Fatal("scoped lookup returned another tenant's user")
	}
	// Same display name with a distinct legal identity must get a distinct server ID.
	req.Owner.Email = "other@example.test"
	req.Profile.RegistrationNumber = "REG-002"
	other, _, err := registerOrganisation(context.Background(), nexusRegistrationStore{h}, req)
	if err != nil || other.TenantID == response.TenantID {
		t.Fatalf("company names collided: %v", err)
	}
}

func TestOrganisationProfileRejectsMalformedPayload(t *testing.T) {
	h := NewOrganisationHandlerWithClient(nexusclient.NewFakeClient(), nexus.GetNexusEngine())
	for _, payload := range []string{`{broken`, `null`, `{}`} {
		rec := httptest.NewRecorder()
		h.HandleProfile(rec, httptest.NewRequest(http.MethodPut, "/api/v1/organisation/profile", strings.NewReader(payload)))
		if rec.Code != 400 {
			t.Fatalf("accepted invalid profile %q: %d", payload, rec.Code)
		}
	}
}

func TestOrganisationProfileCannotOverwriteAnotherTenant(t *testing.T) {
	client := nexusclient.NewFakeClient()
	h := NewOrganisationHandlerWithClient(client, nexus.GetNexusEngine())
	for _, tc := range []struct {
		name, tenantID, role string
		want                 int
	}{
		{"anonymous", "", "", 401},
		{"other tenant", "org-other", "Organisation Owner", 403},
		{"operator", "org-target", "Company Operator", 403},
		{"owner", "org-target", "Organisation Owner", 200},
	} {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPut, "/api/v1/organisation/profile", strings.NewReader(`{"legalName":"Target Organisation"}`))
			req.Header.Set("X-Tenant-ID", "org-target")
			if tc.role != "" {
				token, _ := GenerateToken(&nexus.OrganisationUserModel{TenantID: tc.tenantID, Role: tc.role})
				req.Header.Set("Authorization", "Bearer "+token)
			}
			rec := httptest.NewRecorder()
			h.HandleProfile(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("got %d: %s", rec.Code, rec.Body.String())
			}
		})
	}
}
