# Saurient Carbon Passport — Web UI Application (`digital-passport-app`)

Modern React TypeScript frontend application for the **Saurient Carbon Passport Platform**. Provides interactive dashboards for Digital Carbon Passports (Scope 1–3 greenhouse gas footprints, audit trails, and EU CBAM export verification), product batch registrations, GHG inventory management, trace carbon lineage DAG visualizations, and live integration with the Saurient API Gateway.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0+` (or `v20.0+`)
- **npm**: `v9.0+`

### 1. Installation
Navigate into the `digital-passport-app` directory and install project dependencies:

```bash
cd digital-passport-app
npm install
```

### 2. Development Server
Start the Vite local development server:

```bash
npm run dev
```

By default, the UI will be accessible at:
👉 **`http://localhost:5173`**

### 3. API Gateway Configuration
The app connects to the Saurient Go REST API Gateway (`http://localhost:8080/api/v1`) by default. To point to a custom API Gateway endpoint, create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 🛠️ Available Scripts

- **`npm run dev`**: Starts Vite dev server with Hot Module Replacement (HMR).
- **`npm run build`**: Compiles TypeScript and builds production bundles into `dist/`.
- **`npm run preview`**: Previews the built production app locally.

---

## 📱 Key Modules & Views

1. **Enterprise Dashboard (`/dashboard`)**: High-level platform KPIs, total emissions, facility breakdown, and verified passport statistics.
2. **Digital Carbon Passports (`/passport`)**: Interactive passport cards with carbon intensity metrics (`kg CO2e/kg`), Scope 1–3 breakdowns, verification status, and cryptographic SHA-256 data hash inspector.
3. **Trace Carbon Lineage DAG (`/trace`)**: Live visual multi-tier dependency topology tracing from Enterprise Organisation down to Issued Passport with supplier input correction simulation.
4. **Government & Policy Portal (`/government`)**: Sector intelligence, national CBAM export exposure monitoring, regional drilldowns, and 2030 NDC / Paris Agreement alignment.
5. **Product Batch Registration (`/products/new`)**: Registers new product batches by submitting `Product` CR payloads with telemetry activity data and dynamic organization facility selection.
6. **MRV & Verification (`/mrv`)**: Monitoring, Reporting & Verification tracking and auditor assurance workflows.
7. **CBAM & PCF Dashboards (`/cbam` & `/pcf`)**: EU Carbon Border Adjustment Mechanism exposure and Product Carbon Footprint calculation rulebook engine.
