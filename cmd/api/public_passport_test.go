package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	nexusclient "saurient-platform/build/nexus-client"
	"saurient-platform/internal/nexus"
	"testing"
)

func TestPublicPassportReleaseGate(t *testing.T) {
	client := nexusclient.NewFakeClient()
	ctx := context.Background()
	if _, err := nexus.EnsureGraphRoots(ctx, client); err != nil {
		t.Fatal(err)
	}
	node, err := nexus.CreatePassportNode(ctx, client, runtimev1.CarbonPassportSpec{PassportID: "CP-GATE", VerificationStatus: nexus.StatusDraft}, nil)
	if err != nil {
		t.Fatal(err)
	}
	server := &VerificationServer{nexusClient: client}
	for _, status := range []string{nexus.StatusDraft, nexus.StatusSubmitted, nexus.StatusVerified, nexus.StatusIssued, nexus.StatusSubmittedToAgency} {
		t.Run(status, func(t *testing.T) {
			node.Spec.VerificationStatus = status
			if err := node.Update(ctx); err != nil {
				t.Fatal(err)
			}
			response := httptest.NewRecorder()
			server.handlePublicPassport(response, httptest.NewRequest(http.MethodGet, "/api/v1/public/passport-records/CP-GATE", nil))
			expected := http.StatusNotFound
			if status == nexus.StatusSubmittedToAgency {
				expected = http.StatusOK
			}
			if response.Code != expected {
				t.Fatalf("status %s: got %d: %s", status, response.Code, response.Body.String())
			}
			rich := nexus.BuildRichPassportResponse(nexus.CarbonPassportModelFromNode(node))
			if (rich.PassportMetadata.UniqueQRCode != "") != (status == nexus.StatusSubmittedToAgency) {
				t.Fatalf("QR release incorrect for %s", status)
			}
		})
	}
}
