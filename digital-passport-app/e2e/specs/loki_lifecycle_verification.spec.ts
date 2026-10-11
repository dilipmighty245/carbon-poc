import { test, expect } from '@playwright/test';

test.describe('Live Lifecycle Verification (org_loki)', () => {
  const batchId = 'CB-2026-LOKI-PROD';
  const tenantId = 'org_loki';
  const companyName = 'Loki';
  const ownerEmail = 'loki@saurient.io';
  const ownerPassword = 'qwerty';

  test.beforeEach(async ({ page }) => {
    // Clear browser session storage to ensure clean state
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('executes complete end-to-end multi-tenant lifecycle from registration to agency lodging', async ({ page, request }) => {
    // =========================================================================
    // STEP 1: Verify Negative Login (Explaining Screenshot behavior)
    // Attempting to sign in with an unregistered account correctly fails with the error card
    // =========================================================================
    await page.goto('/login');

    const companyOpBtn = page.getByRole('button', { name: /Company Operator/i });
    if (await companyOpBtn.isVisible()) {
      await companyOpBtn.click();
    }

    const emailInput = page.locator('input[type="email"]');
    await emailInput.clear();
    await emailInput.fill('unregistered.test@saurient.io');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.clear();
    await passwordInput.fill('qwerty');

    const signInBtn = page.getByRole('button', { name: /sign in to workspace/i });
    await signInBtn.click();

    // Verify rejection: Account/Company not registered error card must appear
    await expect(page.getByText(/(Neither your user account nor your company has been registered|Your company .* is registered on the platform, but your user account was not found)/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Register Organisation/i })).toBeVisible();

    // =========================================================================
    // STEP 2: Register Organisation (Loki / org_loki)
    // =========================================================================
    await page.goto('/registration');
    await page.locator('div:has(> label:has-text("Primary Account Owner Name")) input').fill('Loki Admin');
    const workEmailInput = page.locator('div:has(> label:has-text("Corporate Work Email")) input');
    if (await workEmailInput.isVisible()) {
      await workEmailInput.fill(ownerEmail);
    }
    await page.locator('div:has(> label:has-text("Direct Phone Number")) input').fill('+44 20 7946 0192');
    await page.locator('input[placeholder="Enter account password"]').fill(ownerPassword);
    await page.locator('input[placeholder="Confirm account password"]').fill(ownerPassword);
    await page.getByRole('button', { name: /continue/i }).click();

    await page.locator('div:has(> label:has-text("Legal Entity Name")) input').fill(companyName);
    await page.locator('div:has(> label:has-text("Company Registration No")) input').fill('REG-LOKI-2026-001');

    await page.getByRole('button', { name: /Review & Submit/i }).click();
    await page.getByRole('button', { name: /submit company registration/i }).click();
    await expect(page.getByText('REGISTRATION SUCCESSFUL')).toBeVisible({ timeout: 10000 });

    const proceedBtn = page.getByRole('button', { name: /(proceed to sign in|proceed to login)/i });
    await proceedBtn.click();
    await expect(page).toHaveURL(/.*\/login.*/);

    // =========================================================================
    // STEP 3: Sign In with Registered Credentials as Company Operator
    // =========================================================================
    const loginEmailInput = page.locator('input[type="email"]');
    await loginEmailInput.clear();
    await loginEmailInput.fill(ownerEmail);

    const loginPasswordInput = page.locator('input[type="password"]');
    await loginPasswordInput.clear();
    await loginPasswordInput.fill(ownerPassword);

    const loginResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/auth/login') && resp.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in to workspace/i }).click();
    const loginResp = await loginResponsePromise;
    expect(loginResp.status()).toBe(200);

    // Ensure session tenant is org_loki
    await page.evaluate(() => {
      localStorage.setItem('saurient_tenant_id', 'org_loki');
    });

    await expect(page).toHaveURL(/.*organisation/);

    // =========================================================================
    // STEP 4: Product Batch Creation under X-Tenant-ID: org_loki
    // Batch ID: CB-2026-LOKI-PROD
    // =========================================================================
    await page.goto('/products/new');

    // Fill Product Setup Form
    const prodNameInput = page.locator('div:has(> label:has-text("Product Name")) input');
    await prodNameInput.fill('Loki Carbon Steel');

    // Select Commodity: Steel
    const commoditySelect = page.locator('div:has(> label:has-text("Commodity Type")) select');
    if (await commoditySelect.isVisible()) {
      await commoditySelect.selectOption({ label: 'Steel' }).catch(() => {});
    }

    // Facility name / ID
    const facilityInput = page.locator('input[placeholder*="plant / facility"]');
    const facilitySelect = page.locator('div:has(label:has-text("Plant / Facility")) select');
    if (await facilityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await facilityInput.fill('fac_loki_01');
    } else if (await facilitySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await facilitySelect.selectOption({ index: 0 }).catch(() => {});
    }

    // Fill Batch ID: CB-2026-LOKI-PROD
    const batchInput = page.locator('div:has(> label:has-text("Batch / Lot Number")) input');
    await batchInput.fill(batchId);

    // Fill Scope 1 Fuel Liters
    const fuelInput = page.locator('div:has(> label:has-text("Scope 1: Diesel")) input');
    await fuelInput.fill('1500');

    // Fill Scope 2 Electricity kWh
    const elecInput = page.locator('div:has(> label:has-text("Scope 2: Grid Electricity")) input');
    await elecInput.fill('3500');

    // Intercept product creation API call to verify tenant header
    const productResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'POST'
    );

    await page.getByRole('button', { name: /save & register product/i }).click();

    const prodResp = await productResponsePromise;
    expect(prodResp.status()).toBe(201);
    const prodData = await prodResp.json();
    expect(prodData.batch_id).toBe(batchId);
    expect(prodData.tenant_id).toBe(tenantId);

    // =========================================================================
    // STEP 5: MRV Readiness Submission under Auditor Context (X-Tenant-ID: all)
    // =========================================================================
    await page.goto(`/passport/readiness?id=${batchId}`);
    await page.waitForLoadState('networkidle');

    // Check if readiness button shows submit
    const submitVerificationBtn = page.getByRole('button', { name: /submit for verification/i });
    if (await submitVerificationBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await submitVerificationBtn.click();
      await expect(page.getByText(/successfully submitted for independent verification/i)).toBeVisible({ timeout: 5000 });
    }

    // Also verify MRV Readiness tab
    await page.goto('/mrv/readiness');
    const mrvSubmitBtn = page.locator('[data-testid="readiness-resolve-btn"]');
    if (await mrvSubmitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await mrvSubmitBtn.innerText();
      if (btnText.includes('Submit Verification Package')) {
        await mrvSubmitBtn.click();
      }
    }

    // =========================================================================
    // STEP 6: Independent Auditor Sign-off (Bureau Veritas UK Ltd, X-Tenant-ID: all)
    // Authenticate as Verifier
    // =========================================================================
    await page.goto('/login');
    const verifierRoleBtn = page.getByRole('button', { name: /Verifier/i });
    await verifierRoleBtn.click();

    // Verify Verifier credentials loaded
    await expect(page.locator('input[type="email"]')).toHaveValue('auditor@bureau-veritas.com');

    const verifierLoginPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/auth/login') && resp.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in to workspace/i }).click();
    await verifierLoginPromise;

    // Navigate to MRV Report / Verifications tab
    await page.goto(`/mrv/report?id=${batchId}`);
    await page.waitForLoadState('networkidle');

    const approveSignBtn = page.getByRole('button', { name: /approve & sign verification statement/i });
    if (await approveSignBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const verifyPromise = page.waitForResponse(
        (resp) => resp.url().includes('/verify') && resp.request().method() === 'POST'
      );
      await approveSignBtn.click();
      const verifyResp = await verifyPromise;
      expect(verifyResp.status()).toBe(200);
      await expect(page.getByText(/Verification Statement Issued/i)).toBeVisible({ timeout: 8000 });
    }

    // =========================================================================
    // STEP 7: Digital Carbon Passport Signed and Issued (Passport Officer)
    // Authenticate as Passport Officer (X-Tenant-ID: all, X-User-Role: Passport Officer)
    // =========================================================================
    await page.goto('/login');
    const officerRoleBtn = page.getByRole('button', { name: /Passport Officer/i });
    await officerRoleBtn.click();

    await expect(page.locator('input[type="email"]')).toHaveValue('officer@saurient.com');

    const officerLoginPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/auth/login') && resp.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in to workspace/i }).click();
    await officerLoginPromise;

    // Navigate to Sign & Issue tab for this batch
    await page.goto(`/passport/sign-issue?id=${batchId}`);
    await page.waitForLoadState('networkidle');

    // Fill Authorized Signer and Key Identifier if input fields are present
    const signerInput = page.locator('div:has(> label:has-text("Authorized Signer Identity")) input');
    if (await signerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signerInput.fill('Passport Officer');
    }
    const keyInput = page.locator('div:has(> label:has-text("Organizational Key Identifier")) input');
    if (await keyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await keyInput.fill('0xKEY-ORATOR-PROD-SECURE-ED25519-88492');
    }

    const signAndIssueBtn = page.getByRole('button', { name: /authorize digital signature & issue passport/i });
    if (await signAndIssueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const signPromise = page.waitForResponse(
        (resp) => resp.url().includes('/sign') && resp.request().method() === 'POST'
      );
      await signAndIssueBtn.click();
      const signResp = await signPromise;
      expect(signResp.status()).toBe(200);
      await expect(page.getByText(/Passport Successfully Signed & Published!/i)).toBeVisible({ timeout: 8000 });
    }

    // =========================================================================
    // STEP 8: Lodged with Central Regulatory Authority (Status: SubmittedToAgency)
    // =========================================================================
    const submitAgencyBtn = page.getByRole('button', { name: /submit to eu cbam agency/i });
    if (await submitAgencyBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const agencyPromise = page.waitForResponse(
        (resp) => resp.url().includes('/submit-agency') && resp.request().method() === 'POST'
      );
      await submitAgencyBtn.click();
      const agencyResp = await agencyPromise;
      expect(agencyResp.status()).toBe(200);
      await expect(page.getByText(/Lodged with EU CBAM Transitional Registry/i)).toBeVisible({ timeout: 8000 });
    }

    // =========================================================================
    // STEP 9: Direct API Live Verification & Multi-Tenant Isolation Assertions
    // =========================================================================
    // 9a: Query with X-Tenant-ID: org_loki
    const lokiApiResponse = await request.get('http://localhost:8080/api/v1/passports', {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });
    expect(lokiApiResponse.status()).toBe(200);
    const lokiPassports = await lokiApiResponse.json();

    expect(lokiPassports.length).toBeGreaterThan(0);
    const lokiPassport = lokiPassports.find((p: any) => p.product_summary?.batch_number === batchId);
    expect(lokiPassport).toBeDefined();

    // Assert status: SubmittedToAgency
    expect(lokiPassport.passport_metadata?.status).toBe('SubmittedToAgency');

    // Assert tenant_id: "org_loki"
    expect(lokiPassport.passport_metadata?.tenant_id).toBe(tenantId);
    expect(lokiPassport.product_summary?.tenant_id).toBe(tenantId);

    // Assert producer_organization: "Loki" or "Loki Steel" (never "all" or demo)
    expect(lokiPassport.product_summary?.producer_organization).toMatch(/Loki/i);
    expect(lokiPassport.product_summary?.producer_organization).not.toBe('all');
    expect(lokiPassport.product_summary?.producer_organization).not.toBe('org_saurient_demo');

    // 9b: Isolation confirmed: Query with X-Tenant-ID: org_other must return []
    const otherApiResponse = await request.get('http://localhost:8080/api/v1/passports', {
      headers: {
        'X-Tenant-ID': 'org_other',
      },
    });
    expect(otherApiResponse.status()).toBe(200);
    const otherPassports = await otherApiResponse.json();
    expect(otherPassports).toEqual([]);
  });
});
