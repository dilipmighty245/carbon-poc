package tenant

import (
	"context"
	"errors"
)

type contextKey string

const (
	tenantIDKey   contextKey = "tenant_id"
	facilityIDKey contextKey = "facility_id"
)

var (
	ErrTenantIDNotFound   = errors.New("tenant ID not found in context")
	ErrFacilityIDNotFound = errors.New("facility ID not found in context")
)

// WithTenant injects the tenant ID into the context.
func WithTenant(ctx context.Context, tenantID string) context.Context {
	return context.WithValue(ctx, tenantIDKey, tenantID)
}

// GetTenant retrieves the tenant ID from the context.
func GetTenant(ctx context.Context) (string, error) {
	val := ctx.Value(tenantIDKey)
	if tenantID, ok := val.(string); ok && tenantID != "" {
		return tenantID, nil
	}
	return "", ErrTenantIDNotFound
}

// WithFacility injects the facility ID into the context.
func WithFacility(ctx context.Context, facilityID string) context.Context {
	return context.WithValue(ctx, facilityIDKey, facilityID)
}

// GetFacility retrieves the facility ID from the context.
func GetFacility(ctx context.Context) (string, error) {
	val := ctx.Value(facilityIDKey)
	if facilityID, ok := val.(string); ok && facilityID != "" {
		return facilityID, nil
	}
	return "", ErrFacilityIDNotFound
}
