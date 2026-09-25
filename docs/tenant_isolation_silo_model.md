# Design Document: Model 3 Siloed Tenant Isolation Architecture

**Author:** Principal Architect & SME  
**Approver:** Saurient Platform Engineering Team  
**Date:** September 25, 2026  
**Status:** Proposed / Draft  
**Related Documents:** `docs/end_to_end_testing_workflow.md`, `features/rule-chaining-dag/design.md`  

---

## 1. Background

The **Saurient Carbon Passport Platform** processes calculation rulebooks (CEL engine), product batch telemetry, and rich Digital Carbon Passports. Currently, the platform operates on a **Model 1 Pooled Multi-Tenancy Architecture**, where all tenants share the same Kubernetes namespace, API instances, calculation engine controllers, and PostgreSQL database enforced via logical Row-Level Security (`app.current_tenant` setting).

While Model 1 is cost-effective for standard/SMB users, enterprise clients (e.g., global steel manufacturers, chemical conglomerates, energy suppliers) demand **Model 3: Siloed Tenant Isolation Architecture**. Their requirements include:

1. **Strict Physical Data Isolation**: Zero risk of logical query leakages or shared database engine vulnerabilities.
2. **Compliance & Data Sovereignty**: Compliance with EU CBAM, GHG Protocol, and strict regional data residency mandates (e.g., GDPR Frankfurt `eu-central-1` vs. US Virginia `us-east-1`).
3. **Noisy Neighbor Elimination**: Dedicated CPU/Memory compute quotas and dedicated database IOPS, ensuring heavy batch processing by one enterprise tenant does not degrade performance for others.
4. **Bring Your Own Key (BYOK) Encryption**: Dedicated AWS KMS / HashiCorp Vault encryption keys managed independently per tenant.
5. **Independent Maintenance & Disaster Recovery**: Per-tenant Point-In-Time Recovery (PITR), isolated schema migrations, and custom maintenance windows.

---

## 2. High-Level Design

The **Model 3 Siloed Architecture** splits the platform into a **Global Control Plane** and **Dedicated Tenant Silos (Data Plane)**.

```
                                 +---------------------------------------+
                                 |         GLOBAL CONTROL PLANE          |
                                 |  - Central Tenant Directory Service   |
                                 |  - Global OAuth2 / OIDC IdP (JWT)     |
                                 |  - Dynamic Tenant Gateway Router      |
                                 +---------------------------------------+
                                                     |
                     +-------------------------------+-------------------------------+
                     |                                                               |
                     v                                                               v
  +-------------------------------------+                         +-------------------------------------+
  |     TENANT A SILO (Namespace)       |                         |     TENANT B SILO (Namespace)       |
  |  `saurient-tenant-acme-corp`        |                         |  `saurient-tenant-globex-inc`       |
  |                                     |                         |                                     |
  |  +-------------------------------+  |                         |  +-------------------------------+  |
  |  | Dedicated API Gateway Pods   |  |                         |  | Dedicated API Gateway Pods   |  |
  |  +-------------------------------+  |                         |  +-------------------------------+  |
  |  | K8s Operator & CEL Engine    |  |                         |  | K8s Operator & CEL Engine    |  |
  |  +-------------------------------+  |                         |  +-------------------------------+  |
  |  | Dedicated Redis Cache DB     |  |                         |  | Dedicated Redis Cache DB     |  |
  |  +-------------------------------+  |                         |  +-------------------------------+  |
  |                 |                   |                         |                 |                   |
  |                 v                   |                         |                 v                   |
  |  +-------------------------------+  |                         |  +-------------------------------+  |
  |  | Dedicated Aurora PostgreSQL   |  |                         |  | Dedicated Cloud SQL Postgres  |  |
  |  | (KMS Key A, AWS eu-central-1) |  |                         |  | (KMS Key B, GCP us-east1)     |  |
  |  +-------------------------------+  |                         |  +-------------------------------+  |
  +-------------------------------------+                         +-------------------------------------+
```

### Core Architecture Components

1. **Global Control Plane (Tenant Router & Directory)**:
   - Authenticates incoming OAuth2/OIDC JWT tokens.
   - Inspects the `tenant_id` claim (or custom sub-domain e.g. `acme.api.saurient.io`).
   - Forwards request securely to the tenant's dedicated Ingress and API Pod cluster.

2. **Tenant Namespace Isolation (Kubernetes Layer)**:
   - Each enterprise tenant receives a dedicated Kubernetes namespace (`saurient-tenant-<tenant_id>`).
   - `CalculationRulebook`, `Product`, and `CarbonPassport` Custom Resources (CRDs) live exclusively inside the tenant's namespace.
   - Kubernetes `NetworkPolicy` objects block cross-namespace inter-pod traffic.
   - `ResourceQuota` and `LimitRange` objects enforce tenant CPU/Memory boundaries.

3. **Dedicated Compute & Engine (Application Layer)**:
   - Dedicated `VerificationServer` (API Gateway) and Kubernetes Controller instances process calculation jobs for that tenant alone.
   - Proprietary CEL calculation rules and emission factors stay completely isolated in memory.

