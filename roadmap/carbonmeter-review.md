# CarbonMeter Review: Ideas for Saurient (carbon-poc)

Sources: [homepage](https://www.carbonmeter.ai/),
[platform](https://www.carbonmeter.ai/products),
[CBAM supplier workflow](https://www.carbonmeter.ai/cbam), and
[compliance](https://www.carbonmeter.ai/compliance), reviewed 2026-10-27.
These are public marketing claims; implementation depth is unverified. Local findings
are based on source inspection, without running the application.

## 1. What CarbonMeter is

A UK pilot-stage carbon management product. It measures energy per machine and circuit
every 30 seconds, then derives carbon accounting, waste detection and compliance reports.

- **Measurement:** asset-level power readings through meters, APIs, manual inputs and optional
  third-party sensors. The site states that CarbonMeter does not manufacture hardware.
- **Carbon accounting:** Scope 1 and 2 in real time, using DEFRA emission factors and half-hourly
  grid carbon intensity. Every figure links back to a reading.
- **AI:** per-asset baseline learning. Flags waste, drift, spikes and faults. Produces a ranked savings list.
- **Compliance:** audit-ready CBAM, SECR and ESOS reports from one dataset, with lineage and completeness scoring.
- **CBAM supplier data service (pilot):** map imports to producing plants, request supplier data
  (EU CBAM template accepted), extract with AI-assisted reading and human review, check against
  production routes, benchmarks and defaults, then report embedded emissions by supplier and product.
- **Supplier checklists by sector:** cement (production, clinker consumption), steel (production route,
  scrap share), aluminium (source traceability), fertiliser (ammonia and nitric acid sources).
- **Additional platform claims:** GHG Protocol alignment, Scope 3 supplier-specific data and
  pricing designed to be under £500/month. Digital product passports were not identified
  in the reviewed pages.
- **Positioning:** lower-cost alternative to enterprise platforms (claims £50K–£200K a year). Emphasises
  measured data over estimates. Pilot claim: 12–22% of electricity used outside operating hours at every site measured.

## 2. Existing carbon-poc capabilities and foundations

- Digital Carbon Passport with QR public view, lineage tracing and SHA-256 audit digests.
- PCF, Scope 3 and value-chain modules.
- CBAM lifecycle with status model and verifier handover (`types/cbam.ts`).
- CEL rules engine, multi-tenancy, Nexus graph on Kubernetes CRDs.
- Supplier invitations, declarations, scorecards and evidence.

## 3. Candidate additions

Priority order. Existing code the item builds on is noted.

| # | Idea | Builds on | Value | Effort |
|---|------|-----------|-------|--------|
| 1 | Anomaly and waste detection on telemetry: per-asset baseline, drift, spike and out-of-hours flags | `internal/telemetry`, `LiveTelemetryModal` | High | Medium |
| 2 | Ranked savings and actions list (by kgCO2e and cost), fed by hotspots and anomalies | `pcf/tabs/HotspotsTab` | High | Low–Medium |
| 3 | Time-of-use Scope 2: half-hourly grid intensity and DEFRA factors, with factor source and timestamp shown per figure | `internal/engine`, lineage engine | High | Medium |
| 4 | AI-assisted supplier data extraction into the CBAM template (any format or language), human review, then checks against production routes, benchmarks and defaults | `SuppliersView`, `DeclarationsTab`, `EvidenceVerification` | High | High |
| 5 | Sector supplier checklists (cement, steel, aluminium, fertiliser) | steel golden-path feature | Medium | Low |
| 6 | Data completeness score next to each figure and passport | lineage engine, `ReadinessTracker` | Medium | Low–Medium |
| 7 | UK regime outputs (SECR, ESOS, UK CBAM from 1 Jan 2027) and a UK/EU CBAM comparison. Only if targeting the UK | CBAM views | Conditional | Medium |
| 8 | Positioning: measured data over defaults or spend-based estimates, tied to the passport | n/a | Medium | Low |

### Notes per item

1. **Anomaly detection.** A simple statistical baseline (rolling mean and standard deviation per asset,
   plus an operating-hours schedule) is enough for a POC. Output should be events stored with the
   asset, timestamp and reading so they trace through lineage.
2. **Savings list.** Hotspots identify where emissions concentrate. This item turns them into
   prioritised actions with estimated kgCO2e and cost impact.
3. **Time-of-use Scope 2.** Replace flat factors with interval-matched intensity. Each calculated
   value records the factor, its source and its timestamp, which fits the existing audit-digest model.
4. **Supplier extraction.** Keep human review as a required step. Validation rules can be expressed
   as CEL rules, in line with the rules engine.
5. **Checklists.** Static per-sector data requirements attached to supplier invitations.
6. **Completeness.** Score the share of required inputs present, measured versus default, per calculation.

## 4. Out of scope

- Hardware nodes and sensor installation. The integration hub is the right layer for sensor data.

## 5. Suggested first slice

After checking the implementation, prioritise persistent supplier collection, evidence-derived
completeness and actual/default comparison before operational alerts. Section 7 records the
implementation gaps and revised sequence. The candidates above remain useful longer-term ideas.

## 6. Open questions

- Is the UK a target market? This decides item 7.
- Is real sensor or smart-meter data in scope, or only the simulated telemetry generator?
- Which grid-intensity data source is acceptable for the POC (static table or live API)?

## 7. Implementation-aware priorities

The strongest opportunity is to connect existing modules into dependable workflows before
adding more screens. A screen or model does not by itself establish an operational capability.

| Priority | Addition | Existing foundation | Proposed outcome |
|----------|----------|---------------------|------------------|
| High | Supplier collection driven by impact | Invitations, declarations, evidence, scorecards and customer requests | Rank missing requests by imported tonnage, emissions contribution and evidence gaps; bind declarations to producing installation, product, production route and reporting period. |
| High | Actual-versus-default comparison | Precursor methods, exposure and cost views | Show supplier-specific versus default-covered volume, unresolved gaps and estimated exposure differences under explicit assumptions; generate a prioritised follow-up queue. |
| High | Evidence-derived completeness | Quality panel, evidence references, snapshots and lineage | Calculate missing-input and interval coverage, stale declarations, unresolved installation mappings and unsupported factors; link every issue to its source record. |
| High, after ingestion and history | Operational energy alerts | EM6400 parsing, generated readings, streaming endpoints and telemetry UI | Store historical readings and operating schedules; flag out-of-hours consumption, sustained excess load and stale meters with explainable rules. |
| Medium | Flexible supplier document intake | CSV upload and mapping screens | Support existing supplier workbooks first, then PDFs; retain source cell/page, original unit, extracted value and reviewer decision before accepting inputs. |
| Medium | Savings actions with measured results | Hotspots and analytics screens | Record an owner, due date, baseline, expected savings and measured outcome; link each action to its triggering readings. |

### Evidence from the local source

- `digital-passport-app/src/context/ValueChainContext.tsx` imports mock datasets and manages
  supplier workflows in React state. Persist and integrate those records before treating
  the UI as a complete supplier collection service.
- `internal/telemetry/server.go` uses `TelemetryGenerator`; the Integration Hub's
  `TelemetryTab.tsx` contains fixed readings. Parsing and streaming provide a simulation
  foundation, but real ingestion, history and asset mapping are prerequisites for reliable alerts.
- `digital-passport-app/src/components/pcf/common/DataQualityPanel.tsx` reads predefined
  `DATA_QUALITY` values. Replace these with results derived from current evidence and inputs.
- `digital-passport-app/src/components/views/AnalyticsView.tsx` defines energy savings and
  avoided-cost KPIs as constants. Back them with action records and baseline comparisons.
- `digital-passport-app/src/components/views/cbam/CostAnalysisView.tsx` contains fixed price
  and regulatory text. Comparisons need explicit price dates, jurisdiction, rule versions
  and assumptions before being used for decisions.

### Recommended delivery sequence

1. Persist supplier requests, declarations, installation links and review decisions; prove
   one supplier-to-product evidence journey end to end.
2. Calculate evidence completeness and expose actionable blockers from those records.
3. Add actual/default coverage and exposure comparisons using applicable, versioned rules.
4. Establish historical telemetry ingestion and asset schedules, then implement operational alerts.
5. Extend document intake and track savings actions against measured outcomes.

### Workflow and scope choices

- Add a guided **Map → Request → Check → Report** journey across existing modules, showing
  the next blocker for a task such as preparing a product's supplier evidence.
- Preserve the passport and independent verification focus; use these additions to improve
  the evidence feeding those outputs.
- Defer conversational AI and additional UK reporting schemes until the underlying workflows
  are dependable and UK customer demand is established.
- Treat interval grid intensity as an operational insight where appropriate. Select reporting
  factors by the applicable accounting method and jurisdiction rather than universally replacing
  flat factors; retain factor source, version and validity period.
- Validate regulatory rules against authoritative sources before implementation. Competitor
  marketing text is inspiration, not a compliance specification; actual data does not guarantee
  a lower liability than defaults.

This roadmap records analysis and proposed work only; no application changes were made as
part of the review.
