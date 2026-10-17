package nexus

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
)

// Local workspace state complements the typed graph objects in graph.json.
// Derived response caches and subscriptions are rebuilt on startup.
type localWorkspaceSnapshot struct {
	Version          int                                       `json:"version"`
	Nodes            map[string]LineageNode                    `json:"nodes"`
	Edges            map[string]LineageEdge                    `json:"edges"`
	Profiles         map[string]*TenantProfileModel            `json:"profiles"`
	Processes        map[string][]*ProcessModel                `json:"processes"`
	ReportingPeriods map[string][]*ReportingPeriodModel        `json:"reporting_periods"`
	Localisations    map[string]*LocalisationModel             `json:"localisations"`
	Approvals        map[string][]*ApprovalModel               `json:"approvals"`
	Agencies         map[string][]*AgencyModel                 `json:"agencies"`
	Engagements      map[string][]*VerificationEngagementModel `json:"engagements"`
	TeamMembers      map[string][]*EngagementTeamMemberModel   `json:"team_members"`
	COI              map[string][]*COIDeclarationModel         `json:"coi"`
	Findings         map[string][]*FindingModel                `json:"findings"`
	Signoffs         map[string][]*ReviewSignoffModel          `json:"signoffs"`
}

func (e *NexusGraphEngine) marshalWorkspace() ([]byte, error) {
	e.mu.RLock()
	defer e.mu.RUnlock()
	e.opMu.RLock()
	defer e.opMu.RUnlock()
	return json.Marshal(localWorkspaceSnapshot{
		Version: 1, Nodes: e.nodes, Edges: e.edges, Profiles: e.tenantProfiles,
		Processes: e.processes, ReportingPeriods: e.reportingPeriods, Localisations: e.localisations,
		Approvals: e.approvals, Agencies: e.agencies, Engagements: e.engagements,
		TeamMembers: e.teamMembers, COI: e.coiDeclarations, Findings: e.findings, Signoffs: e.signoffs,
	})
}

func (e *NexusGraphEngine) saveLocalWorkspace(file string) error {
	data, err := e.marshalWorkspace()
	if err != nil {
		return err
	}
	return atomicLocalWrite(file, json.RawMessage(data))
}

func (e *NexusGraphEngine) loadLocalWorkspace(file string) error {
	data, err := os.ReadFile(file)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	return e.unmarshalWorkspace(data)
}

func (e *NexusGraphEngine) unmarshalWorkspace(data []byte) error {
	var s localWorkspaceSnapshot
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if s.Version != 1 {
		return fmt.Errorf("unsupported local workspace version %d", s.Version)
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	e.opMu.Lock()
	defer e.opMu.Unlock()
	if s.Nodes != nil {
		e.nodes = s.Nodes
	}
	if s.Edges != nil {
		e.edges = s.Edges
	}
	if s.Profiles != nil {
		e.tenantProfiles = s.Profiles
	}
	if s.Processes != nil {
		e.processes = s.Processes
	}
	if s.ReportingPeriods != nil {
		e.reportingPeriods = s.ReportingPeriods
	}
	if s.Localisations != nil {
		e.localisations = s.Localisations
	}
	if s.Approvals != nil {
		e.approvals = s.Approvals
	}
	if s.Agencies != nil {
		e.agencies = s.Agencies
	}
	if s.Engagements != nil {
		e.engagements = s.Engagements
	}
	if s.TeamMembers != nil {
		e.teamMembers = s.TeamMembers
	}
	if s.COI != nil {
		e.coiDeclarations = s.COI
	}
	if s.Findings != nil {
		e.findings = s.Findings
	}
	if s.Signoffs != nil {
		e.signoffs = s.Signoffs
	}
	return nil
}

// LocalPersistenceHandler is opt-in for the laptop workflow. A successful mutation
// is returned only after workspace state is on disk. Typed graph mutations are
// persisted by the store reactor, including those from background reconciliation.
func LocalPersistenceHandler(dir string, engine *NexusGraphEngine, next http.Handler) (http.Handler, error) {
	file := filepath.Join(dir, "workspace.json")
	if err := engine.loadLocalWorkspace(file); err != nil {
		return nil, fmt.Errorf("load local workspace: %w", err)
	}
	if err := engine.saveLocalWorkspace(file); err != nil {
		return nil, err
	}
	return workspacePersistenceHandler(next, func() error { return engine.saveLocalWorkspace(file) }), nil
}

func workspacePersistenceHandler(next http.Handler, save func() error) http.Handler {
	var mu sync.Mutex
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet || r.Method == http.MethodHead || r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}
		mu.Lock()
		defer mu.Unlock()
		response := httptest.NewRecorder()
		next.ServeHTTP(response, r)
		if err := save(); err != nil {
			http.Error(w, "Unable to persist local workspace", http.StatusInternalServerError)
			return
		}
		for name, values := range response.Header() {
			w.Header()[name] = values
		}
		w.WriteHeader(response.Code)
		_, _ = w.Write(response.Body.Bytes())
	})
}
