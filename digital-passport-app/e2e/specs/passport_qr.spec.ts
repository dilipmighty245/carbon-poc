import { test, expect } from '@playwright/test';

const passport = {
  passport_metadata: { passport_id: 'CP-MOBILE-002', status: 'Issued', cryptographic_hash: 'abc123' },
  product_summary: { product_name: 'Mobile test steel', batch_number: 'BATCH-002', producer_organization: 'Test producer', facility: { country_of_origin: 'India' } },
  carbon_footprint: { intensity_per_unit: { value: 0, unit: 'kgCO2e/kg' }, total_batch_footprint_kg_co2e: 0 },
};

test('QR uses the selected passport and opens its public record on mobile', async ({ page, context }) => {
  await page.route('**/api/v1/passports', route => route.fulfill({ json: [{ ...passport, passport_metadata: { passport_id: 'CP-FIRST' } }, passport] }));
  await page.addInitScript(() => {
    localStorage.setItem('saurient_auth_token', 'test-session');
    localStorage.setItem('saurient_user_email', 'qr@example.test');
  });
  await page.goto('/passport/qr/CP-MOBILE-002');
  const input = page.getByRole('textbox', { name: 'Verification URL' });
  await expect(input).toHaveValue(/\/verify\/CP-MOBILE-002$/);
  const url = await input.inputValue();
  await expect(page.getByTestId('passport-qr').locator('path')).toHaveAttribute('d', /M4,/);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download QR (SVG)' }).click();
  expect((await download).suggestedFilename()).toBe('passport-CP-MOBILE-002-qr.svg');

  const mobileContext = await context.browser()!.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobile = await mobileContext.newPage();
  await mobile.route('**/api/v1/passports/CP-MOBILE-002', route => {
    expect(route.request().headers()['x-tenant-id']).toBe('public');
    return route.fulfill({ json: passport });
  });
  await mobile.goto(url);
  await expect(mobile.getByRole('heading', { name: 'Digital Carbon Passport' })).toBeVisible();
  await expect(mobile.getByText('Mobile test steel')).toBeVisible();
  await expect(mobile.getByText('0 kgCO2e/kg', { exact: true })).toBeVisible();
  expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await mobileContext.close();
});

test('public passport page reports missing records without signing in', async ({ page }) => {
  await page.route('**/api/v1/passports/missing', route => route.fulfill({ status: 404 }));
  await page.goto('/verify/missing');
  await expect(page.getByRole('alert')).toHaveText('Passport not found.');
  await expect(page).toHaveURL(/\/verify\/missing$/);
});
