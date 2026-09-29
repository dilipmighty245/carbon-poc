package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"saurient-platform/internal/repository"
	"saurient-platform/internal/tenant"
)

type OrganisationHandler struct {
	repo *repository.PostgresRepository
}

func NewOrganisationHandler(repo *repository.PostgresRepository) *OrganisationHandler {
	return &OrganisationHandler{repo: repo}
}

func getTenantID(r *http.Request) string {
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	if tenantID == "" {
		tenantID = "org_saurient_demo"
	}
	return tenantID
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-Tenant-ID, Authorization")
}

func writeJSONError(w http.ResponseWriter, msg string, code int) {
	b, _ := json.Marshal(map[string]string{"error": msg})
	http.Error(w, string(b), code)
}

// RegisterRoutes registers all Organisation REST endpoints with http.ServeMux
func (h *OrganisationHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/v1/auth/login", h.HandleAuthLogin)
	mux.HandleFunc("/api/v1/organisation/profile", h.HandleProfile)
	mux.HandleFunc("/api/v1/organisation/facilities", h.HandleFacilities)
	mux.HandleFunc("/api/v1/organisation/facilities/", h.HandleFacilities)
	mux.HandleFunc("/api/v1/organisation/processes", h.HandleProcesses)
	mux.HandleFunc("/api/v1/organisation/processes/", h.HandleProcesses)
	mux.HandleFunc("/api/v1/organisation/users", h.HandleUsers)
	mux.HandleFunc("/api/v1/organisation/users/role", h.HandleUpdateUserRole)
	mux.HandleFunc("/api/v1/organisation/reporting-periods", h.HandleReportingPeriods)
	mux.HandleFunc("/api/v1/organisation/localisation", h.HandleLocalisation)
	mux.HandleFunc("/api/v1/organisation/approvals", h.HandleApprovals)
}

// 1. POST /api/v1/auth/login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	User     *repository.OrganisationUserModel `json:"user"`
	TenantID string                            `json:"tenant_id"`
	Token    string                            `json:"token"`
}

