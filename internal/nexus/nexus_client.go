package nexus

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	configv1 "saurient-platform/build/apis/config.saurient.io/v1"
	inventoryv1 "saurient-platform/build/apis/inventory.saurient.io/v1"
	rootv1 "saurient-platform/build/apis/root.saurient.io/v1"
	runtimev1 "saurient-platform/build/apis/runtime.saurient.io/v1"
	nexus_client "saurient-platform/build/nexus-client"
)

var (
	globalNexusClient     *nexus_client.Clientset
	globalNexusClientOnce sync.Once
	nexusClientMu         sync.RWMutex
)

// GetNexusClient returns the shared singleton Nexus clientset.
// If not yet initialized, it creates one (trying in-cluster/KUBECONFIG first, then fake client).
func GetNexusClient() *nexus_client.Clientset {
	nexusClientMu.RLock()
	if globalNexusClient != nil {
		defer nexusClientMu.RUnlock()
		return globalNexusClient
	}
	nexusClientMu.RUnlock()

	nexusClientMu.Lock()
	defer nexusClientMu.Unlock()
	if globalNexusClient == nil {
		globalNexusClient, _ = NewNexusClient("")
		if globalNexusClient != nil {
			ctx := context.Background()
			_, _ = EnsureGraphRoots(ctx, globalNexusClient)
			_ = SeedDefaultNexusData(ctx, globalNexusClient)
		}
	}
	return globalNexusClient
}

// SetNexusClient sets or overrides the shared singleton Nexus clientset (useful for testing).
func SetNexusClient(c *nexus_client.Clientset) {
	nexusClientMu.Lock()
	defer nexusClientMu.Unlock()
	globalNexusClient = c
	if globalNexusClient != nil {
		ctx := context.Background()
		_, _ = EnsureGraphRoots(ctx, globalNexusClient)
		_ = SeedDefaultNexusData(ctx, globalNexusClient)
	}
}

// ResetNexusClient wipes the in-memory Nexus graph and initializes clean root singletons and standard reference rulebooks.
func ResetNexusClient(ctx context.Context) error {
	nexusClientMu.Lock()
	defer nexusClientMu.Unlock()
	globalNexusClient = nexus_client.NewFakeClient()
	_, err := EnsureGraphRoots(ctx, globalNexusClient)
	if err != nil {
		return err
	}
	return SeedDefaultNexusData(ctx, globalNexusClient)
}

// NewNexusClient builds a typed Nexus clientset.
// It tries to connect via:
// 1. Provided kubeconfig path
// 2. KUBECONFIG environment variable
// 3. In-cluster configuration
// If all cluster connections fail or are omitted, it initializes an in-memory FakeClient.
func NewNexusClient(kubeconfigPath string) (*nexus_client.Clientset, error) {
	var cfg *rest.Config
	var err error

	if kubeconfigPath == "" {
		kubeconfigPath = os.Getenv("KUBECONFIG")
	}

	if kubeconfigPath != "" {
		cfg, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
		if err != nil {
			log.Printf("[NexusClient] Could not build config from %s: %v, attempting in-cluster config", kubeconfigPath, err)
		}
	}

	if cfg == nil {
		cfg, err = rest.InClusterConfig()
	}

	if err == nil && cfg != nil {
		client, clientErr := nexus_client.NewForConfig(cfg)
		if clientErr == nil {
			log.Printf("[NexusClient] Connected to Nexus cluster at %s", cfg.Host)
			return client, nil
		}
		log.Printf("[NexusClient] Failed to create Nexus client from cluster config: %v", clientErr)
	}

	log.Printf("[NexusClient] Running with memory-backed Nexus FakeClient")
	return nexus_client.NewFakeClient(), nil
}

