package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"reflect"
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/runtime"
	k8stesting "k8s.io/client-go/testing"
	basefake "saurient-platform/build/client/clientset/versioned/fake"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/tenant"
)

type workspaceTestCase struct {
	name string
	save func(context.Context, *nexusclient.Clientset) error
	list func(context.Context, *nexusclient.Clientset) ([]byte, error)
}

func workspaceCase[T any](name string, record *T, save func(context.Context, *nexusclient.Clientset, *T, bool) error, list func(context.Context, *nexusclient.Clientset) ([]*T, error)) workspaceTestCase {
	return workspaceTestCase{name: name,
		save: func(ctx context.Context, client *nexusclient.Clientset) error {
			raw, _ := json.Marshal(record)
			var copy T
			if err := json.Unmarshal(raw, &copy); err != nil {
				return err
			}
			return save(ctx, client, &copy, false)
		},
		list: func(ctx context.Context, client *nexusclient.Clientset) ([]byte, error) {
			records, err := list(ctx, client)
			if err != nil {
				return nil, err
			}
			return json.Marshal(records)
		},
	}
}

func TestWorkspaceRecordsAreDurableAndTenantScoped(t *testing.T) {
	dir := t.TempDir()
	client, _, err := newLocalGraphClient(dir + "/graph.json")
	if err != nil {
		t.Fatal(err)
	}
	cases := []workspaceTestCase{
		workspaceCase("process", &ProcessModel{ID: "shared-id", Name: "Smelting", Inputs: json.RawMessage(`[{"quantity":0}]`), PCFTrace: json.RawMessage(`{"source":"meter"}`)}, saveProcessRecord, listProcessRecords),
		workspaceCase("period", &ReportingPeriodModel{ID: "shared-id", Year: 2026, EmissionsTotal: 12.5}, saveReportingPeriodRecord, listReportingPeriodRecords),
		workspaceCase("localisation", &LocalisationModel{DefaultLanguage: "en-IN", Units: json.RawMessage(`{"mass":"kg"}`)}, saveLocalisationRecord, listLocalisationRecords),
		workspaceCase("approval", &ApprovalModel{ID: "shared-id", Status: "APPROVED", ApproverComment: "Reviewed"}, saveApprovalRecord, listApprovalRecords),
		workspaceCase("agency", &AgencyModel{AgencyID: "shared-id", Name: "Verifier", Scopes: json.RawMessage(`["Steel"]`), AccreditationExpiry: time.Date(2028, 1, 1, 0, 0, 0, 0, time.UTC)}, saveVerificationAgencyRecord, listVerificationAgencyRecords),
		workspaceCase("engagement", &VerificationEngagementModel{EngagementID: "shared-id", ScopeMatch: true, Timeline: json.RawMessage(`[{"status":"Assigned"}]`)}, saveVerificationEngagementRecord, listVerificationEngagementRecords),
		workspaceCase("team", &EngagementTeamMemberModel{MemberID: "shared-id", EngagementID: "eng-1", Name: "Auditor"}, saveEngagementTeamMemberRecord, listEngagementTeamMemberRecords),
		workspaceCase("coi", &COIDeclarationModel{DeclarationID: "shared-id", HasConflict: true, Explanation: "Prior work"}, saveCOIDeclarationRecord, listCOIDeclarationRecords),
		workspaceCase("finding", &FindingModel{FindingID: "shared-id", EngagementID: "eng-1", Discrepancy: 4.2}, saveFindingRecord, listFindingRecords),
		workspaceCase("signoff", &ReviewSignoffModel{SignoffID: "shared-id", Opinion: "Qualified", Frozen: true}, saveReviewVerdictRecord, listReviewVerdictRecords),
	}
	ctx := tenant.WithTenant(context.Background(), "org-records")
	expected := map[string][]byte{}
	for _, test := range cases {
		if err := test.save(ctx, client); err != nil {
			t.Fatalf("save %s: %v", test.name, err)
		}
		// Repeated saves must update one record, rather than append duplicates.
		if err := test.save(ctx, client); err != nil {
			t.Fatal(err)
		}
		raw, err := test.list(ctx, client)
		if err != nil {
			t.Fatal(err)
		}
		var records []map[string]interface{}
		if err := json.Unmarshal(raw, &records); err != nil {
			t.Fatal(err)
		}
		if len(records) != 1 {
			t.Fatalf("%s: expected one record, got %s", test.name, raw)
		}
		if records[0]["tenant_id"] != "org-records" {
			t.Fatal("wrong record owner")
		}
		expected[test.name] = raw
		if err := test.save(tenant.WithTenant(ctx, "org-other-records"), client); err != nil {
			t.Fatal(err)
		}
	}
	// New transport and engine, sharing only durable storage, must see all fields.
	reopened, _, err := newLocalGraphClient(dir + "/graph.json")
	if err != nil {
		t.Fatal(err)
	}
	engine := &NexusGraphEngine{}
	engine.Reset()
	for _, test := range cases {
		actual, err := test.list(ctx, reopened)
		if err != nil {
			t.Fatal(err)
		}
		var got, want interface{}
		if err := json.Unmarshal(actual, &got); err != nil {
			t.Fatal(err)
		}
		if err := json.Unmarshal(expected[test.name], &want); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(got, want) {
			t.Fatalf("%s changed after restart: got %s want %s", test.name, actual, expected[test.name])
		}
	}
	processes, err := listProcessRecords(ctx, reopened)
	if err != nil || len(processes) != 1 || string(processes[0].Inputs) != `[{"quantity":0}]` {
		t.Fatalf("structured inputs lost: %+v %v", processes, err)
	}
	if err := deleteProcessRecord(ctx, reopened, "shared-id"); err != nil {
		t.Fatal(err)
	}
	processes, err = listProcessRecords(tenant.WithTenant(ctx, "org-other-records"), reopened)
	if err != nil || len(processes) != 1 {
		t.Fatal("delete affected another tenant")
	}
}