4. **Dedicated Persistence & Cache (Data Layer)**:
   - **PostgreSQL**: Each tenant has a dedicated PostgreSQL instance (or isolated cloud-managed database instance with dedicated connection pools).
   - **Redis**: Each tenant runs a dedicated Redis instance or isolated database index with tenant-specific encryption keys.

---

## 3. Detailed Component Specifications

### 3.1 Global Control Plane & Dynamic Ingress Router

```
Request ---> Global Ingress Gateway ---> JWT Claims Extractor ---> Tenant Route Resolver ---> Internal Silo Service
```

- **JWT Tenant Resolution**:
  ```json
  {
    "iss": "https://auth.saurient.io/",
    "sub": "usr_acme_admin_01",
    "tenant_id": "org_acme_corp",
    "silo_endpoint": "https://api-internal.acme.saurient-mesh.local"
  }
  ```
- If an unauthenticated or invalid tenant token is presented, the Global Gateway returns `401 Unauthorized` before reaching any siloed pods.

### 3.2 Kubernetes Resource Isolation & RBAC

Each enterprise silo is provisioned via GitOps / Helm with tenant-specific manifests:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: saurient-tenant-acme-corp
  labels:
    saurient.io/tenant-id: "org_acme_corp"
    saurient.io/tier: "enterprise-silo"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-cross-tenant-traffic
  namespace: saurient-tenant-acme-corp
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          saurient.io/control-plane: "true"
```

### 3.3 Database & Key Management (BYOK)

- **Dedicated Connection Configuration**:
  ```go
  type TenantSiloConfig struct {
      TenantID       string `json:"tenant_id"`
      DatabaseDSN    string `json:"database_dsn"`    // e.g. postgres://acme_user:secret@db.acme.internal:5432/acme_passports
      RedisAddr      string `json:"redis_addr"`      // e.g. redis.acme.internal:6379
      KMSKeyARN      string `json:"kms_key_arn"`     // e.g. arn:aws:kms:eu-central-1:123456789012:key/acme-key
      Region         string `json:"region"`          // e.g. eu-central-1
  }
  ```
- **Envelope Encryption**: Field-level PII or sensitive supplier activity data is encrypted at rest using the tenant's dedicated KMS key before writing to PostgreSQL.

---

## 4. API Surface & Inter-Service Interactions

| Endpoint | Routing Behavior in Model 3 | Access Control |
| :--- | :--- | :--- |
| `POST /api/v1/product/register` | Routed to `saurient-tenant-<tenant_id>` API Pods | Verified against tenant JWT claim |
| `GET /api/v1/carbon-passport/{id}` | Direct cache fetch from tenant's dedicated Redis instance | Verified against tenant JWT claim |
| `POST /api/v1/calculation-rulebook` | Deploys `CalculationRulebook` CRD into tenant namespace | Admin/Compliance role in tenant JWT |

---

## 5. Reliability, Backup & Disaster Recovery

1. **Independent Point-In-Time Recovery (PITR)**:
   - Database WAL archives and snapshots are stored in a tenant-dedicated S3/GCS bucket encrypted with the tenant's KMS key.
   - Restoring Tenant A's database to a state from 3 hours ago has zero impact on Tenant B's operations.

2. **Isolated Schema Migrations**:
   - Schema updates and migrations (`migrations/001_init_schema.sql`) can be canary-tested on a single enterprise tenant before rolling out globally.

3. **High Availability (HA)**:
   - Each enterprise silo deploys multi-AZ API pods (`replicas: 3`) and PostgreSQL multi-AZ replicas.

---

## 6. Comparison: Model 1 vs. Model 2 vs. Model 3

| Architectural Metric | Model 1 (Pooled RLS) | Model 2 (Multi-Schema) | Model 3 (Siloed Pod & DB) |
| :--- | :--- | :--- | :--- |
| **Data Boundary** | Logical (`WHERE tenant_id = X`) | Schema (`acme.passports`) | Physical Database & Cloud VPC |
| **K8s Isolation** | Single Shared Namespace | Shared Namespace | Dedicated Namespace per Tenant |
| **Noisy Neighbor Risk** | Moderate | Low | Zero (Hardware ResourceQuotas) |
| **Compliance / Data Sovereignty** | Single Region | Single Region | Multi-Region / Multi-Cloud |
| **Key Management** | Shared Encryption Key | Shared Encryption Key | Bring Your Own Key (BYOK) per Tenant |
| **Cost per Tenant** | Lowest | Low | Higher (Enterprise Tier) |

---

## 7. Migration & Phased Rollout Plan

1. **Phase 1: Control Plane & Gateway Routing**
   - Implement the Central Tenant Provisioning Service and JWT Tenant Router.
2. **Phase 2: K8s Namespace Templating & Helm Operator**
   - Package `saurient-platform` application stack into a tenant-silo Helm chart capable of instantiating dedicated namespaces, API pods, and controllers.
3. **Phase 3: Database & KMS Automation**
   - Automate Terraform/Crossplane scripts for provisioning dedicated PostgreSQL databases, Redis instances, and AWS KMS / GCP KMS key policies per enterprise customer.
