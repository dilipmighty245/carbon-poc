# Enterprise Tenant Isolation Architecture Design Document

**Author:** Principal Architect & SME  
**Approver:** Saurient Platform Engineering Team  
**Date:** September 25, 2026  
**Status:** Proposed / Draft  
**Related Documents:** `docs/end_to_end_testing_workflow.md`, `features/rule-chaining-dag/design.md`  

---

## 1. Executive Summary & Beginner's Guide

### What is Tenant Isolation?
In software engineering, a **tenant** represents an organization, enterprise, or customer using a platform. **Tenant Isolation** ensures that one organization's data, calculation rules, and compute resources are strictly separated from all other organizations.

### Why is Isolation Critical for Carbon Accounting?
The **Saurient Carbon Platform** calculates carbon footprints (Scope 1, Scope 2, and Scope 3 emissions) for global industrial and agricultural supply chains. Enterprise customers (such as steel producers, chemical plants, or food processors) have strict operational requirements:

1. **Confidentiality & Data Privacy**: Supply chain activity data, raw material inputs, and proprietary production volumes must never leak to competitors.
2. **Regulatory & Regional Data Sovereignty**: European regulations (such as EU CBAM) may require data to remain within the European Union (e.g., Frankfurt `eu-central-1`), while US clients require US residency (`us-east-1`).
3. **Dedicated Performance (No Heavy Neighbor Impact)**: Heavy batch calculations run by one enterprise must not slow down API response times for another organization.
4. **Encryption Key Control (BYOK)**: Enterprises require encryption at rest using their own dedicated cryptographic keys (Bring Your Own Key).

This document outlines the **Siloed Tenant Isolation Architecture**, where each enterprise tenant receives a dedicated compute environment, dedicated database, and dedicated encryption keys.

---

## 2. High-Level Architecture Overview

The system is divided into two main layers:
1. **Global Control Plane**: A central entry point that authenticates users, reads their organization identity (`tenant_id`), and routes incoming API requests to the correct dedicated environment.
2. **Dedicated Tenant Silo (Data Plane)**: A completely isolated set of compute pods, Kubernetes namespaces, and database storage created specifically for a single enterprise organization.

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

---

## 3. Detailed Technical Components

### 3.1 Global Control Plane & Gateway Routing

When a client application or user makes a request to the platform, the **Global Ingress Gateway** performs the following steps:

```
Request ---> Global Ingress Gateway ---> Validate JWT Token ---> Extract tenant_id ---> Route to Tenant Silo
```

1. **Authentication**: Validates the OAuth2 JWT token.
2. **Tenant Extraction**: Reads the `tenant_id` claim from the token payload:
   ```json
   {
     "sub": "usr_acme_admin_01",
     "tenant_id": "org_acme_corp",
     "iss": "https://auth.saurient.io/"
   }
   ```
3. **Routing**: Forwards the request directly to Tenant A's internal dedicated API gateway (`saurient-tenant-acme-corp`).
4. **Error Handling**: If the token is missing or invalid, the gateway immediately returns `401 Unauthorized`.

---

### 3.2 Kubernetes Namespace & Compute Isolation

Every tenant environment is deployed into its own isolated Kubernetes namespace (`saurient-tenant-<tenant_id>`):

- **Isolated Resources**: All calculation rulebooks (`CalculationRulebook`), batch telemetry (`Product`), and digital carbon passports (`CarbonPassport`) reside inside the tenant's namespace.
- **Network Isolation**: Kubernetes `NetworkPolicy` rules block direct network communications between different tenant namespaces.
- **Compute Quotas**: `ResourceQuota` limits guarantee dedicated CPU and RAM for each tenant.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: saurient-tenant-acme-corp
  labels:
    saurient.io/tenant-id: "org_acme_corp"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: block-cross-tenant-network-traffic
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

---

### 3.3 Database & Encryption Isolation (BYOK)

To guarantee database privacy:

1. **Dedicated Database Instances**: Enterprise tenants write to a dedicated PostgreSQL database instance (or dedicated cloud database connection pool).
2. **Dedicated Cache**: High-speed passport lookup queries use a dedicated Redis cache instance.
3. **Encryption at Rest (BYOK)**: Sensitive activity data is encrypted at rest using dedicated AWS KMS or GCP KMS cryptographic keys owned by the tenant.

```go
type TenantSiloConfig struct {
    TenantID       string `json:"tenant_id"`
    DatabaseDSN    string `json:"database_dsn"`    // postgres://acme_user:secret@db.acme.internal:5432/acme_db
    RedisAddr      string `json:"redis_addr"`      // redis.acme.internal:6379
    KMSKeyARN      string `json:"kms_key_arn"`     // arn:aws:kms:eu-central-1:123456789012:key/acme-key
    Region         string `json:"region"`          // eu-central-1
}
```

---

## 4. API Endpoints & Request Flow

Below is how the primary platform API endpoints function under the isolated tenant architecture:

| API Endpoint | Description | Isolation Guarantee |
| :--- | :--- | :--- |
| `POST /api/v1/product/register` | Registers a product batch & activity data | Processed exclusively by the tenant's dedicated API & CEL Engine pods |
| `GET /api/v1/carbon-passport/{id}` | Fetches a rich Digital Carbon Passport | Read directly from the tenant's dedicated Redis / PostgreSQL store |
| `POST /api/v1/calculation-rulebook` | Configures proprietary calculation formulas | Saved exclusively into the tenant's private Kubernetes namespace |

---

## 5. Reliability, Backup & Disaster Recovery

1. **Independent Backups & PITR**:
   - Each enterprise tenant's database has independent snapshot and Point-In-Time Recovery (PITR) policies stored in encrypted cloud storage.
   - Performing a database restore for Tenant A has zero impact on Tenant B.

2. **Canary Software Upgrades**:
   - Platform updates can be deployed to a single tenant environment for testing before rolling out to all enterprise clients.

3. **High Availability (HA)**:
   - Tenant environments deploy across multiple Cloud Availability Zones (Multi-AZ) to prevent downtime.

---

## 6. Implementation Roadmap

1. **Phase 1: Control Plane & Gateway Router**
   - Implement central OAuth2 JWT token verification and tenant route mapping.
2. **Phase 2: Kubernetes Tenant Helm Chart**
   - Create a Helm deployment template that provisions namespace, NetworkPolicies, API pods, and controllers for a new tenant.
3. **Phase 3: Automated Cloud Provisioning**
   - Automate infrastructure provisioning (PostgreSQL, Redis, KMS keys) using infrastructure-as-code scripts.
