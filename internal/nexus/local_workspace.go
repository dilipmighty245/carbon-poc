package nexus

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/tenant"
	"time"
)

// Decode-only compatibility with snapshots written before workspace CRDs existed.
type legacyWorkspaceSnapshot struct {
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

// MigrateLocalWorkspace imports once; the original snapshot remains a backup.
func MigrateLocalWorkspace(ctx context.Context, dir string, client *nexusclient.Clientset) error {
	marker := filepath.Join(dir, "workspace-migrated-v1.json")
	if _, err := os.Stat(marker); err == nil {
		return nil
	} else if !os.IsNotExist(err) {
		return err
	}
	data, err := os.ReadFile(filepath.Join(dir, "workspace.json"))
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	if err := migrateLegacyWorkspace(ctx, client, data); err != nil {
		return err
	}
	return atomicLocalWrite(marker, map[string]int{"version": 1})
}

func migrateLegacyWorkspace(ctx context.Context, client *nexusclient.Clientset, data []byte) error {
	var snapshot legacyWorkspaceSnapshot
	if err := json.Unmarshal(data, &snapshot); err != nil {
		return fmt.Errorf("decode legacy workspace: %w", err)
	}
	if snapshot.Version != 1 {
		return fmt.Errorf("unsupported legacy workspace version %d", snapshot.Version)
	}
	for tenantID, profile := range snapshot.Profiles {
		if profile == nil {
			continue
		}
		tctx := tenant.WithTenant(ctx, tenantID)
		node, err := EnsureTenantNode(tctx, client, tenantID)
		if err != nil {
			return err
		}
		if node.Spec.ProfileRaw == "" {
			if err := (&NexusGraphEngine{}).SaveTenantProfileWithClient(tctx, client, profile); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.Processes {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.ID == "" {
				record.ID = legacyRecordID(record)
			}
			if err := saveProcessRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.ReportingPeriods {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.ID == "" {
				record.ID = legacyRecordID(record)
			}
			if err := saveReportingPeriodRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.Approvals {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.ID == "" {
				record.ID = legacyRecordID(record)
			}
			if err := saveApprovalRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.Agencies {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.AgencyID == "" {
				record.AgencyID = legacyRecordID(record)
			}
			if err := saveVerificationAgencyRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.Engagements {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.EngagementID == "" {
				record.EngagementID = legacyRecordID(record)
			}
			if err := saveVerificationEngagementRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.TeamMembers {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.MemberID == "" {
				record.MemberID = legacyRecordID(record)
			}
			if err := saveEngagementTeamMemberRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.COI {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.DeclarationID == "" {
				record.DeclarationID = legacyRecordID(record)
			}
			if err := saveCOIDeclarationRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.Findings {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.FindingID == "" {
				record.FindingID = legacyRecordID(record)
			}
			if err := saveFindingRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, records := range snapshot.Signoffs {
		tctx := tenant.WithTenant(ctx, tenantID)
		// Older append-based updates could leave duplicate IDs; keep the last entry.
		for i := len(records) - 1; i >= 0; i-- {
			record := records[i]
			if record == nil {
				continue
			}
			if record.SignoffID == "" {
				record.SignoffID = legacyRecordID(record)
			}
			if err := saveReviewVerdictRecord(tctx, client, record, true); err != nil {
				return err
			}
		}
	}

	for tenantID, record := range snapshot.Localisations {
		if record == nil {
			continue
		}
		if err := saveLocalisationRecord(tenant.WithTenant(ctx, tenantID), client, record, true); err != nil {
			return err
		}
	}
	// Preserve old correction topology before treating engine maps as disposable.
	if len(snapshot.Nodes) > 0 || len(snapshot.Edges) > 0 {
		nodes, err := json.Marshal(snapshot.Nodes)
		if err != nil {
			return err
		}
		edges, err := json.Marshal(snapshot.Edges)
		if err != nil {
			return err
		}
		spec := inventoryv1.InputCorrectionSpec{CorrectionID: "legacy-topology", TenantID: "tenant-default", NodesRaw: string(nodes), EdgesRaw: string(edges), CreatedAt: time.Unix(0, 0).UTC().Format(time.RFC3339)}
		if err := saveInputCorrectionRecord(tenant.WithTenant(ctx, "tenant-default"), client, "legacy-topology", spec, true); err != nil {
			return err
		}
	}
	return nil
}

func legacyRecordID(record interface{}) string {
	raw, _ := json.Marshal(record)
	return fmt.Sprintf("legacy-%x", sha256.Sum256(raw))[:39]
}
