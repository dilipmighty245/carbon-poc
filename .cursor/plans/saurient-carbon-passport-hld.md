# High-Level Design (HLD): Saurient Carbon Passport Platform

**Author:** AI Assistant  
**Approver:** dt032761  
**Date:** Sep 23, 2026  
**Status:** Draft  
**Related:** https://github.com/dilipmighty245/graph-framework-for-microservices  
---

# Background

Global trade regulations, including the European Union's Carbon Border Adjustment Mechanism (CBAM) and international GHG Protocol standards, increasingly mandate industrial manufacturers and exporters to measure, verify, and publish product-level carbon footprints. To provide true accountability, carbon accounting must encompass the three scopes of greenhouse gas (GHG) emissions defined by the GHG Protocol:

* **Scope 1 (Direct Emissions):** Emissions originating directly from company-owned or controlled assets, such as fuel combustion in on-site generators, industrial boilers, furnaces, and corporate fleet vehicles.
* **Scope 2 (Indirect Energy Emissions):** Indirect emissions generated off-site from purchased electricity, steam, heating, and cooling consumed during industrial manufacturing processes.
* **Scope 3 (Value Chain Emissions):** Indirect emissions spanning the broader supply chain and product lifecycle, including raw material extraction (e.g., bauxite, raw cocoa, limestone), upstream supplier logistics, purchased sub-components, and product end-of-life disposal.

Today, enterprise exporters face severe operational friction when measuring and disclosing these emissions. Activity data is trapped in disconnected spreadsheets, paper utility bills, and isolated ERP production logs. Furthermore, high-frequency IoT smart meter streams overload traditional carbon accounting software, while third-party auditors and customs authorities demand verifiable cryptographic proof and immutable audit trails that static reporting cannot provide.

# High-level Design

The Saurient Carbon Passport Platform solves these challenges by implementing an event-driven, graph-native microservice architecture built on **Nexus (Graph Framework for Microservices)**. Nexus provides a declarative Go DSL that models the entire domain (enterprises, facilities, IoT meters, production batches, and carbon passports) as a single hierarchical state graph, automatically generating Kubernetes CRDs, API Gateway / GraphQL endpoints, and event-driven K8s controllers/reconcilers.

```text
[ Sattric+ IoT Edge ]    [ ERP Webhooks ]    [ Supplier Evidence ]
          |                     |                      |
          +---------------------+----------------------+
                                |
                                v
+-----------------------------------------------------------------------------------+
|                        NEXUS API GATEWAY LAYER                                    |
|   - Auto-generated REST & GraphQL APIs     - Built-in Schema Validation           |
|   - Declarative RBAC & Rate Limiting       - Exposes Graph Nodes                  |
+-----------------------------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------------------------+
|                         NEXUS GRAPH DATA MODEL LAYER                              |
|   - Enterprise -> Facility -> Device -> TelemetryMetric -> CarbonPassport         |
|   - State represented as K8s Custom Resources (CRDs)                              |
+-----------------------------------------------------------------------------------+
                                |
                                v
+-----------------------------------------------------------------------------------+
|                    NEXUS EVENT-DRIVEN RECONCILER ENGINE                           |
|   - Auto-generated Controllers watching Graph Node State Changes                  |
|   - Async calculation on Telemetry / Batch update                                 |
+-----------------------------------------------------------------------------------+
      |                                 |                                 |
      v                                 v                                 v
+-----------------------+     +-----------------------+     +-----------------------+
| Calculation Engine    |     | MRV Verification      |     | Passport & QR Engine  |
| Reconciler            |     | Reconciler            |     | Reconciler            |
+-----------------------+     +-----------------------+     +-----------------------+
      |                                 |                                 |
      +---------------------------------+---------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                           STORAGE & VERIFICATION TIER                             |
|  - PostgreSQL / etcd (Graph State)    - AWS S3 / WORM (Evidence Documents)        |
|  - Redis (Public QR Edge Cache)       - CBAM XML/JSON Export APIs                 |
+-----------------------------------------------------------------------------------+
```

Incoming telemetry streams from Sattric+ smart meters and ERP webhooks are ingested directly by the Nexus API Gateway, updating child nodes within the graph. As new telemetry or batch metrics land in the state model, automated Nexus K8s Reconcilers detect state mutations, query localized emission factor databases (DEFRA, IPCC, grid factors), and compute Scope 1, Scope 2, and Scope 3 carbon intensity for the batch.

Once calculated, the Measure, Report, and Verify (MRV) reconciler manages status workflows (`Draft` → `Submitted` → `Under Review` → `Verified`) and attaches supporting evidence (invoices, meter logs) stored in immutable WORM object storage. The final output is an immutable `CarbonPassport` node featuring a cryptographically signed QR code (SHA-256) and automated CBAM XML export artifacts for seamless customs verification.

# Product-Specific Formula Design & Emission Engine Strategy

Different industrial product categories (e.g. Steel, Cement, Cocoa, Aluminum, Chemicals) have distinct physical production pathways, chemical reaction profiles, and supply chain dependencies. To avoid hardcoding calculation logic in code, the platform uses a **Dynamic Formula Rulebook Engine** attached to Nexus graph nodes.

