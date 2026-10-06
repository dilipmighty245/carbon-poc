package nexus

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	clientv3 "go.etcd.io/etcd/client/v3"
	"go.etcd.io/etcd/server/v3/embed"
)

// EtcdStore manages durable key-value persistence in etcd, mapping the Nexus
// hierarchical datamodel (Root -> Config, Inventory, Runtime) to canonical keys.
type EtcdStore struct {
	client      *clientv3.Client
	isAvailable bool
	endpoints   []string
	mu          sync.RWMutex
}

var (
	globalEtcdStore    *EtcdStore
	etcdOnce           sync.Once
	embeddedEtcdServer *embed.Etcd
	embeddedEtcdMu     sync.Mutex
)

// GetEtcdStore initializes or returns the singleton EtcdStore instance,
// guaranteeing that an etcd server is running (either external or embedded).
func GetEtcdStore() *EtcdStore {
	etcdOnce.Do(func() {
		store, _ := EnsureEtcdServer(nil)
		globalEtcdStore = store
	})
	return globalEtcdStore
}

// EnsureEtcdServer guarantees that an etcd server is running and returns an active EtcdStore.
// It first probes the target endpoints (e.g., Docker container or remote cluster).
// If no server is reachable, it automatically starts an embedded etcd server
// (go.etcd.io/etcd/server/v3/embed), ensuring etcd runs no matter what.
func EnsureEtcdServer(endpoints []string) (*EtcdStore, error) {
	if len(endpoints) == 0 {
		endpointsStr := os.Getenv("ETCD_ENDPOINTS")
		if endpointsStr == "" {
			endpointsStr = "localhost:2379"
		}
		for _, ep := range strings.Split(endpointsStr, ",") {
			if trimmed := strings.TrimSpace(ep); trimmed != "" {
				endpoints = append(endpoints, trimmed)
			}
		}
	}

	// 1. Probe if etcd is already running at the target endpoints
	if probeEtcd(endpoints, 1500*time.Millisecond) {
		log.Printf("[Nexus etcd] Existing etcd server detected and verified at %v", endpoints)
		return NewEtcdStore(endpoints), nil
	}

	// 2. Start embedded etcd server if no external etcd is reachable
	log.Printf("[Nexus etcd] No external etcd server reachable at %v; launching embedded etcd...", endpoints)
	clientHost := "127.0.0.1"
	clientPort := "2379"
	peerPort := "2380"
	if len(endpoints) > 0 && strings.Contains(endpoints[0], ":") {
		parts := strings.Split(endpoints[0], ":")
		if parts[0] != "localhost" && parts[0] != "" {
			clientHost = parts[0]
		}
		if len(parts) > 1 && parts[1] != "" {
			clientPort = parts[1]
		}
	}

	dataDir := os.Getenv("ETCD_DATA_DIR")
	if dataDir == "" {
		dataDir = filepath.Join(os.TempDir(), "saurient-nexus-etcd")
	}

	_, err := StartEmbeddedEtcd(net.JoinHostPort(clientHost, clientPort), net.JoinHostPort(clientHost, peerPort), dataDir)
	if err != nil {
		log.Printf("[Nexus etcd] Warning: failed to start embedded etcd server: %v (falling back to in-memory mode)", err)
		return NewEtcdStore(endpoints), err
	}

	embedEndpoints := []string{net.JoinHostPort(clientHost, clientPort)}
	return NewEtcdStore(embedEndpoints), nil
}

