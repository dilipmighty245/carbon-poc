import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../pages/RegistrationPage';

async function prepareRegistration(page: import('@playwright/test').Page) {
  const registration = new RegistrationPage(page);
  await registration.goto();
  await registration.completeAccountOwnerStep('Review Owner', '+91 1234567890', 'ReviewPassword123!', `review-${Date.now()}@example.test`);
  await registration.completeLegalIdentityStep('Review Manufacturing', `REG-${Date.now()}`);
  await registration.completeRemainingSteps();
  return registration;
}

for (const failure of ['network', 'server', 'duplicate', 'wrong tenant']) {
  test(`registration retains draft and refuses success on ${failure}`, async ({ page }) => {
    const paths: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/v1/')) paths.push(new URL(request.url()).pathname);
    });
    await page.route('**/api/v1/organisation/register', async route => {
      if (failure === 'network') { await route.abort('failed'); return; }
      if (failure === 'wrong tenant') {
        await route.fulfill({ status: 201, json: { token: 'test-token', tenant_id: 'org-new', profile: { tenant_id: 'org-new' }, user: { tenant_id: 'org-old', role: 'Organisation Owner' } } });
        return;
      }
      await route.fulfill({ status: failure === 'server' ? 500 : 409, json: { error: failure === 'server' ? 'Registration was not completed; please retry.' : 'An account with this email already exists.' } });
    });
    await prepareRegistration(page);
    await page.getByRole('button', { name: /submit company registration/i }).click();
    const message = failure === 'network' ? /Could not reach the registration service/ : failure === 'wrong tenant' ? /Registration could not be confirmed/ : failure === 'server' ? /Registration was not completed/ : /An account with this email already exists/;
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByText('REGISTRATION SUCCESSFUL', { exact: true })).toHaveCount(0);
    const state = await page.evaluate(() => ({
      draft: JSON.parse(localStorage.getItem('saurient_registration_draft') || '{}'),
      registered: localStorage.getItem('saurient_company_registered'),
      token: localStorage.getItem('saurient_auth_token'),
    }));
    expect(state.draft.formData.legalName).toBe('Review Manufacturing');
    expect(state.draft.formData.ownerPassword).toBeUndefined();
    expect(state.draft.formData.confirmPassword).toBeUndefined();
    expect(state.registered).toBeNull();
    expect(state.token).toBeNull();
    expect(paths).toEqual(['/api/v1/organisation/register']);
  });
}

test('name edits preserve work email and short passwords are rejected at step one', async ({ page }) => {
  const registration = new RegistrationPage(page);
  await registration.goto();
  const input = (label: string) => page.locator(`div:has(> label:has-text("${label}")) input`);
  await input('Primary Account Owner Name').fill('Review Owner');
  await input('Corporate Work Email').fill('owner@example.test');
  await input('Primary Account Owner Name').fill('Review Owner Edited');
  await expect(input('Corporate Work Email')).toHaveValue('owner@example.test');
  await input('Direct Phone Number').fill('+91 1234567890');
  await page.getByPlaceholder('Enter account password', { exact: true }).fill('abc');
  await page.getByPlaceholder('Confirm account password', { exact: true }).fill('abc');
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText('Account Password must be at least 6 characters.')).toBeVisible();
});

test('declarations are required and documents are not presented as uploaded', async ({ page }) => {
  const registration = new RegistrationPage(page);
  await registration.goto();
  await registration.completeAccountOwnerStep('Review Owner', '+91 1234567890', 'ReviewPassword123!', 'owner@example.test');
  await registration.completeLegalIdentityStep('Review Manufacturing', 'REG-DECLARATIONS');
  await page.getByRole('button', { name: /Documents/i }).click();
  await expect(page.getByText('Documents are collected during verification')).toBeVisible();
  await expect(page.getByText('Uploaded', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page.getByText('Please accept both registration declarations before submitting.')).toBeVisible();
  await expect(page.getByRole('button', { name: /submit company registration/i })).toHaveCount(0);
});

test('successful registration supports a fresh browser login without saved passwords', async ({ page, browser }) => {
  const registration = await prepareRegistration(page);
  const email = await page.evaluate(() => JSON.parse(localStorage.getItem('saurient_registration_draft')!).formData.ownerEmail);
  await registration.submitRegistration();
  const company = await page.evaluate(() => JSON.parse(localStorage.getItem('saurient_registered_company')!));
  expect(company.ownerPassword).toBeUndefined();
  expect(company.confirmPassword).toBeUndefined();
  const freshContext = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const freshPage = await freshContext.newPage();
    await freshPage.goto('/login');
    await freshPage.getByRole('button', { name: 'Company Operator', exact: false }).click();
    await expect(freshPage.locator('input[type="password"]')).toHaveValue('');
    await freshPage.locator('input[type="email"]').fill(email);
    await freshPage.locator('input[type="password"]').fill('ReviewPassword123!');
    await freshPage.getByRole('button', { name: /sign in to workspace/i }).click();
    await expect(freshPage).toHaveURL(/\/organisation$/);
    expect(await freshPage.evaluate(() => localStorage.getItem('saurient_tenant_id'))).toBe(company.tenantId);
  } finally { await freshContext.close(); }
});

test('old saved passwords are removed and never restored into a draft', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('saurient_registration_draft', JSON.stringify({ activeStep: 1, formData: { ownerName: 'Legacy Owner', ownerEmail: 'legacy@example.test', legalName: 'Legacy Organisation', ownerPassword: 'LegacySecret', confirmPassword: 'LegacySecret' } }));
    localStorage.setItem('saurient_registered_company', JSON.stringify({ ownerPassword: 'LegacySecret', confirmPassword: 'LegacySecret', legalName: 'Legacy Organisation' }));
  });
  await page.goto('/registration');
  await expect(page.locator('div:has(> label:has-text("Legal Entity Name")) input')).toHaveValue('Legacy Organisation');
  await page.getByRole('button', { name: /Account Owner/i }).click();
  await expect(page.getByPlaceholder('Enter account password', { exact: true })).toHaveValue('');
  const stored = await page.evaluate(() => [localStorage.getItem('saurient_registration_draft'), localStorage.getItem('saurient_registered_company')]);
  expect(stored.join('')).not.toContain('LegacySecret');
});

test('organisation profile edits retain the form and show errors on a failed save', async ({ page }) => {
  const registration = await prepareRegistration(page);
  await registration.submitRegistration();
  await page.goto('/organisation');
  await page.getByRole('button', { name: /edit.*profile/i }).click();
  await page.route('**/api/v1/organisation/profile', async route => {
    if (route.request().method() === 'PUT') await route.abort('failed');
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Edit Organisation Profile' })).toBeVisible();
  await expect(page.getByText(/Organisation profile updated successfully/)).toHaveCount(0);
});
