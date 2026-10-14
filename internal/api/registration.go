package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/mail"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/tenant"
)

// Serialize duplicate checks and registration writes within this API process.
// Kubernetes does not support a transaction spanning Tenant and User resources.
var registrationMu sync.Mutex

type RegistrationDeclarations struct {
	OrganisationDetails bool `json:"organisationDetails"`
	DataAccuracy        bool `json:"dataAccuracy"`
}

type OrganisationRegistrationRequest struct {
	Profile      nexus.TenantProfileModel `json:"profile"`
	Owner        RegisterRequest          `json:"owner"`
	Declarations RegistrationDeclarations `json:"declarations"`
}

type OrganisationRegistrationResponse struct {
	LoginResponse
	Profile *nexus.TenantProfileModel `json:"profile"`
}

type registrationStore interface {
	Profiles(context.Context) ([]*nexus.TenantProfileModel, error)
	Users(context.Context) ([]*nexus.OrganisationUserModel, error)
	SaveProfile(context.Context, *nexus.TenantProfileModel) error
	CreateOwner(context.Context, inventoryv1.UserSpec) error
	DeleteRegistration(context.Context, string) error
}

type nexusRegistrationStore struct{ handler *OrganisationHandler }

func (s nexusRegistrationStore) Profiles(ctx context.Context) ([]*nexus.TenantProfileModel, error) {
	nodes, err := s.handler.client.Inventory().ListTenants(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	profiles := make([]*nexus.TenantProfileModel, 0, len(nodes))
	for _, node := range nodes {
		p := &nexus.TenantProfileModel{TenantID: node.Spec.TenantID, LegalName: node.Spec.LegalName, CountryOfIncorporation: node.Spec.Country}
		if node.Spec.ProfileRaw != "" {
			if err := json.Unmarshal([]byte(node.Spec.ProfileRaw), p); err != nil {
				return nil, fmt.Errorf("invalid stored profile: %w", err)
			}
		}
		profiles = append(profiles, p)
	}
	return profiles, nil
}

func (s nexusRegistrationStore) Users(ctx context.Context) ([]*nexus.OrganisationUserModel, error) {
	nodes, err := s.handler.client.Inventory().ListUsers(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	users := make([]*nexus.OrganisationUserModel, 0, len(nodes))
	for _, node := range nodes {
		users = append(users, nexus.UserModelFromNode(node))
	}
	return users, nil
}

func (s nexusRegistrationStore) SaveProfile(ctx context.Context, p *nexus.TenantProfileModel) error {
	return s.handler.engine.SaveTenantProfileWithClient(tenant.WithTenant(ctx, p.TenantID), s.handler.client, p)
}

func (s nexusRegistrationStore) CreateOwner(ctx context.Context, spec inventoryv1.UserSpec) error {
	_, err := nexus.CreateUserNode(ctx, s.handler.client, spec.TenantID, spec)
	return err
}

func (s nexusRegistrationStore) DeleteRegistration(ctx context.Context, tenantID string) error {
	root, err := nexus.EnsureGraphRoots(ctx, s.handler.client)
	if err != nil {
		return err
	}
	inv, err := root.GetInventory(ctx)
	if err != nil {
		return err
	}
	// Recursive delete also removes any owner created before a later write failed.
	err = inv.DeleteTenants(ctx, tenantID)
	if err != nil && !nexusclient.IsChildNotFound(err) && !nexusclient.IsNotFound(err) {
		return err
	}
	s.handler.engine.ForgetTenantProfile(tenantID)
	return nil
}

func validateRegistration(req *OrganisationRegistrationRequest) string {
	req.Owner.Name = strings.TrimSpace(req.Owner.Name)
	req.Owner.Email = strings.ToLower(strings.TrimSpace(req.Owner.Email))
	p := &req.Profile
	p.LegalName = strings.TrimSpace(p.LegalName)
	p.RegistrationNumber = strings.TrimSpace(p.RegistrationNumber)
	p.CountryOfIncorporation = strings.TrimSpace(p.CountryOfIncorporation)
	if req.Owner.Name == "" {
		return "account owner name is required"
	}
	address, err := mail.ParseAddress(req.Owner.Email)
	if err != nil || address.Address != req.Owner.Email || !strings.Contains(req.Owner.Email, "@") {
		return "a valid work email is required"
	}
	if len(req.Owner.Password) < 6 || strings.TrimSpace(req.Owner.Password) == "" {
		return "password must be at least 6 characters"
	}
	if p.LegalName == "" || p.RegistrationNumber == "" || p.CountryOfIncorporation == "" {
		return "legal name, registration number, and country of incorporation are required"
	}
	if !req.Declarations.OrganisationDetails || !req.Declarations.DataAccuracy {
		return "both registration declarations must be accepted"
	}
	return ""
}

func registerOrganisation(ctx context.Context, store registrationStore, req OrganisationRegistrationRequest) (*OrganisationRegistrationResponse, int, error) {
	if msg := validateRegistration(&req); msg != "" {
		return nil, http.StatusBadRequest, fmt.Errorf("%s", msg)
	}
	registrationMu.Lock()
	defer registrationMu.Unlock()
	users, err := store.Users(ctx)
	if err != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("cannot check existing accounts: %w", err)
	}
	for _, user := range users {
		if strings.EqualFold(user.Email, req.Owner.Email) {
			return nil, http.StatusConflict, fmt.Errorf("an account with this email already exists; sign in or use another email")
		}
	}
	profiles, err := store.Profiles(ctx)
	if err != nil {
		return nil, http.StatusServiceUnavailable, fmt.Errorf("cannot check existing organisations: %w", err)
	}
	for _, profile := range profiles {
		if strings.EqualFold(strings.TrimSpace(profile.RegistrationNumber), req.Profile.RegistrationNumber) && strings.EqualFold(strings.TrimSpace(profile.CountryOfIncorporation), req.Profile.CountryOfIncorporation) {
			return nil, http.StatusConflict, fmt.Errorf("an organisation with this registration number and country already exists")
		}
	}
	p := req.Profile
	p.TenantID = "org_" + uuid.NewString()
	p.OrganisationID = p.TenantID
	if p.TradingName == "" {
		p.TradingName = p.LegalName
	}
	p.Verification = json.RawMessage(`{}`)
	p.Status = "Registration Pending"
	p.Declarations, _ = json.Marshal(struct {
		RegistrationDeclarations
		AcceptedAt time.Time `json:"acceptedAt"`
	}{req.Declarations, time.Now().UTC()})
	// The primary contact is the owner actually provisioned by this operation.
	var contact map[string]interface{}
	_ = json.Unmarshal(p.PrimaryContact, &contact)
	if contact == nil {
		contact = map[string]interface{}{}
	}
	contact["name"], contact["email"], contact["title"] = req.Owner.Name, req.Owner.Email, "Organisation Owner"
	p.PrimaryContact, _ = json.Marshal(contact)
	salt := GenerateSalt()
	spec := inventoryv1.UserSpec{UserID: "usr-" + uuid.NewString(), TenantID: p.TenantID,
		Name: req.Owner.Name, Email: req.Owner.Email, PasswordHash: HashPassword(req.Owner.Password, salt), Salt: salt,
		Role: "Organisation Owner", FacilityScope: "All Facilities", Status: "Active", LastLogin: time.Now().UTC().Format(time.RFC3339)}
	user := &nexus.OrganisationUserModel{ID: spec.UserID, TenantID: spec.TenantID, Name: spec.Name, Email: spec.Email,
		Role: spec.Role, FacilityScope: spec.FacilityScope, Status: spec.Status, LastLogin: spec.LastLogin}
	token, err := GenerateToken(user)
	if err != nil {
		return nil, http.StatusInternalServerError, err
	}
	rollback := func(cause error) (*OrganisationRegistrationResponse, int, error) {
		// A disconnected browser must not cancel cleanup of a partially written registration.
		cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 15*time.Second)
		defer cancel()
		if cleanupErr := store.DeleteRegistration(cleanupCtx, p.TenantID); cleanupErr != nil {
			return nil, http.StatusInternalServerError, fmt.Errorf("registration failed (%v); cleanup requires support for %s: %v", cause, p.TenantID, cleanupErr)
		}
		return nil, http.StatusInternalServerError, fmt.Errorf("registration was not completed; please retry: %w", cause)
	}
	if err := store.SaveProfile(ctx, &p); err != nil {
		return rollback(err)
	}
	if err := store.CreateOwner(ctx, spec); err != nil {
		return rollback(err)
	}
	p.Status = "Pending Verification"
	if err := store.SaveProfile(ctx, &p); err != nil {
		return rollback(err)
	}
	return &OrganisationRegistrationResponse{LoginResponse: LoginResponse{User: user, TenantID: p.TenantID, Token: token}, Profile: &p}, http.StatusCreated, nil
}

func (h *OrganisationHandler) HandleOrganisationRegister(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req OrganisationRegistrationRequest
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&req); err != nil {
		writeJSONError(w, "invalid registration payload", http.StatusBadRequest)
		return
	}
	var trailing interface{}
	if err := decoder.Decode(&trailing); err != io.EOF {
		writeJSONError(w, "invalid registration payload", http.StatusBadRequest)
		return
	}
	result, status, err := registerOrganisation(r.Context(), nexusRegistrationStore{h}, req)
	if err != nil {
		writeJSONError(w, err.Error(), status)
		return
	}
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(result)
}
