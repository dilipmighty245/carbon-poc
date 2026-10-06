package nexus

import (
	"context"
	"fmt"
	"net"
	"os"
	"testing"
	"time"
)

func getFreePort(t *testing.T) int {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to get free port: %v", err)
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port
}

func TestEtcdStore_KeyGenerators(t *testing.T) {
	if k := KeyProduct("tenant-1", "batch-100"); k != "/nexus/root/inventory/tenants/tenant-1/products/batch-100" {
		t.Errorf("unexpected KeyProduct: %s", k)
	}
	if k := KeyPassport("tenant-1", "pass-200"); k != "/nexus/root/runtime/tenants/tenant-1/passports/pass-200" {
		t.Errorf("unexpected KeyPassport: %s", k)
	}
	if k := KeyRulebook("cbam-steel-v1"); k != "/nexus/root/config/rulebooks/cbam-steel-v1" {
		t.Errorf("unexpected KeyRulebook: %s", k)
	}
	if k := KeyTenantProfile("tenant-1"); k != "/nexus/root/inventory/tenants/tenant-1/profile" {
		t.Errorf("unexpected KeyTenantProfile: %s", k)
	}
	if k := KeyFacility("tenant-1", "fac-1"); k != "/nexus/root/inventory/tenants/tenant-1/facilities/fac-1" {
		t.Errorf("unexpected KeyFacility: %s", k)
	}
	if k := KeyProcess("tenant-1", "proc-1"); k != "/nexus/root/inventory/tenants/tenant-1/processes/proc-1" {
		t.Errorf("unexpected KeyProcess: %s", k)
	}
	if k := KeyUser("tenant-1", "usr-1"); k != "/nexus/root/inventory/tenants/tenant-1/users/usr-1" {
		t.Errorf("unexpected KeyUser: %s", k)
	}
	if p := PrefixUsers("tenant-1"); p != "/nexus/root/inventory/tenants/tenant-1/users/" {
		t.Errorf("unexpected PrefixUsers: %s", p)
	}
}

func TestEtcdStore_GracefulFallbackWhenUnavailable(t *testing.T) {
	// Connect to non-existent endpoint
	dummyStore := NewEtcdStore([]string{"127.0.0.1:54321"})
	if dummyStore.IsAvailable() {
		t.Fatalf("expected store to be unavailable for unreachable endpoint")
	}

	ctx := context.Background()
	prod := &ProductModel{
		Name:     "Test",
		TenantID: "tenant-dummy",
		BatchID:  "batch-dummy",
	}

	// Should safely return nil or false without panic
	if err := dummyStore.SaveProduct(ctx, prod); err != nil {
		t.Errorf("expected nil error on unavailable store, got: %v", err)
	}
	if err := dummyStore.DeleteProduct(ctx, "tenant-dummy", "batch-dummy"); err != nil {
		t.Errorf("expected nil error on unavailable store, got: %v", err)
	}

	var out ProductModel
	found, err := dummyStore.Get(ctx, "/nexus/root/inventory/tenants/tenant-dummy/products/batch-dummy", &out)
	if err != nil || found {
		t.Errorf("expected not found and nil err, got found=%v err=%v", found, err)
	}
}

func TestEtcdStore_EmbeddedServerAndPersistence(t *testing.T) {
	clientPort := getFreePort(t)
	peerPort := getFreePort(t)

	clientAddr := fmt.Sprintf("127.0.0.1:%d", clientPort)
	peerAddr := fmt.Sprintf("127.0.0.1:%d", peerPort)
	tempDir, err := os.MkdirTemp("", "nexus-etcd-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	embedServer, err := StartEmbeddedEtcd(clientAddr, peerAddr, tempDir)
	if err != nil {
		t.Skipf("Skipping embedded etcd live test (environment restricted): %v", err)
		return
	}
	defer StopEmbeddedEtcd()
	_ = embedServer

	store := NewEtcdStore([]string{clientAddr})
	if !store.IsAvailable() {
		t.Fatalf("expected embedded etcd store to be available at %s", clientAddr)
	}
	defer store.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 1. Save and retrieve product
	prod := &ProductModel{
		Name:            "ST-COIL-BATCH-001",
		TenantID:        "tenant-etcd-test",
		BatchID:         "BATCH-001",
		ProductName:     "Hot-Rolled Steel Coil",
		CommodityType:   "Steel",
		ActivityDataRaw: `{"fuel_liters": 100}`,
		Phase:           "Calculated",
		CreatedAt:       time.Now(),
	}
	if err := store.SaveProduct(ctx, prod); err != nil {
		t.Fatalf("failed to save product to etcd: %v", err)
	}

	// 2. Save rulebook
	rb := &RulebookModel{
		ID:            "rb-test-01",
		Name:          "rulebook-steel-test",
		CommodityType: "Steel",
		Scope1Formula: "fuel_liters * 2.68",
	}
	if err := store.SaveRulebook(ctx, rb); err != nil {
		t.Fatalf("failed to save rulebook to etcd: %v", err)
	}

	// 3. Save passport
	pass := &CarbonPassportModel{
		PassportID:         "PASS-TEST-001",
		TenantID:           "tenant-etcd-test",
		BatchNumber:        "BATCH-001",
		CommodityType:      "Steel",
		VerificationStatus: "Verified",
		TotalFootprintKg:   268.0,
		IssuedAt:           time.Now(),
	}
	if err := store.SavePassport(ctx, pass); err != nil {
		t.Fatalf("failed to save passport to etcd: %v", err)
	}

	// 4. Verify LoadAllIntoStore restores into GraphStore
	targetGraphStore := &GraphStore{
		passports:      make(map[string]*CarbonPassportModel),
		products:       make(map[string]*ProductModel),
		rulebooks:      make(map[string]*RulebookModel),
		auditTrails:    make(map[string][]*PassportAuditTrailModel),
		tenantProfiles: make(map[string]*TenantProfileModel),
		facilities:     make(map[string][]*FacilityModel),
	}

	if err := store.LoadAllIntoStore(ctx, targetGraphStore); err != nil {
		t.Fatalf("failed to load all from etcd: %v", err)
	}

	if p, ok := targetGraphStore.products["ST-COIL-BATCH-001"]; !ok || p.BatchID != "BATCH-001" {
		t.Errorf("product was not properly restored into GraphStore: %+v", p)
	}
	if r, ok := targetGraphStore.rulebooks["rulebook-steel-test"]; !ok || r.ID != "rb-test-01" {
		t.Errorf("rulebook was not properly restored into GraphStore: %+v", r)
	}
	if ps, ok := targetGraphStore.passports["PASS-TEST-001"]; !ok || ps.BatchNumber != "BATCH-001" {
		t.Errorf("passport was not properly restored into GraphStore: %+v", ps)
	}

	// 5. Delete product and verify
	if err := store.DeleteProduct(ctx, "tenant-etcd-test", "BATCH-001"); err != nil {
		t.Fatalf("failed to delete product: %v", err)
	}
}