// EnsureGraphRoots anchors the singleton root node and top-level branches (Config, Inventory, Runtime)
// in the Nexus graph, matching the VMware/Tanzu Nexus graph topology.
func EnsureGraphRoots(ctx context.Context, client *nexus_client.Clientset) (*nexus_client.RootRoot, error) {
	if client == nil {
		return nil, fmt.Errorf("nexus client is nil")
	}

	// 1. Root Singleton Node
	root, err := client.GetRootRoot(ctx)
	if nexus_client.IsNotFound(err) {
		log.Println("[NexusGraph] Root node not found; creating Root singleton")
		root, err = client.AddRootRoot(ctx, &rootv1.Root{
			ObjectMeta: metav1.ObjectMeta{
				Name: "default",
			},
		})
		if err != nil && !nexus_client.IsAlreadyExists(err) {
			return nil, fmt.Errorf("failed to create Root node: %w", err)
		}
		if root == nil {
			root, err = client.GetRootRoot(ctx)
		}
	} else if err != nil {
		return nil, fmt.Errorf("failed to fetch Root node: %w", err)
	}

	if root == nil {
		return nil, fmt.Errorf("unable to obtain Root node from Nexus graph")
	}

	// 2. Config Child Singleton
	cfgNode, err := root.GetConfig(ctx)
	if err != nil || cfgNode == nil {
		log.Println("[NexusGraph] Config node not found; creating Config child under Root")
		_, err = root.AddConfig(ctx, &configv1.Config{
			ObjectMeta: metav1.ObjectMeta{
				Name: "default",
			},
		})
		if err != nil && !nexus_client.IsAlreadyExists(err) {
			log.Printf("[NexusGraph] Note on creating Config node: %v", err)
		}
	}

	// 3. Inventory Child Singleton
	invNode, err := root.GetInventory(ctx)
	if err != nil || invNode == nil {
		log.Println("[NexusGraph] Inventory node not found; creating Inventory child under Root")
		_, err = root.AddInventory(ctx, &inventoryv1.Inventory{
			ObjectMeta: metav1.ObjectMeta{
				Name: "default",
			},
		})
		if err != nil && !nexus_client.IsAlreadyExists(err) {
			log.Printf("[NexusGraph] Note on creating Inventory node: %v", err)
		}
	}

	// 4. Runtime Child Singleton
	rtNode, err := root.GetRuntime(ctx)
	if err != nil || rtNode == nil {
		log.Println("[NexusGraph] Runtime node not found; creating Runtime child under Root")
		_, err = root.AddRuntime(ctx, &runtimev1.Runtime{
			ObjectMeta: metav1.ObjectMeta{
				Name: "default",
			},
		})
		if err != nil && !nexus_client.IsAlreadyExists(err) {
			log.Printf("[NexusGraph] Note on creating Runtime node: %v", err)
		}
	}

	return root, nil
}

// EnsureTenantNode verifies or creates a Tenant node in the Inventory branch of the Nexus graph.
func EnsureTenantNode(ctx context.Context, client *nexus_client.Clientset, tenantID string) (*nexus_client.InventoryTenant, error) {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	inv, err := root.GetInventory(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Inventory branch: %w", err)
	}

	tenantNode, err := inv.GetTenants(ctx, tenantID)
	if nexus_client.IsChildNotFound(err) || tenantNode == nil {
		tenantNode, err = inv.AddTenants(ctx, &inventoryv1.Tenant{
			ObjectMeta: metav1.ObjectMeta{
				Name: tenantID,
			},
			Spec: inventoryv1.TenantSpec{
				TenantID:  tenantID,
				LegalName: tenantID,
			},
		})
		if err != nil && !nexus_client.IsAlreadyExists(err) {
			return nil, fmt.Errorf("failed to create Tenant %s under Inventory: %w", tenantID, err)
		}
		if tenantNode == nil {
			tenantNode, err = inv.GetTenants(ctx, tenantID)
		}
	}
	return tenantNode, err
}

