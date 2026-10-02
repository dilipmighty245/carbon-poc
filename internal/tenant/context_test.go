package tenant

import (
	"context"
	"testing"
)

func TestTenantContext(t *testing.T) {
	ctx := context.Background()

	_, err := GetTenant(ctx)
	if err != ErrTenantIDNotFound {
		t.Fatalf("expected ErrTenantIDNotFound, got %v", err)
	}

	expectedTenantID := "123e4567-e89b-12d3-a456-426614174000"
	ctx = WithTenant(ctx, expectedTenantID)

	tenantID, err := GetTenant(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if tenantID != expectedTenantID {
		t.Fatalf("expected tenant ID %s, got %s", expectedTenantID, tenantID)
	}
}

func TestFacilityContext(t *testing.T) {
	ctx := context.Background()

	_, err := GetFacility(ctx)
	if err != ErrFacilityIDNotFound {
		t.Fatalf("expected ErrFacilityIDNotFound, got %v", err)
	}

	expectedFacilityID := "fac-001"
	ctx = WithFacility(ctx, expectedFacilityID)

	facilityID, err := GetFacility(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if facilityID != expectedFacilityID {
		t.Fatalf("expected facility ID %s, got %s", expectedFacilityID, facilityID)
	}
}
