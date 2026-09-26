# Saurient Carbon Passport — Web UI Application (`digital-passport-app`)

Modern React TypeScript frontend application for the **Saurient Carbon Passport Platform**. Provides interactive dashboards for Digital Carbon Passports (Scope 1–3 greenhouse gas footprints, audit trails, and EU CBAM export verification), commodity setups, GHG inventory management, and live integration with the Saurient API Gateway.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0+` (or `v20.0+`)
- **Yarn**: `v1.22+` (or `npm`)

### 1. Installation
Navigate into the `digital-passport-app` directory and install project dependencies:

```bash
cd digital-passport-app
yarn install
```

### 2. Development Server
Start the Vite local development server:

```bash
yarn dev
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

- **`yarn dev`**: Starts Vite dev server with Hot Module Replacement (HMR).
- **`yarn build`**: Compiles TypeScript and builds production bundles into `dist/`.
- **`yarn preview`**: Previews the built production app locally.

---

## 📱 Key Modules & Views

1. **Digital Carbon Passport Gallery & Inspector (`/passport` & `/passport/:id`)**:
   - Interactive passport tiles with carbon intensity metrics (`kg CO2e/kg`), Scope 1–3 breakdowns, search, and commodity filters.
   - Live API status bar & raw JSON payload inspector.
2. **Executive Dashboard (`/`)**: High-level platform KPIs, total emissions, and verified passport counts across commodities.
3. **Product & Batch Setup (`/products/new`)**: Registers new product batches by submitting Kubernetes `Product` CR payloads to `POST /api/v1/products`.
4. **MRV Workflow (`/mrv`)**: Monitoring, Reporting & Verification tracking.
5. **Evidence & Verification (`/evidence`)**: Auditor evidence lockers & verification logs.
6. **CBAM & PCF Dashboards (`/cbam` & `/pcf`)**: EU Carbon Border Adjustment Mechanism exposure and Product Carbon Footprint calculations.