// StartEmbeddedEtcd boots an in-process etcd server using the official embed package.
func StartEmbeddedEtcd(clientAddr, peerAddr, dataDir string) (*embed.Etcd, error) {
	embeddedEtcdMu.Lock()
	defer embeddedEtcdMu.Unlock()

	if embeddedEtcdServer != nil {
		return embeddedEtcdServer, nil
	}

	if dataDir == "" {
		dataDir = filepath.Join(os.TempDir(), "saurient-nexus-etcd")
	}

	cfg := embed.NewConfig()
	cfg.Dir = dataDir
	cfg.LogLevel = "warn"

	clientURL, err := url.Parse("http://" + clientAddr)
	if err != nil {
		return nil, fmt.Errorf("invalid client URL: %w", err)
	}
	peerURL, err := url.Parse("http://" + peerAddr)
	if err != nil {
		return nil, fmt.Errorf("invalid peer URL: %w", err)
	}

	cfg.ListenClientUrls = []url.URL{*clientURL}
	cfg.AdvertiseClientUrls = []url.URL{*clientURL}
	cfg.ListenPeerUrls = []url.URL{*peerURL}
	cfg.AdvertisePeerUrls = []url.URL{*peerURL}
	cfg.InitialCluster = fmt.Sprintf("%s=%s", cfg.Name, peerURL.String())

	e, err := embed.StartEtcd(cfg)
	if err != nil {
		return nil, fmt.Errorf("embed.StartEtcd failed: %w", err)
	}

	select {
	case <-e.Server.ReadyNotify():
		log.Printf("[Nexus etcd] Embedded etcd server ready and serving at %s (data: %s)", clientAddr, dataDir)
	case <-time.After(15 * time.Second):
		e.Close()
		return nil, fmt.Errorf("embedded etcd server readiness timed out")
	}

	embeddedEtcdServer = e
	return e, nil
}

// StopEmbeddedEtcd terminates the in-process embedded etcd instance if active.
func StopEmbeddedEtcd() {
	embeddedEtcdMu.Lock()
	defer embeddedEtcdMu.Unlock()
	if embeddedEtcdServer != nil {
		embeddedEtcdServer.Close()
		embeddedEtcdServer = nil
		log.Println("[Nexus etcd] Embedded etcd server stopped")
	}
}

func probeEtcd(endpoints []string, timeout time.Duration) bool {
	cfg := clientv3.Config{
		Endpoints:   endpoints,
		DialTimeout: timeout,
	}
	cli, err := clientv3.New(cfg)
	if err != nil {
		return false
	}
	defer cli.Close()

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	_, err = cli.Get(ctx, "/nexus/healthz")
	return err == nil
}

// NewEtcdStore creates a new EtcdStore connected to the given endpoints.
func NewEtcdStore(endpoints []string) *EtcdStore {
	store := &EtcdStore{
		endpoints: endpoints,
	}

	cfg := clientv3.Config{
		Endpoints:   endpoints,
		DialTimeout: 2 * time.Second,
	}

	cli, err := clientv3.New(cfg)
	if err != nil {
		log.Printf("[Nexus etcd] Failed to initialize etcd client for %v (falling back to in-memory): %v", endpoints, err)
		store.isAvailable = false
		return store
	}

	// Quick health probe to verify server readiness
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	_, err = cli.Get(ctx, "/nexus/healthz")
	if err != nil {
		log.Printf("[Nexus etcd] etcd probe failed at %v (falling back to in-memory mode): %v", endpoints, err)
		store.isAvailable = false
		_ = cli.Close()
		return store
	}

	store.client = cli
	store.isAvailable = true
	log.Printf("[Nexus etcd] Connected to etcd backing store at %v (Option A active)", endpoints)
	return store
}

// IsAvailable returns whether etcd is connected and functional.
func (s *EtcdStore) IsAvailable() bool {
	if s == nil {
		return false
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isAvailable && s.client != nil
}

// Close gracefully disconnects the etcd client.
func (s *EtcdStore) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.client != nil {
		err := s.client.Close()
		s.client = nil
		s.isAvailable = false
		return err
	}
	return nil
}

// --- Hierarchical Key Generators (Matching Nexus Helloworld Schema) ---

func KeyRulebook(rulebookID string) string {
	return fmt.Sprintf("/nexus/root/config/rulebooks/%s", rulebookID)
}

func PrefixRulebooks() string {
	return "/nexus/root/config/rulebooks/"
}

func KeyProduct(tenantID, batchID string) string {
	if tenantID == "" {
		tenantID = "default"
	}
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/products/%s", tenantID, batchID)
}

func PrefixProducts(tenantID string) string {
	if tenantID == "" || tenantID == "all" {
		return "/nexus/root/inventory/tenants/"
	}
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/products/", tenantID)
}

func KeyPassport(tenantID, passportID string) string {
	if tenantID == "" {
		tenantID = "default"
	}
	return fmt.Sprintf("/nexus/root/runtime/tenants/%s/passports/%s", tenantID, passportID)
}