// CreateProductNode creates a real Product node under the specified Tenant in the Nexus graph.
func CreateProductNode(ctx context.Context, client *nexus_client.Clientset, tenantID string, spec inventoryv1.ProductSpec) (*nexus_client.InventoryProduct, error) {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}

	resourceName := spec.ProductID
	if resourceName == "" {
		resourceName = spec.BatchID
	}

	// Read-before-write check to prevent duplicate key errors
	existing, getErr := tenantNode.GetProducts(ctx, resourceName)
	if getErr == nil && existing != nil {
		existing.Spec = spec
		if updErr := existing.Update(ctx); updErr == nil {
			return existing, nil
		}
	}

	productNode, err := tenantNode.AddProducts(ctx, &inventoryv1.Product{
		ObjectMeta: metav1.ObjectMeta{
			Name: resourceName,
		},
		Spec: spec,
	})
	if err != nil && nexus_client.IsAlreadyExists(err) {
		existing, getErr := tenantNode.GetProducts(ctx, resourceName)
		if getErr == nil && existing != nil {
			existing.Spec = spec
			if updErr := existing.Update(ctx); updErr == nil {
				return existing, nil
			}
		}
	}
	if err != nil {
		return nil, fmt.Errorf("failed to add Product node %s under Tenant %s: %w", resourceName, tenantID, err)
	}
	return productNode, nil
}

// GetProductNode retrieves a Product node under a Tenant by its display name / batch ID.
func GetProductNode(ctx context.Context, client *nexus_client.Clientset, tenantID, name string) (*nexus_client.InventoryProduct, error) {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}
	return tenantNode.GetProducts(ctx, name)
}

// DeleteProductNode removes a Product node under a Tenant in the Nexus graph.
func DeleteProductNode(ctx context.Context, client *nexus_client.Clientset, tenantID, name string) error {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return err
	}
	return tenantNode.DeleteProducts(ctx, name)
}

// CreatePassportNode adds a CarbonPassport node under the Runtime branch and links it to its Product node.
func CreatePassportNode(ctx context.Context, client *nexus_client.Clientset, spec runtimev1.CarbonPassportSpec, productNode *nexus_client.InventoryProduct) (*nexus_client.RuntimeCarbonPassport, error) {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	runtimeNode, err := root.GetRuntime(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Runtime branch: %w", err)
	}

	if spec.VerificationStatus == "" {
		spec.VerificationStatus = StatusDraft
	}

	// Read-before-write check to avoid duplicate key errors
	existing, getErr := runtimeNode.GetPassports(ctx, spec.PassportID)
	if getErr == nil && existing != nil {
		// Retain existing lifecycle state if already promoted past Draft
		if existing.Spec.VerificationStatus != "" && (spec.VerificationStatus == StatusDraft || spec.VerificationStatus == "") {
			spec.VerificationStatus = existing.Spec.VerificationStatus
		}
		if existing.Spec.Frozen && !spec.Frozen {
			spec.Frozen = true
			spec.FrozenAt = existing.Spec.FrozenAt
		}
		existing.Spec = spec
		if updErr := existing.Update(ctx); updErr == nil {
			if productNode != nil {
				_ = existing.LinkProductRef(ctx, productNode)
			}
			return existing, nil
		}
	}

	passportNode, err := runtimeNode.AddPassports(ctx, &runtimev1.CarbonPassport{
		ObjectMeta: metav1.ObjectMeta{
			Name: spec.PassportID,
		},
		Spec: spec,
	})
	if err != nil && nexus_client.IsAlreadyExists(err) {
		existing, getErr := runtimeNode.GetPassports(ctx, spec.PassportID)
		if getErr == nil && existing != nil {
			existing.Spec = spec
			if updErr := existing.Update(ctx); updErr == nil {
				if productNode != nil {
					_ = existing.LinkProductRef(ctx, productNode)
				}
				return existing, nil
			}
		}
		return nil, fmt.Errorf("failed to create CarbonPassport node %s: %w", spec.PassportID, err)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to create CarbonPassport node %s: %w", spec.PassportID, err)
	}

	// Soft Cross-Graph Link: Runtime.CarbonPassport -> Inventory.Product
	if productNode != nil {
		if linkErr := passportNode.LinkProductRef(ctx, productNode); linkErr != nil {
			log.Printf("[NexusGraph] Warning: failed to link CarbonPassport %s to Product %s: %v", spec.PassportID, productNode.DisplayName(), linkErr)
		}
	}

	// Add initial AuditRecord under CarbonPassport
	auditName := fmt.Sprintf("audit-%d", time.Now().UnixNano())
	_, _ = passportNode.AddAuditRecords(ctx, &runtimev1.AuditRecord{
		ObjectMeta: metav1.ObjectMeta{
			Name: auditName,
		},
		Spec: runtimev1.AuditRecordSpec{
			ActionType:   "Calculated",
			PreviousHash: "",
			CurrentHash:  spec.DataHash,
			Timestamp:    time.Now().UTC().Format(time.RFC3339),
		},
	})

	return passportNode, nil
}

