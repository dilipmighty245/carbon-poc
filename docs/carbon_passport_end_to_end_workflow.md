# Carbon Passport – UI End-to-End Workflow

Walkthrough of the Saurient Carbon Passport Platform, from an operator creating a facility and product batch through third-party verification and submission to the agency.

## Personas

| Persona | Role on the login screen | Responsibility in this flow |
|---|---|---|
| Company Operator | Facility & ESG Operations | Creates the facility and product batch, submits the passport for verification |
| Verifier | Independent Verification Body | Reviews and approves the passport |
| Passport Officer | Issuance & Statutory Authority | Submits the verified passport to the agency |

## Flow Overview

```
Operator:  Login → Add Facility → Create Product Batch → Draft Passport → Submit for Verification
                                                                                  │
Verifier:                                         Login → Approve → "Third-Party Verified"
                                                                                  │
Passport Officer:                                       Login → Submit to Agency
```

Passport lifecycle statuses (from the Registry filter): `Draft` → `Submitted` → `UnderVerification` → `CorrectionsRequired` → `Verified` → `Issued` → `SubmittedToAgency`.

---

## Part 1 – Company Operator

### Step 1: Log in as Company Operator

1. Open the Saurient Carbon Passport Platform sign-in page.
2. Under **Select Workspace Persona**, choose **Company Operator**.
3. Enter the **Work Email** and **Password** for the organisation.
4. Click **Sign in to workspace**.

> If the organisation was just registered, the page shows *"Organisation registered successfully. Sign in with your account credentials."*


### Step 2: Open the Facilities tab

1. In the left menu, click **Organisation**.
2. Open the **Facilities** tab.
3. A new organisation shows 0 Facilities and *"No Operating Facilities Registered"*.
4. Click **Add Facility** (or **Add First Facility**).
5. In the setup form, register the facility. Selecting SaurEdge/WG-05 lets the facility receive MQTT readings from its gateway. Configure the broker and topic during setup.


### Step 3: Verify the facility was created

After saving, the Facilities tab shows:

- **Active Sites:** 1 Facility
- **Configured Telemetry:** 1 WG-05 gateway
- A facility card (here **hyd**, ID `FAC-…`, type *Production Facility*) with the **Telemetry** badge and **Awaiting Data** status
- Data Completeness at 0% until telemetry arrives


### Step 4: Create a product batch

1. Click **Create Product Batch** in the top bar. This opens **Commodity & Product Setup**.
2. Pick a commodity template (for example **Cocoa**).
3. Fill in the **Register Product Batch** form:

   | Field | Example |
   |---|---|
   | Commodity | Cocoa |
   | Product Name | Fermented Cocoa Beans |
   | Plant / Facility | hyd (Ghana) |
   | Batch / Lot Number | `CB-2026-…` |
   | Attached Calculation Rulebook | `cocoa-rulebook-2026 (ISO 14067…)` |
   | Accounting Standard | ISO 14067 Product Footprint |
   | Bill of Materials (BOM) | Cocoa beans (raw), water, packaging |
   | Packaging Standard | 60 kg jute bags |
   | Supplier Organization | Asunafo Farmers Coop |
   | Batch Size Quantity / Unit | 1000 / kg |
   | Export Market | (required) |

4. Submit the form. The engine creates a Draft Carbon Passport preview linked to the batch.

The right-hand panel tracks setup progress: Company → Facility → Commodity → Product → Batch.


### Step 5: Check the draft passport

1. Go to **Carbon Passports → Registry**.
2. The new passport appears as a card with status **Draft**, showing:
   - Commodity, product name, batch ID and origin (Ghana)
   - **Carbon Intensity:** 0.94 kg CO2e per kg
   - **Batch Total:** 942 kgCO2e
3. Click **Open & Submit for Verification →**.


### Step 6: Submit for verification

On the **Passport Detail** page (status **DRAFT**, banner *Passport Draft · Action Required*):

- Review the Product & Batch Specification, the Emissions & Carbon Footprint Breakdown, and the Verification & Assurance panel (*Pending*).
- Optionally run **Readiness Audit** or **Run Audit Check** first.
- Click **Submit for Verification**. Three buttons do the same thing: the page header, the banner, and the Verification & Assurance panel.

The passport is submitted for third-party verification under ISO 14065 and EU Regulation 2023/956.


### Step 7: Log out

Open the user menu (top right, **Organisation Owner**) and choose **Log out**.

---

## Part 2 – Verifier

### Step 8: Log in as Verifier

1. On the sign-in page, select the **Verifier** persona (Independent Verification Body).
2. Enter the verifier's work email and password.
3. Click **Sign in to workspace**.

### Step 9: Approve the product

1. Go to **Carbon Passports** and find the submitted passport (for example *Fermented Cocoa Beans*).
2. Open the passport and review the data.
3. Click **Approve**.

**Expected result:** the passport status changes to **Third-Party Verified**.

### Step 10: Log out

Open the user menu and choose **Log out**.

---

## Part 3 – Passport Officer

### Step 11: Log in as Passport Officer

1. On the sign-in page, select the **Passport Officer** persona (Issuance & Statutory Authority).
2. Enter the passport officer's work email and password.
3. Click **Sign in to workspace**.

### Step 12: Submit to agency

1. Go to **Carbon Passports** and open the Third-Party Verified passport.
2. Click **Submit to Agency**.

**Expected result:** the passport status changes to **SubmittedToAgency**.

---

## Expected Status Progression

| After step | Actor | Passport status |
|---|---|---|
| 5 | Company Operator | Draft |
| 6 | Company Operator | Submitted / UnderVerification |
| 9 | Verifier | Third-Party Verified |
| 12 | Passport Officer | SubmittedToAgency |

## Notes

- The batch number is generated or entered per run, so the `CB-2026-…` values you see will differ from any example in this doc.
- The Verifier and Passport Officer steps (8–12) were written from the described workflow. Check the button labels (**Approve**, **Submit to Agency**) against the UI.