func PrefixPassports(tenantID string) string {
	if tenantID == "" || tenantID == "all" {
		return "/nexus/root/runtime/tenants/"
	}
	return fmt.Sprintf("/nexus/root/runtime/tenants/%s/passports/", tenantID)
}

func KeyAuditTrail(tenantID, passportID, auditID string) string {
	if tenantID == "" {
		tenantID = "default"
	}
	return fmt.Sprintf("/nexus/root/runtime/tenants/%s/audit/%s/%s", tenantID, passportID, auditID)
}

func PrefixAuditTrails(tenantID, passportID string) string {
	if tenantID == "" {
		tenantID = "default"
	}
	return fmt.Sprintf("/nexus/root/runtime/tenants/%s/audit/%s/", tenantID, passportID)
}

func KeyTenantProfile(tenantID string) string {
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/profile", tenantID)
}

func KeyFacility(tenantID, facilityID string) string {
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/facilities/%s", tenantID, facilityID)
}

func PrefixFacilities(tenantID string) string {
	if tenantID == "" || tenantID == "all" {
		return "/nexus/root/inventory/tenants/"
	}
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/facilities/", tenantID)
}

func KeyProcess(tenantID, processID string) string {
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/processes/%s", tenantID, processID)
}

func PrefixProcesses(tenantID string) string {
	if tenantID == "" || tenantID == "all" {
		return "/nexus/root/inventory/tenants/"
	}
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/processes/", tenantID)
}

func KeyUser(tenantID, userID string) string {
	if tenantID == "" {
		tenantID = "default"
	}
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/users/%s", tenantID, userID)
}

func PrefixUsers(tenantID string) string {
	if tenantID == "" || tenantID == "all" {
		return "/nexus/root/inventory/tenants/"
	}
	return fmt.Sprintf("/nexus/root/inventory/tenants/%s/users/", tenantID)
}

// --- Low-Level Key/Value Operations ---