// ListProductNodes returns all Product nodes for a specific tenant, or across all tenants if tenantID is empty.
func ListProductNodes(ctx context.Context, client *nexus_client.Clientset, tenantID string) ([]*nexus_client.InventoryProduct, error) {
	if client == nil {
		return nil, fmt.Errorf("nexus client is nil")
	}

	// Scoped graph traversal: when tenantID is specified, fetch directly from that Tenant node
	if tenantID != "" {
		tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
		if err != nil {
			return nil, err
		}
		return tenantNode.GetAllProducts(ctx)
	}

	// Cluster-wide sweep across all tenants (e.g. background reconciler sweep loop)
	allProds, err := client.Inventory().ListProducts(ctx, metav1.ListOptions{})
	if err == nil {
		return allProds, nil
	}

	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	inv, err := root.GetInventory(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Inventory branch: %w", err)
	}

	var results []*nexus_client.InventoryProduct
	tenants, err := inv.GetAllTenants(ctx)
	if err != nil {
		return nil, err
	}
	for _, t := range tenants {
		prods, err := t.GetAllProducts(ctx)
		if err != nil {
			continue
		}
		results = append(results, prods...)
	}
	return results, nil
}

// GetPassportNode retrieves a CarbonPassport node by its passport ID from the Runtime branch.
func GetPassportNode(ctx context.Context, client *nexus_client.Clientset, passportID string) (*nexus_client.RuntimeCarbonPassport, error) {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	rt, err := root.GetRuntime(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Runtime branch: %w", err)
	}

	return rt.GetPassports(ctx, passportID)
}

// GetPassportNodeByBatchID searches the Runtime branch for a CarbonPassport with matching BatchID.
func GetPassportNodeByBatchID(ctx context.Context, client *nexus_client.Clientset, batchID string) (*nexus_client.RuntimeCarbonPassport, error) {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	rt, err := root.GetRuntime(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Runtime branch: %w", err)
	}

	passports, err := rt.GetAllPassports(ctx)
	if err != nil {
		return nil, err
	}
	for _, p := range passports {
		if p != nil && (p.Spec.BatchID == batchID || p.DisplayName() == batchID) {
			return p, nil
		}
	}
	return nil, fmt.Errorf("passport not found for batch ID: %s", batchID)
}

// ListPassportNodes returns all CarbonPassport nodes under Runtime, optionally filtered by tenantID.
func ListPassportNodes(ctx context.Context, client *nexus_client.Clientset, tenantID string) ([]*nexus_client.RuntimeCarbonPassport, error) {
	if client == nil {
		return nil, fmt.Errorf("nexus client is nil")
	}

	allPassports, err := client.Runtime().ListCarbonPassports(ctx, metav1.ListOptions{})
	if err == nil {
		if tenantID == "" || tenantID == "all" {
			return allPassports, nil
		}
		var filtered []*nexus_client.RuntimeCarbonPassport
		for _, p := range allPassports {
			if p != nil && p.Spec.TenantID == tenantID {
				filtered = append(filtered, p)
			}
		}
		return filtered, nil
	}

	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	rt, err := root.GetRuntime(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Runtime branch: %w", err)
	}

	passports, err := rt.GetAllPassports(ctx)
	if err != nil {
		return nil, err
	}

	if tenantID == "" {
		return passports, nil
	}

	var filtered []*nexus_client.RuntimeCarbonPassport
	for _, p := range passports {
		if p != nil && (p.Spec.TenantID == tenantID || tenantID == "all") {
			filtered = append(filtered, p)
		}
	}
	return filtered, nil
}