```text
ProductType Node (e.g., "Structural Steel")
   └── CalculationRulebook Node (Version 2026.1)
         ├── Scope1_Formula:  (Fuel_Liters * Fuel_EF) + (Limestone_Tons * Process_Calcination_EF)
         ├── Scope2_Formula:  (Electricity_kWh * Grid_EF) - (PPA_Renewable_kWh * PPA_Offset_Factor)
         ├── Scope3_Formula:  Sum(Upstream_Material_Weight_i * Material_EF_i) + (Freight_Tons_km * Logistics_EF)
         └── FunctionalUnit:  "kg CO2e per metric ton of finished product"
```

### 1. Formula Structure per Scope
* **Scope 1 (Direct Fuel & Chemical Process):**
  `Scope 1 = ∑ (Activity Data_fuel × Emission Factor_fuel) + Chemical Process Emissions`
  * *Example (Cement/Limestone Calcination):* `Tons of CaCO3 × Stoichiometric EF (0.44 tCO2/t)`
* **Scope 2 (Indirect Purchased Energy):**
  `Scope 2 = (Electricity Consumption in kWh × Grid Intensity EF) - Verified Renewable PPA Credits`
* **Scope 3 (Upstream Supply Chain & Logistics):**
  `Scope 3 = ∑ [Material Weight_i × Supplier EPD/IPCC EF_i] + (Freight Distance in km × Freight Weight in tons × Transport EF)`

### 2. Dynamic Formula Execution Engine
* **Declarative Expression Language:** Formulas are defined declaratively using Google's **Common Expression Language (CEL)** or Go's **Expr** engine. Rules reference variables exposed by Nexus graph nodes (e.g. `device.telemetry.electricity_kwh`, `batch.bom.raw_cocoa_weight`).
* **Vintage-Controlled Emission Factor Lookup:** Formulas dynamically bind to localized emission factor databases (DEFRA, IPCC, IEA, or supplier Environmental Product Declarations - EPDs) filtered by region and year.
* **Point-in-Time CQRS Immutable Snapshot:** When a calculation executes, the calculated `EmissionSnapshot` node records the exact formula expression string, input variable values, factor vintage IDs, and calculated result. This guarantees 100% auditability for CBAM customs reviews.

# Core Domain Services & Nexus Reconcilers

The application state is organized in a clear parent-child tree hierarchy within Nexus:

```text
Enterprise (Root)
   │
   ├── Facility (Node)
   │     ├── Device (Node)
   │     │     └── TelemetryMetric (Node)
   │     └── ProductionBatch (Node)
   │
   └── ProductType (Node)
         ├── CalculationRulebook (Node)
         └── CarbonPassport (Node)
               ├── EmissionSnapshot (Child)
               ├── VerificationRecord (Child)
               └── ComplianceArtifact (Child)
```

1. **Nexus Ingestion API Gateway:** Serves auto-generated GraphQL/REST endpoints for Sattric+ hardware, ERP webhooks, and manual uploads. Enforces schema validation and injects inputs directly into graph nodes.
2. **Emission Calculation Reconciler:** Listens to `TelemetryMetric` and `ProductionBatch` node updates. Evaluates the product's `CalculationRulebook` CEL formulas against activity data to compute Scope 1, Scope 2, and Scope 3 intensity per functional unit.
3. **MRV & Verification Reconciler:** Enforces reviewer checklists and manages workflow state transitions, generating time-stamped audit records for compliance.
4. **Passport Engine Reconciler:** Assigns a unique Passport ID, signs the state payload hash with the platform private key, and exports standard CBAM XML files.

# Storage Strategy Matrix

| Storage Tier | Technology | Role in Architecture |
|---|---|---|
| **Graph State Store** | PostgreSQL / etcd | Persists Nexus graph state nodes, Rulebooks, and K8s Custom Resources. |
| **Evidence Store** | AWS S3 / Azure Blob (WORM) | Stores evidence documents (utility bills, lab reports) with Write-Once-Read-Many immutability lock. |
| **Public Edge Cache** | Redis Cluster | Caches verified passport snapshots and QR code metadata for instant public verification. |

# Security, Compliance & Interoperability

1. **CBAM Standardized Pipeline:** Converts verified passport state graph nodes into compliant EU CBAM XML structures with detailed embedded direct and indirect emission breakdowns.
2. **Cryptographic Tamper-Proofing:** Hashes passport attributes (`Scope1 + Scope2 + Scope3 + BatchID + Timestamp`) with SHA-256 and signs with the platform private key, allowing external buyers and customs to verify authenticity via Saurient's public key.
3. **Public Edge Resolution:** Scans of physical product QR codes resolve via CDN edge workers backed by Redis, protecting core application databases from traffic surges.

# Enterprise Availability & Adoption Strategy

1. **Single-Contract Declarative SDK:** Auto-generated client SDKs allow enterprise IT teams to connect existing ERPs (SAP, Oracle) with zero custom protocol glue.
2. **Kubernetes-Native Deployment:** Deploys via standard `nexus-runtime-manifests` onto enterprise cloud clusters (EKS, GKE, Tanzu).
3. **Zero-Friction Ingestion:** Supports encrypted MQTT/HTTPS streams for Sattric+ IoT edge gateways and asynchronous REST/GraphQL webhooks for batch declarations.