func TestWorkspaceStorageFailuresAreReturned(t *testing.T) {
	client := nexusclient.NewFakeClient()
	base := client.BaseClient().(*basefake.Clientset)
	base.PrependReactor("list", "processes", func(k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, fmt.Errorf("database unavailable")
	})
	if _, err := listProcessRecords(context.Background(), client); err == nil {
		t.Fatal("read failure became an empty success")
	}
	base.PrependReactor("create", "approvals", func(k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, fmt.Errorf("database unavailable")
	})
	if err := saveApprovalRecord(context.Background(), client, &ApprovalModel{ID: "fail"}, false); err == nil {
		t.Fatal("write failure reported success")
	}
}

func TestCorrectionHistorySurvivesEngineReset(t *testing.T) {
	previous := GetNexusClient()
	client := nexusclient.NewFakeClient()
	SetNexusClient(client)
	t.Cleanup(func() { SetNexusClient(previous) })
	engine := &NexusGraphEngine{}
	engine.Reset()
	ctx := tenant.WithTenant(context.Background(), "org-corrections")
	result, err := engine.CorrectSupplierInput(ctx, InputCorrectionRequest{InputNodeID: "NODE_IN_SUP_409", NewValue: 0.72, Reason: "Updated declaration"})
	if err != nil {
		t.Fatal(err)
	}
	engine.Reset()
	dag, err := engine.GetLineageDAG(ctx, "PASS-2026-981-v1.0")
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, node := range dag.Nodes {
		if node.NodeID == "NODE_CALC_V1_1" {
			found = true
		}
	}
	if !found {
		t.Fatal("correction lost after clearing derived cache")
	}
	records, err := listInputCorrections(ctx, client)
	if err != nil || len(records) != 1 || records[0].Spec.CorrectionID != result.CorrectionID {
		t.Fatal("correction history missing")
	}
	var restored InputCorrectionResult
	if err := json.Unmarshal([]byte(records[0].Spec.ResultRaw), &restored); err != nil {
		t.Fatal(err)
	}
	if restored.NewIntensityKgCO2e != result.NewIntensityKgCO2e {
		t.Fatal("correction result changed")
	}
	other, err := engine.GetLineageDAG(tenant.WithTenant(ctx, "org-other-corrections"), "PASS-2026-981-v1.0")
	if err != nil {
		t.Fatal(err)
	}
	for _, node := range other.Nodes {
		if node.NodeID == "NODE_CALC_V1_1" {
			t.Fatal("correction leaked into another tenant")
		}
	}
}