// DeletePassportNode removes a CarbonPassport node by display name / ID from the Runtime branch.
func DeletePassportNode(ctx context.Context, client *nexus_client.Clientset, passportID string) error {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return err
	}

	rt, err := root.GetRuntime(ctx)
	if err != nil {
		return fmt.Errorf("failed to get Runtime branch: %w", err)
	}

	return rt.DeletePassports(ctx, passportID)
}

// CreateRulebookNode creates a calculation rulebook node under the Config branch.
func CreateRulebookNode(ctx context.Context, client *nexus_client.Clientset, name string, spec configv1.RulebookSpec) (*nexus_client.ConfigRulebook, error) {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	cfg, err := root.GetConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Config branch: %w", err)
	}

	if spec.RulebookID == "" {
		spec.RulebookID = name
	}

	return cfg.AddRulebooks(ctx, &configv1.Rulebook{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Spec: spec,
	})
}

// GetRulebookNode retrieves a calculation rulebook from the Config branch by name.
func GetRulebookNode(ctx context.Context, client *nexus_client.Clientset, name string) (*nexus_client.ConfigRulebook, error) {
	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	cfg, err := root.GetConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Config branch: %w", err)
	}

	return cfg.GetRulebooks(ctx, name)
}

// ListRulebookNodes returns all calculation rulebooks under the Config branch.
func ListRulebookNodes(ctx context.Context, client *nexus_client.Clientset) ([]*nexus_client.ConfigRulebook, error) {
	if client == nil {
		return nil, fmt.Errorf("nexus client is nil")
	}

	allRbs, err := client.Config().ListRulebooks(ctx, metav1.ListOptions{})
	if err == nil {
		return allRbs, nil
	}

	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	cfg, err := root.GetConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Config branch: %w", err)
	}

	return cfg.GetAllRulebooks(ctx)
}

// CreateUserNode adds or updates a User node under the specified Tenant in the Nexus graph.
func CreateUserNode(ctx context.Context, client *nexus_client.Clientset, tenantID string, spec inventoryv1.UserSpec) (*nexus_client.InventoryUser, error) {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}

	resourceName := spec.UserID
	if resourceName == "" {
		resourceName = spec.Email
	}

	// Read-before-write check to avoid duplicate key collisions
	existing, getErr := tenantNode.GetUsers(ctx, resourceName)
	if getErr == nil && existing != nil {
		existing.Spec = spec
		if updErr := existing.Update(ctx); updErr == nil {
			return existing, nil
		}
	}

	userNode, err := tenantNode.AddUsers(ctx, &inventoryv1.User{
		ObjectMeta: metav1.ObjectMeta{
			Name: resourceName,
		},
		Spec: spec,
	})
	if err != nil && nexus_client.IsAlreadyExists(err) {
		existing, getErr := tenantNode.GetUsers(ctx, resourceName)
		if getErr == nil && existing != nil {
			existing.Spec = spec
			if updErr := existing.Update(ctx); updErr == nil {
				return existing, nil
			}
		}
	}
	if err != nil {
		return nil, fmt.Errorf("failed to add User node %s under Tenant %s: %w", resourceName, tenantID, err)
	}
	return userNode, nil
}

// GetUserNode retrieves a User node under a Tenant by user ID.
func GetUserNode(ctx context.Context, client *nexus_client.Clientset, tenantID, userID string) (*nexus_client.InventoryUser, error) {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}
	return tenantNode.GetUsers(ctx, userID)
}

// GetUserNodeByEmail searches for a User node under a Tenant by email, or across all tenants if tenantID is empty.
func GetUserNodeByEmail(ctx context.Context, client *nexus_client.Clientset, tenantID, email string) (*nexus_client.InventoryUser, error) {
	if tenantID != "" {
		users, err := ListUserNodes(ctx, client, tenantID)
		if err == nil {
			for _, u := range users {
				if u != nil && strings.EqualFold(u.Spec.Email, email) {
					return u, nil
				}
			}
		}
	}

	// Search across all tenants in the Nexus datamodel
	allUsers, err := ListUserNodes(ctx, client, "")
	if err == nil {
		for _, u := range allUsers {
			if u != nil && strings.EqualFold(u.Spec.Email, email) {
				return u, nil
			}
		}
	}
	return nil, fmt.Errorf("user with email %s not found in datamodel", email)
}

