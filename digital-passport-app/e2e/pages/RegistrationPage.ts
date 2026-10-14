import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/registration?new=true');
  }

  async completeAccountOwnerStep(name: string, phone: string, password: string, email?: string) {
    await this.page.locator('div:has(> label:has-text("Primary Account Owner Name")) input').fill(name);
    if (email) {
      await this.page.locator('div:has(> label:has-text("Corporate Work Email")) input').fill(email);
    }
    await this.page.locator('div:has(> label:has-text("Direct Phone Number")) input').fill(phone);
    await this.page.locator('input[placeholder="Enter account password"]').fill(password);
    await this.page.locator('input[placeholder="Confirm account password"]').fill(password);

    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  async completeLegalIdentityStep(legalName: string, regNumber: string, country = 'India') {
    await this.page.locator('div:has(> label:has-text("Legal Entity Name")) input').fill(legalName);
    await this.page.locator('div:has(> label:has-text("Company Registration No")) input').fill(regNumber);
    await this.page.locator('div:has(> label:has-text("Country of Registration")) input').fill(country);
  }

  async jumpToReviewAndSubmit() {
    await this.page.getByRole('button', { name: /Declarations/i }).click();
    await this.acceptDeclarations();
    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  async acceptDeclarations() {
    await this.page.getByRole('checkbox', { name: 'Confirm organisation details' }).check();
    await this.page.getByRole('checkbox', { name: 'Confirm data accuracy' }).check();
  }

  async completeRemainingSteps() {
    for (let step = 1; step < 8; step++) {
      await this.page.getByRole('button', { name: /continue/i }).click();
    }
    await this.acceptDeclarations();
    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  async submitRegistration(): Promise<void> {
    const submitBtn = this.page.getByRole('button', { name: /submit company registration/i });
    await expect(submitBtn).toBeVisible();

    const responsePromise = this.page.waitForResponse(
      resp => resp.url().endsWith('/api/v1/organisation/register') && resp.request().method() === 'POST'
    );

    await submitBtn.click();

    const response = await responsePromise;
    expect(response.status(), await response.text()).toBe(201);
    const body = await response.json();
    expect(body.token).toBeTruthy();
    expect(body.user.tenant_id).toBe(body.tenant_id);
    expect(body.profile.tenant_id).toBe(body.tenant_id);
    expect(body.profile.status).toBe('Pending Verification');
    expect(await this.page.evaluate(() => localStorage.getItem('saurient_tenant_id'))).toBe(body.tenant_id);

    // Confirm success modal is displayed
    await expect(this.page.getByText('REGISTRATION SUCCESSFUL')).toBeVisible();
  }

  async proceedToLogin() {
    const proceedBtn = this.page.getByRole('button', { name: /(proceed to sign in|proceed to login)/i });
    await proceedBtn.click();
    await expect(this.page).toHaveURL(/.*\/login/);
  }
}