func (h *OrganisationHandler) HandleAuthLogin(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	var loggedInUser *repository.OrganisationUserModel
	if h.repo != nil {
		users, err := h.repo.ListOrganisationUsers(ctx)
		if err == nil {
			for _, u := range users {
				if strings.EqualFold(u.Email, req.Email) {
					loggedInUser = u
					break
				}
			}
		}
	}

	// Fallback for demo logins if not found in database or repo unavailable
	if loggedInUser == nil {
		role := "Sustainability Manager"
		if strings.Contains(strings.ToLower(req.Email), "admin") {
			role = "Admin"
		} else if strings.Contains(strings.ToLower(req.Email), "auditor") || strings.Contains(strings.ToLower(req.Email), "verifier") {
			role = "Auditor"
		} else if strings.Contains(strings.ToLower(req.Email), "viewer") {
			role = "Viewer"
		}

		name := "Authenticated User"
		if req.Email != "" {
			parts := strings.Split(req.Email, "@")
			name = strings.Title(strings.ReplaceAll(parts[0], ".", " "))
		}

		loggedInUser = &repository.OrganisationUserModel{
			ID:            "usr-" + uuid.New().String()[:8],
			TenantID:      tenantID,
			Name:          name,
			Email:         req.Email,
			Role:          role,
			FacilityScope: "All Facilities",
			LastLogin:     "Just now",
			Status:        "Active",
		}
	}

	resp := LoginResponse{
		User:     loggedInUser,
		TenantID: tenantID,
		Token:    "demo-jwt-token-" + uuid.New().String(),
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

// 2. Profile Handlers (GET, PUT, POST)
func (h *OrganisationHandler) HandleProfile(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		p, err := h.repo.GetTenantProfile(ctx)
		if err != nil || p == nil {
			// Return default profile structure for current tenant
			p = &repository.TenantProfileModel{
				TenantID:               tenantID,
				LegalName:              "Saurient Industrial Group B.V.",
				TradingName:            "Saurient Carbon Solutions",
				OrganisationID:         "ORG-SAUR-2026-EU",
				RegistrationNumber:     "NL884920193B01",
				CountryOfIncorporation: "Netherlands",
				RegisteredAddress:      "Keizersgracht 421, 1016 EK Amsterdam",
				Headquarters:           "Amsterdam, Netherlands",
				Industry:               "Aluminium & Industrial Materials",
				NaceCode:               "C24.42 - Aluminium production",
				PrimaryProducts:        "Primary Aluminium Ingots, Low-Carbon Billets",
				Website:                "https://saurient.io",
				TaxID:                  "NL884920193B01",
				LEI:                    "724500123456789ABCDE",
				Status:                 "ACTIVE",
			}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	case http.MethodPut, http.MethodPost:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		rawBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "failed to read body", http.StatusBadRequest)
			return
		}
		var p repository.TenantProfileModel
		_ = json.Unmarshal(rawBytes, &p)
		var m map[string]interface{}
		_ = json.Unmarshal(rawBytes, &m)

		if p.LegalName == "" {
			if val, ok := m["legal_name"].(string); ok {
				p.LegalName = val
			}
		}
		if p.TradingName == "" {
			if val, ok := m["trading_name"].(string); ok {
				p.TradingName = val
			}
		}
		if p.RegistrationNumber == "" {
			if val, ok := m["registration_number"].(string); ok {
				p.RegistrationNumber = val
			}
		}
		if p.TaxID == "" {
			if val, ok := m["tax_id"].(string); ok {
				p.TaxID = val
			}
		}
		if p.Headquarters == "" {
			if val, ok := m["hq_address"].(string); ok {
				p.Headquarters = val
			}
		}
		if p.Industry == "" {
			if val, ok := m["primary_industry"].(string); ok {
				p.Industry = val
			}
		}

		p.TenantID = tenantID
		if err := h.repo.SaveTenantProfile(ctx, &p); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save profile: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 3. Facilities Handlers (GET, POST, PUT, DELETE)
func (h *OrganisationHandler) HandleFacilities(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/organisation/facilities")
	pathID := strings.TrimPrefix(path, "/")

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		facilities, err := h.repo.ListFacilities(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list facilities: %v", err), http.StatusInternalServerError)
			return
		}
		if facilities == nil {
			facilities = []*repository.FacilityModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(facilities)

	case http.MethodPost, http.MethodPut:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		var f repository.FacilityModel
		if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		f.TenantID = tenantID
		if f.ID == "" {
			f.ID = pathID
		}
		if f.ID == "" {
			f.ID = "fac-" + uuid.New().String()[:8]
		}
		if f.Status == "" {
			f.Status = "ACTIVE"
		}
		if err := h.repo.SaveFacility(ctx, &f); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save facility: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(f)

	case http.MethodDelete:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		id := pathID
		if id == "" {
			id = r.URL.Query().Get("id")
		}
		if id == "" {
			writeJSONError(w, "facility ID is required", http.StatusBadRequest)
			return
		}
		if err := h.repo.DeleteFacility(ctx, id); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to delete facility: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "facility deleted successfully", "id": id})

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 4. Processes Handlers (GET, POST, PUT, DELETE)
func (h *OrganisationHandler) HandleProcesses(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/organisation/processes")
	pathID := strings.TrimPrefix(path, "/")

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		processes, err := h.repo.ListProcesses(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list processes: %v", err), http.StatusInternalServerError)
			return
		}
		if processes == nil {
			processes = []*repository.ProcessModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(processes)

	case http.MethodPost, http.MethodPut:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		var p repository.ProcessModel
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		p.TenantID = tenantID
		if p.ID == "" {
			p.ID = pathID
		}
		if p.ID == "" {
			p.ID = "prc-" + uuid.New().String()[:8]
		}
		if p.Status == "" {
			p.Status = "ACTIVE"
		}
		if err := h.repo.SaveProcess(ctx, &p); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save process: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	case http.MethodDelete:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		id := pathID
		if id == "" {
			id = r.URL.Query().Get("id")
		}
		if id == "" {
			writeJSONError(w, "process ID is required", http.StatusBadRequest)
			return
		}
		if err := h.repo.DeleteProcess(ctx, id); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to delete process: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "process deleted successfully", "id": id})

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 5. Users Handlers (GET, POST, PUT)
func (h *OrganisationHandler) HandleUsers(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		users, err := h.repo.ListOrganisationUsers(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list users: %v", err), http.StatusInternalServerError)
			return
		}
		if users == nil {
			users = []*repository.OrganisationUserModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(users)

	case http.MethodPost, http.MethodPut:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		var u repository.OrganisationUserModel
		if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		u.TenantID = tenantID
		if u.ID == "" {
			u.ID = "usr-" + uuid.New().String()[:8]
		}
		if u.Status == "" {
			u.Status = "Active"
		}
		if u.LastLogin == "" {
			u.LastLogin = "Invited"
		}
		if err := h.repo.SaveOrganisationUser(ctx, &u); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save user: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(u)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 5b. Update User Role (PUT /api/v1/organisation/users/role)
type UpdateRoleRequest struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

func (h *OrganisationHandler) HandleUpdateUserRole(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPut && r.Method != http.MethodPost {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.UserID == "" || req.Role == "" {
		writeJSONError(w, "user_id and role are required", http.StatusBadRequest)
		return
	}

	if h.repo == nil {
		writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
		return
	}

	if err := h.repo.UpdateUserRole(ctx, req.UserID, req.Role); err != nil {
		writeJSONError(w, fmt.Sprintf("failed to update user role: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "user role updated successfully",
		"user_id": req.UserID,
		"role":    req.Role,
	})
}

// 6. Reporting Periods Handlers (GET, POST, PUT)
func (h *OrganisationHandler) HandleReportingPeriods(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		periods, err := h.repo.ListReportingPeriods(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list reporting periods: %v", err), http.StatusInternalServerError)
			return
		}
		if periods == nil {
			periods = []*repository.ReportingPeriodModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(periods)

	case http.MethodPost, http.MethodPut:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		rawBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "failed to read body", http.StatusBadRequest)
			return
		}
		var p repository.ReportingPeriodModel
		_ = json.Unmarshal(rawBytes, &p)
		var m map[string]interface{}
		_ = json.Unmarshal(rawBytes, &m)

		if p.Name == "" {
			if val, ok := m["period_name"].(string); ok {
				p.Name = val
			}
		}
		if p.StartDate == "" {
			if val, ok := m["start_date"].(string); ok {
				p.StartDate = val
			}
		}
		if p.EndDate == "" {
			if val, ok := m["end_date"].(string); ok {
				p.EndDate = val
			}
		}

		p.TenantID = tenantID
		if p.ID == "" {
			p.ID = "rep-" + uuid.New().String()[:8]
		}
		if err := h.repo.SaveReportingPeriod(ctx, &p); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save reporting period: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 7. Localisation Handlers (GET, PUT, POST)
func (h *OrganisationHandler) HandleLocalisation(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		loc, err := h.repo.GetLocalisation(ctx)
		if err != nil || loc == nil {
			loc = &repository.LocalisationModel{
				TenantID:   tenantID,
				Country:    "Netherlands",
				Currency:   "EUR (€)",
				Timezone:   "CET (UTC+1)",
				Language:   "English",
				Units:      json.RawMessage(`{"mass":"kg","energy":"kWh","distance":"km"}`),
				Regulatory: json.RawMessage(`{"cbamEnabled":true,"csrdEnabled":true}`),
			}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(loc)

	case http.MethodPut, http.MethodPost:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		var loc repository.LocalisationModel
		if err := json.NewDecoder(r.Body).Decode(&loc); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		loc.TenantID = tenantID
		if err := h.repo.SaveLocalisation(ctx, &loc); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save localisation: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(loc)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 8. Approvals Handlers (GET, POST, PUT)
func (h *OrganisationHandler) HandleApprovals(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	switch r.Method {
	case http.MethodGet:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		approvals, err := h.repo.ListApprovals(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list approvals: %v", err), http.StatusInternalServerError)
			return
		}
		if approvals == nil {
			approvals = []*repository.ApprovalModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(approvals)

	case http.MethodPost, http.MethodPut:
		if h.repo == nil {
			writeJSONError(w, "database unavailable", http.StatusServiceUnavailable)
			return
		}
		rawBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "failed to read body", http.StatusBadRequest)
			return
		}
		var a repository.ApprovalModel
		_ = json.Unmarshal(rawBytes, &a)
		var m map[string]interface{}
		_ = json.Unmarshal(rawBytes, &m)

		if a.Title == "" {
			if val, ok := m["action"].(string); ok {
				a.Title = val
			}
		}
		if a.Type == "" {
			if val, ok := m["entity_type"].(string); ok {
				a.Type = val
			}
		}
		if a.Facility == "" {
			if val, ok := m["entity_id"].(string); ok {
				a.Facility = val
			}
		}
		if len(a.SubmittedBy) == 0 {
			if reqBy, ok := m["requested_by"].(string); ok && reqBy != "" {
				b, _ := json.Marshal(map[string]string{"email": reqBy, "name": reqBy})
				a.SubmittedBy = b
			}
		}

		a.TenantID = tenantID
		if a.ID == "" {
			a.ID = "appr-" + uuid.New().String()[:8]
		}
		if a.Status == "" {
			a.Status = "PENDING"
		}
		if err := h.repo.SaveApproval(ctx, &a); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save approval: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(a)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