// ListUserNodes returns all User nodes for a specific tenant, or across all tenants if tenantID is empty.
func ListUserNodes(ctx context.Context, client *nexus_client.Clientset, tenantID string) ([]*nexus_client.InventoryUser, error) {
	if client == nil {
		return nil, fmt.Errorf("nexus client is nil")
	}

	// Scoped graph traversal: when tenantID is specified, fetch directly from that Tenant node
	if tenantID != "" {
		tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
		if err != nil {
			return nil, err
		}
		return tenantNode.GetAllUsers(ctx)
	}

	// Cluster-wide list across all tenants
	allUsers, err := client.Inventory().ListUsers(ctx, metav1.ListOptions{})
	if err == nil && len(allUsers) > 0 {
		return allUsers, nil
	}

	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	inv, err := root.GetInventory(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Inventory branch: %w", err)
	}

	var results []*nexus_client.InventoryUser
	if tenantID != "" {
		tenantNode, err := inv.GetTenants(ctx, tenantID)
		if err != nil {
			if nexus_client.IsChildNotFound(err) {
				return results, nil
			}
			return nil, err
		}
		usrs, err := tenantNode.GetAllUsers(ctx)
		if err != nil {
			return nil, err
		}
		return usrs, nil
	}

	tenants, err := inv.GetAllTenants(ctx)
	if err != nil {
		return nil, err
	}
	for _, t := range tenants {
		if t != nil {
			usrs, err := t.GetAllUsers(ctx)
			if err == nil {
				results = append(results, usrs...)
			}
		}
	}
	return results, nil
}

// UpdateUserRoleNode updates the role on an existing User node under a Tenant.
func UpdateUserRoleNode(ctx context.Context, client *nexus_client.Clientset, tenantID, userID, newRole string) error {
	uNode, err := GetUserNode(ctx, client, tenantID, userID)
	if err != nil || uNode == nil {
		// Fallback search by ID across all tenant users
		allUsers, listErr := ListUserNodes(ctx, client, tenantID)
		if listErr == nil {
			for _, u := range allUsers {
				if u != nil && (u.Spec.UserID == userID || u.DisplayName() == userID) {
					uNode = u
					break
				}
			}
		}
	}
	if uNode == nil {
		return fmt.Errorf("user %s not found under tenant %s", userID, tenantID)
	}

	uNode.Spec.Role = newRole
	return uNode.Update(ctx)
}

// DeleteUserNode removes a User node under a Tenant.
func DeleteUserNode(ctx context.Context, client *nexus_client.Clientset, tenantID, userID string) error {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return err
	}
	return tenantNode.DeleteUsers(ctx, userID)
}

// UserModelFromNode converts a Nexus InventoryUser node to OrganisationUserModel.
func UserModelFromNode(uNode *nexus_client.InventoryUser) *OrganisationUserModel {
	if uNode == nil {
		return nil
	}
	spec := uNode.Spec
	id := spec.UserID
	if id == "" {
		id = uNode.DisplayName()
	}
	return &OrganisationUserModel{
		ID:            id,
		TenantID:      spec.TenantID,
		Name:          spec.Name,
		Email:         spec.Email,
		PasswordHash:  spec.PasswordHash,
		Salt:          spec.Salt,
		Role:          spec.Role,
		FacilityScope: spec.FacilityScope,
		LastLogin:     spec.LastLogin,
		Status:        spec.Status,
		CreatedAt:     time.Now(),
	}
}
func CarbonPassportModelFromNode(pNode *nexus_client.RuntimeCarbonPassport) *CarbonPassportModel {
	if pNode == nil {
		return nil
	}
	spec := pNode.Spec
	issuedAt, _ := time.Parse(time.RFC3339, spec.IssuedAt)
	if issuedAt.IsZero() {
		issuedAt = time.Now()
	}

	var calcDetails []byte
	if spec.CalculationDetails != "" {
		calcDetails = []byte(spec.CalculationDetails)
	} else if spec.PassportDataRaw != "" {
		calcDetails = []byte(spec.PassportDataRaw)
	}

	passportID := spec.PassportID
	if passportID == "" {
		passportID = pNode.DisplayName()
	}

	batchNumber := spec.BatchID
	if batchNumber == "" {
		batchNumber = pNode.DisplayName()
	}

	return &CarbonPassportModel{
		PassportID:         passportID,
		TenantID:           spec.TenantID,
		FacilityID:         spec.FacilityID,
		BatchNumber:        batchNumber,
		CommodityType:      spec.CommodityType,
		VerificationStatus: spec.VerificationStatus,
		Scope1KgCO2e:       spec.Scope1Kg,
		Scope2KgCO2e:       spec.Scope2Kg,
		Scope3KgCO2e:       spec.Scope3Kg,
		TotalFootprintKg:   spec.TotalFootprintKg,
		CalculationDetails: calcDetails,
		IssuedAt:           issuedAt,
		DataHash:           spec.DataHash,
	}
}