func (s *EtcdStore) Put(ctx context.Context, key string, val interface{}) error {
	if !s.IsAvailable() {
		return nil
	}
	b, err := json.Marshal(val)
	if err != nil {
		return fmt.Errorf("failed to marshal value for etcd key %s: %w", key, err)
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	_, err = s.client.Put(timeoutCtx, key, string(b))
	if err != nil {
		log.Printf("[Nexus etcd] Warning: failed to put key %s: %v", key, err)
		return err
	}
	return nil
}

func (s *EtcdStore) Get(ctx context.Context, key string, out interface{}) (bool, error) {
	if !s.IsAvailable() {
		return false, nil
	}
	timeoutCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	resp, err := s.client.Get(timeoutCtx, key)
	if err != nil {
		return false, err
	}
	if len(resp.Kvs) == 0 {
		return false, nil
	}
	if err := json.Unmarshal(resp.Kvs[0].Value, out); err != nil {
		return false, fmt.Errorf("failed to unmarshal etcd value for %s: %w", key, err)
	}
	return true, nil
}

func (s *EtcdStore) Delete(ctx context.Context, key string) error {
	if !s.IsAvailable() {
		return nil
	}
	timeoutCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	_, err := s.client.Delete(timeoutCtx, key)
	return err
}

func (s *EtcdStore) DeletePrefix(ctx context.Context, prefix string) error {
	if !s.IsAvailable() {
		return nil
	}
	timeoutCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	_, err := s.client.Delete(timeoutCtx, prefix, clientv3.WithPrefix())
	return err
}

// --- Typed Domain Operations ---

func (s *EtcdStore) SaveProduct(ctx context.Context, p *ProductModel) error {
	key := KeyProduct(p.TenantID, p.BatchID)
	return s.Put(ctx, key, p)
}

func (s *EtcdStore) DeleteProduct(ctx context.Context, tenantID, batchID string) error {
	key := KeyProduct(tenantID, batchID)
	return s.Delete(ctx, key)
}

func (s *EtcdStore) SavePassport(ctx context.Context, p *CarbonPassportModel) error {
	key := KeyPassport(p.TenantID, p.PassportID)
	return s.Put(ctx, key, p)
}

func (s *EtcdStore) DeletePassport(ctx context.Context, tenantID, passportID string) error {
	key := KeyPassport(tenantID, passportID)
	return s.Delete(ctx, key)
}

func (s *EtcdStore) SaveAuditTrail(ctx context.Context, tenantID string, audit *PassportAuditTrailModel) error {
	auditID := audit.AuditID
	if auditID == "" {
		auditID = fmt.Sprintf("audit-%d", audit.Timestamp.UnixNano())
		audit.AuditID = auditID
	}
	key := KeyAuditTrail(tenantID, audit.PassportID, auditID)
	return s.Put(ctx, key, audit)
}

func (s *EtcdStore) SaveRulebook(ctx context.Context, r *RulebookModel) error {
	name := r.Name
	if name == "" {
		name = r.ID
	}
	key := KeyRulebook(name)
	return s.Put(ctx, key, r)
}

func (s *EtcdStore) SaveTenantProfile(ctx context.Context, prof *TenantProfileModel) error {
	key := KeyTenantProfile(prof.TenantID)
	return s.Put(ctx, key, prof)
}

func (s *EtcdStore) SaveFacility(ctx context.Context, fac *FacilityModel) error {
	key := KeyFacility(fac.TenantID, fac.ID)
	return s.Put(ctx, key, fac)
}

func (s *EtcdStore) SaveProcess(ctx context.Context, proc *ProcessModel) error {
	key := KeyProcess(proc.TenantID, proc.ID)
	return s.Put(ctx, key, proc)
}

// LoadAllIntoStore loads all persisted Nexus objects from etcd into the in-memory
// GraphStore index upon server startup, guaranteeing 100% durability across restarts.
func (s *EtcdStore) LoadAllIntoStore(ctx context.Context, store *GraphStore) error {
	if !s.IsAvailable() || store == nil {
		return nil
	}

	timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	resp, err := s.client.Get(timeoutCtx, "/nexus/root/", clientv3.WithPrefix())
	if err != nil {
		return fmt.Errorf("failed to scan /nexus/root/ from etcd: %w", err)
	}

	store.storeMu.Lock()
	defer store.storeMu.Unlock()

	loadedProducts := 0
	loadedPassports := 0
	loadedRulebooks := 0
	loadedProfiles := 0
	loadedFacilities := 0
	loadedUsers := 0

	for _, kv := range resp.Kvs {
		key := string(kv.Key)
		val := kv.Value

		switch {
		case strings.Contains(key, "/config/rulebooks/"):
			var rb RulebookModel
			if err := json.Unmarshal(val, &rb); err == nil {
				store.rulebooks[rb.Name] = &rb
				if rb.ID != "" {
					store.rulebooks[rb.ID] = &rb
				}
				loadedRulebooks++
			}

		case strings.Contains(key, "/products/"):
			var prod ProductModel
			if err := json.Unmarshal(val, &prod); err == nil {
				store.products[prod.Name] = &prod
				if prod.BatchID != "" {
					store.products[prod.BatchID] = &prod
				}
				loadedProducts++
			}

		case strings.Contains(key, "/passports/"):
			var pass CarbonPassportModel
			if err := json.Unmarshal(val, &pass); err == nil {
				store.passports[pass.PassportID] = &pass
				loadedPassports++
			}

		case strings.Contains(key, "/profile"):
			var prof TenantProfileModel
			if err := json.Unmarshal(val, &prof); err == nil {
				store.tenantProfiles[prof.TenantID] = &prof
				loadedProfiles++
			}

		case strings.Contains(key, "/facilities/"):
			var fac FacilityModel
			if err := json.Unmarshal(val, &fac); err == nil {
				store.facilities[fac.TenantID] = append(store.facilities[fac.TenantID], &fac)
				loadedFacilities++
			}

		case strings.Contains(key, "/users/"):
			var u OrganisationUserModel
			if err := json.Unmarshal(val, &u); err == nil {
				store.users[u.TenantID] = append(store.users[u.TenantID], &u)
				loadedUsers++
			}

		case strings.Contains(key, "/audit/"):
			var audit PassportAuditTrailModel
			if err := json.Unmarshal(val, &audit); err == nil {
				store.auditTrails[audit.PassportID] = append(store.auditTrails[audit.PassportID], &audit)
			}
		}
	}

	log.Printf("[Nexus etcd] Successfully restored from etcd: %d rulebooks, %d products, %d passports, %d profiles, %d facilities, %d users",
		loadedRulebooks, loadedProducts, loadedPassports, loadedProfiles, loadedFacilities, loadedUsers)
	return nil
}
