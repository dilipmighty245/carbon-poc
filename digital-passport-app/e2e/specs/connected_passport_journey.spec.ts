import { test, expect } from '@playwright/test';
import { TEST_SPECIMEN } from '../fixtures/specimen';
import { RegistrationPage } from '../pages/RegistrationPage';
import { LoginPage } from '../pages/LoginPage';
import { FacilitiesPage } from '../pages/FacilitiesPage';
import { ProductSetupPage } from '../pages/ProductSetupPage';
import { PassportPage } from '../pages/PassportPage';

test.describe('Connected Saurient Core Journey: Org Registration -> Facility Telemetry -> Protected Issuance', () => {
  test.beforeEach(async ({ context }) => {
    // Isolate browser context and flush all draft and registration state before mount
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('executes complete 7-step unbroken flow with live Go API gateway network assertions', async ({ page }) => {
    const regPage = new RegistrationPage(page);
    const loginPage = new LoginPage(page);
    const facilitiesPage = new FacilitiesPage(page);
    const productPage = new ProductSetupPage(page);
    const passportPage = new PassportPage(page);

    const runId = Date.now();
    const batchId = `BATCH-E2E-${runId}`;
    const legalName = `${TEST_SPECIMEN.company.legalName} ${runId}`;

    // =========================================================================
    // STEP 1: Organisation Registration (/registration)
    // =========================================================================
    await regPage.goto();
    await regPage.completeAccountOwnerStep(
      TEST_SPECIMEN.company.ownerName,
      TEST_SPECIMEN.company.ownerPhone,
      TEST_SPECIMEN.company.ownerPassword
    );
    await regPage.completeLegalIdentityStep(legalName, TEST_SPECIMEN.company.registrationNumber);
    await regPage.jumpToReviewAndSubmit();
    await regPage.submitRegistration();
    await regPage.proceedToLogin();

    // =========================================================================
    // STEP 2: Authentication & Session (/login)
    // =========================================================================
    await loginPage.login(TEST_SPECIMEN.company.ownerPassword, 'elena.rostova@saurient.io');
    await loginPage.assertDashboardLoaded(legalName);

    // =========================================================================
    // STEP 3: Facility Creation & Meter Setup (/organisation -> Facilities)
    // =========================================================================
    await facilitiesPage.goto();
    await facilitiesPage.selectFacilitiesTab();
    await facilitiesPage.createFacility(
      TEST_SPECIMEN.facility.name,
      TEST_SPECIMEN.facility.address
    );

    // =========================================================================
    // STEP 4: Product Batch Creation with Facility Scope 2 Binding (/products/new)
    // =========================================================================
    await productPage.goto();
    await productPage.createBatch({
      productName: TEST_SPECIMEN.product.productName,
      commodity: TEST_SPECIMEN.product.commodity,
      facilityName: TEST_SPECIMEN.facility.name,
      batchId,
      fuelLiters: TEST_SPECIMEN.product.fuelLiters,
      electricityKwh: TEST_SPECIMEN.facility.scope2Kwh,
    });

    // =========================================================================
    // STEP 5 & 6: Pre-Issuance Compliance Audit & Readiness (/passport/readiness)
    // =========================================================================
    await passportPage.verifyReadinessAndProceed(batchId);

    // =========================================================================
    // STEP 7: Protected Passport Issuance & Public QR Verification
    // =========================================================================
    await passportPage.authorizeAndIssue(
      TEST_SPECIMEN.signer.name,
      TEST_SPECIMEN.signer.keyId
    );
    await passportPage.verifyQrVerification();
  });
});