// SaveFacilityNode creates or updates a Facility node under the specified Tenant in the Nexus graph.
func SaveFacilityNode(ctx context.Context, client *nexus_client.Clientset, tenantID string, spec inventoryv1.FacilitySpec) (*nexus_client.InventoryFacility, error) {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}

	resourceName := spec.FacilityID
	if resourceName == "" {
		resourceName = spec.Name
	}

	existing, getErr := tenantNode.GetFacilities(ctx, resourceName)
	if getErr == nil && existing != nil {
		existing.Spec = spec
		if updErr := existing.Update(ctx); updErr == nil {
			return existing, nil
		}
	}

	facilityNode, err := tenantNode.AddFacilities(ctx, &inventoryv1.Facility{
		ObjectMeta: metav1.ObjectMeta{
			Name: resourceName,
		},
		Spec: spec,
	})
	if err != nil && nexus_client.IsAlreadyExists(err) {
		existing, getErr := tenantNode.GetFacilities(ctx, resourceName)
		if getErr == nil && existing != nil {
			existing.Spec = spec
			if updErr := existing.Update(ctx); updErr == nil {
				return existing, nil
			}
		}
	}
	if err != nil {
		return nil, fmt.Errorf("failed to add Facility node %s under Tenant %s: %w", resourceName, tenantID, err)
	}

	// Connect 1 Sattric meter child node under this facility in the Nexus datamodel
	meterName := fmt.Sprintf("sattric-meter-%s", resourceName)
	if _, getMeterErr := facilityNode.GetMeters(ctx, meterName); getMeterErr != nil {
		_, _ = facilityNode.AddMeters(ctx, &inventoryv1.Meter{
			ObjectMeta: metav1.ObjectMeta{
				Name: meterName,
			},
			Spec: inventoryv1.MeterSpec{
				MeterID:      meterName,
				MeterType:    "Sattric IoT Telemetry",
				Manufacturer: "Sattric Power Systems",
			},
		})
	}

	return facilityNode, nil
}

// GetFacilityNode retrieves a Facility node under a Tenant by facility ID / name.
func GetFacilityNode(ctx context.Context, client *nexus_client.Clientset, tenantID, facilityID string) (*nexus_client.InventoryFacility, error) {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return nil, err
	}
	return tenantNode.GetFacilities(ctx, facilityID)
}

// ListFacilityNodes returns all Facility nodes for a specific tenant, or across all tenants if tenantID is empty.
func ListFacilityNodes(ctx context.Context, client *nexus_client.Clientset, tenantID string) ([]*nexus_client.InventoryFacility, error) {
	if client == nil {
		return nil, fmt.Errorf("nexus client is nil")
	}

	// Scoped graph traversal: when tenantID is specified, fetch directly from that Tenant node
	if tenantID != "" {
		tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
		if err != nil {
			return nil, err
		}
		return tenantNode.GetAllFacilities(ctx)
	}

	// Cluster-wide list across all tenants
	allFacs, err := client.Inventory().ListFacilities(ctx, metav1.ListOptions{})
	if err == nil {
		return allFacs, nil
	}

	root, err := EnsureGraphRoots(ctx, client)
	if err != nil {
		return nil, err
	}

	inv, err := root.GetInventory(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Inventory branch: %w", err)
	}

	var results []*nexus_client.InventoryFacility
	if tenantID != "" {
		tenantNode, err := inv.GetTenants(ctx, tenantID)
		if err != nil {
			if nexus_client.IsChildNotFound(err) {
				return results, nil
			}
			return nil, err
		}
		facs, err := tenantNode.GetAllFacilities(ctx)
		if err != nil {
			return nil, err
		}
		return facs, nil
	}

	tenants, err := inv.GetAllTenants(ctx)
	if err != nil {
		return nil, err
	}
	for _, t := range tenants {
		if t != nil {
			facs, err := t.GetAllFacilities(ctx)
			if err == nil {
				results = append(results, facs...)
			}
		}
	}
	return results, nil
}

