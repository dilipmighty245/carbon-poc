package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
	"saurient-platform/internal/tenant"
)

type OrganisationHandler struct {
	client *nexus_client.Clientset
	engine *nexus.NexusGraphEngine
}

func NewOrganisationHandler(engine *nexus.NexusGraphEngine) *OrganisationHandler {
	return NewOrganisationHandlerWithClient(nil, engine)
}

func NewOrganisationHandlerWithClient(client *nexus_client.Clientset, engine *nexus.NexusGraphEngine) *OrganisationHandler {
	if client == nil {
		client = nexus.GetNexusClient()
	}
	if engine == nil {
		engine = nexus.GetNexusEngine()
	}
	return &OrganisationHandler{
		client: client,
		engine: engine,
	}
}

func getTenantID(r *http.Request) string {
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = r.URL.Query().Get("tenant_id")
	}
	if tenantID == "" {
		tenantID = "tenant-default"
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
	User     *nexus.OrganisationUserModel `json:"user"`
	TenantID string                       `json:"tenant_id"`
	Token    string                       `json:"token"`
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

	var loggedInUser *nexus.OrganisationUserModel

	// 1. Check Nexus graph node first
	if h.client != nil {
		if uNode, err := nexus.GetUserNodeByEmail(ctx, h.client, tenantID, req.Email); err == nil && uNode != nil {
			loggedInUser = nexus.UserModelFromNode(uNode)
		}
	}

	// 2. Fallback to nexusEngine if available
	if loggedInUser == nil && h.engine != nil {
		users, err := h.engine.ListOrganisationUsers(ctx)
		if err == nil {
			for _, u := range users {
				if strings.EqualFold(u.Email, req.Email) {
					loggedInUser = u
					break
				}
			}
		}
	}

	// 3. Fallback for demo logins if not found: dynamically generate and persist as first-class Nexus node
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

		userID := "usr-" + uuid.New().String()[:8]
		lastLogin := time.Now().UTC().Format(time.RFC3339)

		// Persist as first-class declarative Nexus User Node
		if h.client != nil {
			userSpec := inventoryv1.UserSpec{
				UserID:        userID,
				TenantID:      tenantID,
				Name:          name,
				Email:         req.Email,
				Role:          role,
				FacilityScope: "All Facilities",
				LastLogin:     lastLogin,
				Status:        "Active",
			}
			if uNode, err := nexus.CreateUserNode(ctx, h.client, tenantID, userSpec); err == nil && uNode != nil {
				loggedInUser = nexus.UserModelFromNode(uNode)
			}
		}

		if loggedInUser == nil {
			loggedInUser = &nexus.OrganisationUserModel{
				ID:            userID,
				TenantID:      tenantID,
				Name:          name,
				Email:         req.Email,
				Role:          role,
				FacilityScope: "All Facilities",
				LastLogin:     lastLogin,
				Status:        "Active",
			}
			if h.engine != nil {
				_ = h.engine.SaveOrganisationUser(ctx, loggedInUser)
			}
		}
	} else if h.client != nil {
		// Update LastLogin timestamp
		loggedInUser.LastLogin = time.Now().UTC().Format(time.RFC3339)
		userSpec := inventoryv1.UserSpec{
			UserID:        loggedInUser.ID,
			TenantID:      loggedInUser.TenantID,
			Name:          loggedInUser.Name,
			Email:         loggedInUser.Email,
			Role:          loggedInUser.Role,
			FacilityScope: loggedInUser.FacilityScope,
			LastLogin:     loggedInUser.LastLogin,
			Status:        loggedInUser.Status,
		}
		_, _ = nexus.CreateUserNode(ctx, h.client, tenantID, userSpec)
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
		p, err := h.engine.GetTenantProfile(ctx)
		if err != nil || p == nil {
			writeJSONError(w, fmt.Sprintf("profile not found for tenant: %s", tenantID), http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	case http.MethodPut, http.MethodPost:
		rawBytes, err := io.ReadAll(r.Body)
		if err != nil {
			writeJSONError(w, "failed to read body", http.StatusBadRequest)
			return
		}
		var p nexus.TenantProfileModel
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

		p.TenantID = tenantID
		if err := h.engine.SaveTenantProfile(ctx, &p); err != nil {
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
		var facilities []*nexus.FacilityModel
		if h.client != nil {
			facNodes, err := nexus.ListFacilityNodes(ctx, h.client, tenantID)
			if err == nil {
				for _, fn := range facNodes {
					if fm := nexus.FacilityModelFromNode(fn); fm != nil {
						facilities = append(facilities, fm)
					}
				}
			}
		}
		if len(facilities) == 0 && h.engine != nil {
			facilities, _ = h.engine.ListFacilities(ctx)
		}
		if facilities == nil {
			facilities = []*nexus.FacilityModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(facilities)

	case http.MethodPost, http.MethodPut:
		var f nexus.FacilityModel
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

		if h.client != nil {
			spec := inventoryv1.FacilitySpec{
				FacilityID:  f.ID,
				Name:        f.Name,
				Location:    f.Address,
				CountryCode: f.CountryCode,
			}
			if _, err := nexus.SaveFacilityNode(ctx, h.client, tenantID, spec); err != nil {
				writeJSONError(w, fmt.Sprintf("failed to save facility node in nexus: %v", err), http.StatusInternalServerError)
				return
			}
		}
		if h.engine != nil {
			_ = h.engine.SaveFacility(ctx, &f)
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(f)

	case http.MethodDelete:
		id := pathID
		if id == "" {
			id = r.URL.Query().Get("id")
		}
		if id == "" {
			writeJSONError(w, "facility ID is required", http.StatusBadRequest)
			return
		}
		if h.client != nil {
			_ = nexus.DeleteFacilityNode(ctx, h.client, tenantID, id)
		}
		if h.engine != nil {
			_ = h.engine.DeleteFacility(ctx, id)
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
		processes, err := h.engine.ListProcesses(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list processes: %v", err), http.StatusInternalServerError)
			return
		}
		if processes == nil {
			processes = []*nexus.ProcessModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(processes)

	case http.MethodPost, http.MethodPut:
		var p nexus.ProcessModel
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
		if err := h.engine.SaveProcess(ctx, &p); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save process: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	case http.MethodDelete:
		id := pathID
		if id == "" {
			id = r.URL.Query().Get("id")
		}
		if id == "" {
			writeJSONError(w, "process ID is required", http.StatusBadRequest)
			return
		}
		if err := h.engine.DeleteProcess(ctx, id); err != nil {
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
		users := make([]*nexus.OrganisationUserModel, 0)
		seen := make(map[string]bool)

		if h.client != nil {
			if uNodes, err := nexus.ListUserNodes(ctx, h.client, tenantID); err == nil {
				for _, uNode := range uNodes {
					if uNode == nil || uNode.User == nil {
						continue
					}
					uModel := nexus.UserModelFromNode(uNode)
					if uModel != nil && !seen[uModel.ID] {
						seen[uModel.ID] = true
						users = append(users, uModel)
					}
				}
			}
		}

		if h.engine != nil {
			if engineUsers, err := h.engine.ListOrganisationUsers(ctx); err == nil {
				for _, u := range engineUsers {
					if u != nil && !seen[u.ID] {
						seen[u.ID] = true
						users = append(users, u)
					}
				}
			}
		}

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(users)

	case http.MethodPost, http.MethodPut:
		var u nexus.OrganisationUserModel
		if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		u.TenantID = tenantID
		if u.ID == "" {
			u.ID = "usr-" + uuid.New().String()[:8]
		}
		if u.Status == "" {
			u.Status = "ACTIVE"
		}

		if h.client != nil {
			spec := inventoryv1.UserSpec{
				UserID:        u.ID,
				TenantID:      tenantID,
				Name:          u.Name,
				Email:         u.Email,
				Role:          u.Role,
				FacilityScope: u.FacilityScope,
				LastLogin:     u.LastLogin,
				Status:        u.Status,
			}
			if _, err := nexus.CreateUserNode(ctx, h.client, tenantID, spec); err != nil {
				writeJSONError(w, fmt.Sprintf("failed to save user node in nexus: %v", err), http.StatusInternalServerError)
				return
			}
		}

		if h.engine != nil {
			_ = h.engine.SaveOrganisationUser(ctx, &u)
		}

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(u)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandleUpdateUserRole (POST /api/v1/organisation/users/role)
func (h *OrganisationHandler) HandleUpdateUserRole(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost && r.Method != http.MethodPut {
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	tenantID := getTenantID(r)
	ctx := tenant.WithTenant(r.Context(), tenantID)

	var req struct {
		UserID  string `json:"userId"`
		NewRole string `json:"newRole"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
		return
	}

	if req.UserID == "" || req.NewRole == "" {
		writeJSONError(w, "userId and newRole are required", http.StatusBadRequest)
		return
	}

	var updateErr error
	if h.client != nil {
		updateErr = nexus.UpdateUserRoleNode(ctx, h.client, tenantID, req.UserID, req.NewRole)
	}

	if h.engine != nil {
		engineErr := h.engine.UpdateUserRole(ctx, req.UserID, req.NewRole)
		if updateErr != nil && engineErr == nil {
			updateErr = nil
		}
	}

	if updateErr != nil {
		writeJSONError(w, fmt.Sprintf("failed to update role: %v", updateErr), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "role updated successfully", "userId": req.UserID, "role": req.NewRole})
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
		periods, err := h.engine.ListReportingPeriods(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list reporting periods: %v", err), http.StatusInternalServerError)
			return
		}
		if periods == nil {
			periods = []*nexus.ReportingPeriodModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(periods)

	case http.MethodPost, http.MethodPut:
		var p nexus.ReportingPeriodModel
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		p.TenantID = tenantID
		if p.ID == "" {
			p.ID = "period-" + uuid.New().String()[:8]
		}
		if err := h.engine.SaveReportingPeriod(ctx, &p); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save reporting period: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(p)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 7. Localisation Config Handlers (GET, PUT, POST)
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
		loc, err := h.engine.GetLocalisation(ctx)
		if err != nil || loc == nil {
			loc = &nexus.LocalisationModel{
				TenantID:   tenantID,
				Country:    "Netherlands",
				Currency:   "EUR",
				Timezone:   "Europe/Amsterdam",
				Language:   "en",
				Units:      json.RawMessage(`{"mass":"kg","energy":"kWh","carbon":"kgCO2e"}`),
				Regulatory: json.RawMessage(`{"cbamReporting":true,"iso14067":true}`),
			}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(loc)

	case http.MethodPut, http.MethodPost:
		var loc nexus.LocalisationModel
		if err := json.NewDecoder(r.Body).Decode(&loc); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		loc.TenantID = tenantID
		if err := h.engine.SaveLocalisation(ctx, &loc); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save localisation: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(loc)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// 8. Approvals (SoD) Handlers (GET, POST, PUT)
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
		approvals, err := h.engine.ListApprovals(ctx)
		if err != nil {
			writeJSONError(w, fmt.Sprintf("failed to list approvals: %v", err), http.StatusInternalServerError)
			return
		}
		if approvals == nil {
			approvals = []*nexus.ApprovalModel{}
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(approvals)

	case http.MethodPost, http.MethodPut:
		var a nexus.ApprovalModel
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			writeJSONError(w, "invalid JSON payload", http.StatusBadRequest)
			return
		}
		a.TenantID = tenantID
		if a.ID == "" {
			a.ID = "app-" + uuid.New().String()[:8]
		}
		if a.Status == "" {
			a.Status = "PENDING"
		}
		if err := h.engine.SaveApproval(ctx, &a); err != nil {
			writeJSONError(w, fmt.Sprintf("failed to save approval: %v", err), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(a)

	default:
		writeJSONError(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
