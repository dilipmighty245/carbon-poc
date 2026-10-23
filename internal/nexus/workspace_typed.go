package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	"saurient-platform/build/helper"
	nexusclient "saurient-platform/build/nexus-client"
	"time"
)

func saveProcessRecord(ctx context.Context, client *nexusclient.Clientset, record *ProcessModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("Process is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.ID == "" {
		return fmt.Errorf("Process ID is required")
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}
	if !createOnly {
		record.UpdatedAt = time.Now().UTC()
	}

	var spec inventoryv1.ProcessSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.Process{ObjectMeta: workspaceMetadata("processes.inventory.saurient.io", record.TenantID, record.ID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().Processes(), "processes.inventory.saurient.io", object, createOnly)
}

func listProcessRecords(ctx context.Context, client *nexusclient.Clientset) ([]*ProcessModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().Processes().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*ProcessModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &ProcessModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveReportingPeriodRecord(ctx context.Context, client *nexusclient.Clientset, record *ReportingPeriodModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("ReportingPeriod is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.ID == "" {
		return fmt.Errorf("ReportingPeriod ID is required")
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}

	var spec inventoryv1.ReportingPeriodSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.ReportingPeriod{ObjectMeta: workspaceMetadata("reportingperiods.inventory.saurient.io", record.TenantID, record.ID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().ReportingPeriods(), "reportingperiods.inventory.saurient.io", object, createOnly)
}

func listReportingPeriodRecords(ctx context.Context, client *nexusclient.Clientset) ([]*ReportingPeriodModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().ReportingPeriods().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*ReportingPeriodModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &ReportingPeriodModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveLocalisationRecord(ctx context.Context, client *nexusclient.Clientset, record *LocalisationModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("Localisation is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)

	var spec inventoryv1.LocalisationSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.Localisation{ObjectMeta: workspaceMetadata("localisations.inventory.saurient.io", record.TenantID, "settings"), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().Localisations(), "localisations.inventory.saurient.io", object, createOnly)
}

func listLocalisationRecords(ctx context.Context, client *nexusclient.Clientset) ([]*LocalisationModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().Localisations().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*LocalisationModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &LocalisationModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveApprovalRecord(ctx context.Context, client *nexusclient.Clientset, record *ApprovalModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("Approval is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.ID == "" {
		return fmt.Errorf("Approval ID is required")
	}
	if record.SubmittedAt.IsZero() {
		record.SubmittedAt = time.Now().UTC()
	}

	var spec inventoryv1.ApprovalSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.Approval{ObjectMeta: workspaceMetadata("approvals.inventory.saurient.io", record.TenantID, record.ID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().Approvals(), "approvals.inventory.saurient.io", object, createOnly)
}

func listApprovalRecords(ctx context.Context, client *nexusclient.Clientset) ([]*ApprovalModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().Approvals().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*ApprovalModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &ApprovalModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveVerificationAgencyRecord(ctx context.Context, client *nexusclient.Clientset, record *AgencyModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("VerificationAgency is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.AgencyID == "" {
		return fmt.Errorf("VerificationAgency ID is required")
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}
	if !createOnly {
		record.UpdatedAt = time.Now().UTC()
	}

	var spec inventoryv1.VerificationAgencySpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.VerificationAgency{ObjectMeta: workspaceMetadata("verificationagencies.inventory.saurient.io", record.TenantID, record.AgencyID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().VerificationAgencies(), "verificationagencies.inventory.saurient.io", object, createOnly)
}

func listVerificationAgencyRecords(ctx context.Context, client *nexusclient.Clientset) ([]*AgencyModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().VerificationAgencies().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*AgencyModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &AgencyModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveVerificationEngagementRecord(ctx context.Context, client *nexusclient.Clientset, record *VerificationEngagementModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("VerificationEngagement is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.EngagementID == "" {
		return fmt.Errorf("VerificationEngagement ID is required")
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}
	if !createOnly {
		record.UpdatedAt = time.Now().UTC()
	}

	var spec inventoryv1.VerificationEngagementSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.VerificationEngagement{ObjectMeta: workspaceMetadata("verificationengagements.inventory.saurient.io", record.TenantID, record.EngagementID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().VerificationEngagements(), "verificationengagements.inventory.saurient.io", object, createOnly)
}

func listVerificationEngagementRecords(ctx context.Context, client *nexusclient.Clientset) ([]*VerificationEngagementModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().VerificationEngagements().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*VerificationEngagementModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &VerificationEngagementModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveEngagementTeamMemberRecord(ctx context.Context, client *nexusclient.Clientset, record *EngagementTeamMemberModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("EngagementTeamMember is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.MemberID == "" {
		return fmt.Errorf("EngagementTeamMember ID is required")
	}
	if record.AssignedAt.IsZero() {
		record.AssignedAt = time.Now().UTC()
	}

	var spec inventoryv1.EngagementTeamMemberSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.EngagementTeamMember{ObjectMeta: workspaceMetadata("engagementteammembers.inventory.saurient.io", record.TenantID, record.MemberID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().EngagementTeamMembers(), "engagementteammembers.inventory.saurient.io", object, createOnly)
}

func listEngagementTeamMemberRecords(ctx context.Context, client *nexusclient.Clientset) ([]*EngagementTeamMemberModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().EngagementTeamMembers().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*EngagementTeamMemberModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &EngagementTeamMemberModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveCOIDeclarationRecord(ctx context.Context, client *nexusclient.Clientset, record *COIDeclarationModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("COIDeclaration is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.DeclarationID == "" {
		return fmt.Errorf("COIDeclaration ID is required")
	}
	if record.DeclaredAt.IsZero() {
		record.DeclaredAt = time.Now().UTC()
	}

	var spec inventoryv1.COIDeclarationSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.COIDeclaration{ObjectMeta: workspaceMetadata("coideclarations.inventory.saurient.io", record.TenantID, record.DeclarationID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().COIDeclarations(), "coideclarations.inventory.saurient.io", object, createOnly)
}

func listCOIDeclarationRecords(ctx context.Context, client *nexusclient.Clientset) ([]*COIDeclarationModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().COIDeclarations().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*COIDeclarationModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &COIDeclarationModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveFindingRecord(ctx context.Context, client *nexusclient.Clientset, record *FindingModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("Finding is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.FindingID == "" {
		return fmt.Errorf("Finding ID is required")
	}
	if record.CreatedAt.IsZero() {
		record.CreatedAt = time.Now().UTC()
	}
	if !createOnly {
		record.UpdatedAt = time.Now().UTC()
	}

	var spec inventoryv1.FindingSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.Finding{ObjectMeta: workspaceMetadata("findings.inventory.saurient.io", record.TenantID, record.FindingID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().Findings(), "findings.inventory.saurient.io", object, createOnly)
}

func listFindingRecords(ctx context.Context, client *nexusclient.Clientset) ([]*FindingModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().Findings().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*FindingModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &FindingModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveReviewVerdictRecord(ctx context.Context, client *nexusclient.Clientset, record *ReviewSignoffModel, createOnly bool) error {
	if record == nil {
		return fmt.Errorf("ReviewVerdict is required")
	}
	record.TenantID = workspaceTenant(ctx, record.TenantID)
	if record.SignoffID == "" {
		return fmt.Errorf("ReviewVerdict ID is required")
	}
	if record.SignedAt.IsZero() {
		record.SignedAt = time.Now().UTC()
	}

	var spec inventoryv1.ReviewVerdictSpec
	if err := encodeWorkspaceRecord(record, &spec); err != nil {
		return err
	}
	object := &inventoryv1.ReviewVerdict{ObjectMeta: workspaceMetadata("reviewverdicts.inventory.saurient.io", record.TenantID, record.SignoffID), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().ReviewVerdicts(), "reviewverdicts.inventory.saurient.io", object, createOnly)
}

func listReviewVerdictRecords(ctx context.Context, client *nexusclient.Clientset) ([]*ReviewSignoffModel, error) {
	objects, err := client.BaseClient().InventorySaurientV1().ReviewVerdicts().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	result := make([]*ReviewSignoffModel, 0, len(objects.Items))
	for _, object := range objects.Items {
		record := &ReviewSignoffModel{}
		if err := decodeWorkspaceRecord(object.Spec, record); err != nil {
			return nil, err
		}
		record.TenantID = object.Labels["tenants.inventory.saurient.io"]
		result = append(result, record)
	}
	return result, nil
}

func saveInputCorrectionRecord(ctx context.Context, client *nexusclient.Clientset, id string, spec inventoryv1.InputCorrectionSpec, createOnly bool) error {
	spec.TenantID = workspaceTenant(ctx, spec.TenantID)
	object := &inventoryv1.InputCorrection{ObjectMeta: workspaceMetadata("inputcorrections.inventory.saurient.io", spec.TenantID, id), Spec: spec}
	return saveWorkspaceObject(ctx, client, client.BaseClient().InventorySaurientV1().InputCorrections(), "inputcorrections.inventory.saurient.io", object, createOnly)
}

func listInputCorrections(ctx context.Context, client *nexusclient.Clientset) ([]inventoryv1.InputCorrection, error) {
	objects, err := client.BaseClient().InventorySaurientV1().InputCorrections().List(ctx, workspaceListOptions(ctx))
	if err != nil {
		return nil, err
	}
	return objects.Items, nil
}

func deleteProcessRecord(ctx context.Context, client *nexusclient.Clientset, id string) error {
	object := workspaceMetadata("processes.inventory.saurient.io", workspaceTenant(ctx, ""), id)
	err := client.BaseClient().InventorySaurientV1().Processes().Delete(ctx, object.Name, metav1.DeleteOptions{})
	if apierrors.IsNotFound(err) {
		return nil
	}
	if err != nil {
		return err
	}
	parent := helper.GetHashedName("tenants.inventory.saurient.io", object.Labels, workspaceTenant(ctx, ""))
	client.RemoveGraphChild("tenants.inventory.saurient.io", parent, "processes.inventory.saurient.io", object.Name)
	return nil
}

// correctionRecord captures history, rather than relying on mutable engine maps.
func correctionRecord(ctx context.Context, result *InputCorrectionResult, req InputCorrectionRequest, nodes map[string]LineageNode, edges map[string]LineageEdge) (inventoryv1.InputCorrectionSpec, error) {
	raw, err := json.Marshal(result)
	if err != nil {
		return inventoryv1.InputCorrectionSpec{}, err
	}
	nodeRaw, err := json.Marshal(nodes)
	if err != nil {
		return inventoryv1.InputCorrectionSpec{}, err
	}
	edgeRaw, err := json.Marshal(edges)
	if err != nil {
		return inventoryv1.InputCorrectionSpec{}, err
	}
	return inventoryv1.InputCorrectionSpec{CorrectionID: result.CorrectionID, TenantID: workspaceTenant(ctx, ""), InputNodeID: result.InputNodeID, NewValue: req.NewValue, Reason: req.Reason, ResultRaw: string(raw), NodesRaw: string(nodeRaw), EdgesRaw: string(edgeRaw), CreatedAt: result.Timestamp.UTC().Format(time.RFC3339Nano)}, nil
}