// DeleteFacilityNode removes a Facility node under a Tenant.
func DeleteFacilityNode(ctx context.Context, client *nexus_client.Clientset, tenantID, facilityID string) error {
	tenantNode, err := EnsureTenantNode(ctx, client, tenantID)
	if err != nil {
		return err
	}
	return tenantNode.DeleteFacilities(ctx, facilityID)
}

// FacilityModelFromNode converts a Nexus InventoryFacility node to FacilityModel.
func FacilityModelFromNode(fNode *nexus_client.InventoryFacility) *FacilityModel {
	if fNode == nil {
		return nil
	}
	spec := fNode.Spec
	id := spec.FacilityID
	if id == "" {
		id = fNode.DisplayName()
	}
	name := spec.Name
	if name == "" {
		name = id
	}

	meterCount := 1
	if meters, err := fNode.GetAllMeters(context.Background()); err == nil && len(meters) > 0 {
		meterCount = len(meters)
	}

	return &FacilityModel{
		ID:               id,
		TenantID:         spec.FacilityID,
		Name:             name,
		Address:          spec.Location,
		Country:          spec.CountryCode,
		CountryCode:      spec.CountryCode,
		Status:           "Active",
		ProcessesCount:   1,
		DevicesCount:     meterCount,
		DataCompleteness: 100.0,
		Emissions:        "0 tCO₂e",
		Readiness:        "Audit-Ready",
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
}

// SeedDefaultNexusData seeds standard reference CRD rulebooks into the Nexus graph if not already populated.
// Note: Facilities, users, products, and passports are NOT seeded here to ensure a clean tenant slate.
func SeedDefaultNexusData(ctx context.Context, client *nexus_client.Clientset) error {
	if client == nil {
		return nil
	}

	// 1. Seed Reference Rulebooks for CBAM & ISO 14067 calculation
	_, _ = CreateRulebookNode(ctx, client, "steel-rulebook-cbam-2026", configv1.RulebookSpec{
		RulebookID:     "steel-rulebook-cbam-2026",
		CommodityType:  "Steel",
		Version:        "2026.1",
		AccountingMode: "cbam",
		FunctionalUnit: "kg CO2e per kg Hot-Rolled Steel Coil",
		BatchQuantity:  10000,
		Scope1Formula:  "fuel_consumed_liters * 2.68",
		Scope2Formula:  "electricity_consumed_kwh * 0.71",
		Scope3Formula:  "batch_quantity_kg * 0.65",
	})
	_, _ = CreateRulebookNode(ctx, client, "default-rulebook", configv1.RulebookSpec{
		RulebookID:     "default-rulebook",
		CommodityType:  "Steel",
		Version:        "2026.1",
		AccountingMode: "cbam",
		FunctionalUnit: "kg CO2e per kg",
		BatchQuantity:  1000,
		Scope1Formula:  "fuel_consumed_liters * 2.5",
		Scope2Formula:  "electricity_consumed_kwh * 0.7",
		Scope3Formula:  "batch_quantity_kg * 0.472",
	})

	// 2. Ensure Default Tenants exist without injecting any mock facilities, users, or passports
	tenantsToSeed := []string{"tenant-default", "org_saurient_demo"}
	for _, tID := range tenantsToSeed {
		_, _ = EnsureTenantNode(ctx, client, tID)
	}

	return nil
}
