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
The browser uses same-origin `/api/v1` requests. Vite proxies `/api` to the local Go gateway on port 8080 during development. Start the gateway from the repository root with `go run ./cmd/api`.

For a different development gateway, set the proxy target before starting Vite:

```bash
VITE_API_PROXY_TARGET=http://127.0.0.1:18080 npm run dev
```

For production, configure your web server to proxy `/api/` to the Go gateway and serve the SPA for other routes. `deploy/nginx.conf` provides a Kubernetes example. Alternatively, set a reachable HTTPS API URL in `.env.production` **before building**:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

Do not use a localhost API URL in a remotely served build: localhost refers to the visitor's machine. A separate API origin must allow the frontend origin through CORS and use HTTPS when the frontend uses HTTPS.

`Failed to fetch` means the browser did not receive an HTTP response. Check the browser Network panel for the request URL, gateway reachability, TLS, and CORS. Registration now keeps the draft and displays a service-connectivity error on such failures. Passwords are never saved in the draft.

### Browser tests

```bash
npx playwright install chromium
npm run test:e2e
```

The suite starts isolated API and UI servers on ports 18080 and 15173, using the in-memory datastore. Set `E2E_API_PORT` / `E2E_UI_PORT` to change those ports, or `E2E_API_URL` / `E2E_BASE_URL` to use an existing test deployment. The deployed UI must proxy its API calls to that test gateway. Tests create organisations and products, so use a test environment.

---

## 🛠️ Available Scripts

- **`npm run dev`**: Starts Vite dev server with Hot Module Replacement (HMR).
- **`npm run build`**: Compiles TypeScript and builds production bundles into `dist/`.
- **`npm run typecheck`**: Checks both referenced TypeScript projects with `tsc -b`. Existing project-wide type errors still require cleanup; the current build script does not check those references.
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

## Passport QR codes on mobile

The QR Verification tab and certificate preview encode `/verify/<passport-id>` on the current app origin. This read-only page opens without signing in after verification, issuance, and agency submission. Both the UI and public API enforce this release gate. QR generation runs locally in the browser.

For production or printed labels, set `VITE_PUBLIC_APP_URL=https://your-passport-domain.example` before building so codes use a stable address reachable by recipients. Serve `/verify/*` through the SPA fallback and proxy `/api/` to the gateway.

For local phone testing, connect both devices to the same Wi-Fi. When you open the development app through localhost or `carbon-passport-dev`, QR links automatically use a detected private LAN IPv4 address from the laptop, keeping the actual browser port for localhost. For `carbon-passport-dev`, links use Vite’s actual listening port instead of the local proxy’s port 80. Wi-Fi interfaces (and macOS `en0`) are preferred; common VPN and virtual adapters are excluded. Opening the app directly through a network address uses that address instead. Restart Vite after changing Wi-Fi networks. With multiple physical adapters, detection may choose a different network: open the working Network URL printed by Vite to select it explicitly. Remove any old `VITE_PUBLIC_APP_URL` LAN override to enable automatic detection. Vite already listens on all interfaces. Scan with the phone camera; allow port 5173 through your firewall if necessary. A QR containing `localhost` will point to the phone itself and cannot reach your computer. Clipboard access may be unavailable on LAN HTTP; the URL can also be selected manually. Download QR exports an SVG suitable for printing.

When using `make dev-setup-nomock`, the API runs in kind and Vite proxies to `http://127.0.0.1:18080`; business data is stored in Nexus CRDs backed by the cluster’s etcd.
