import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/registration');
  }

  async completeAccountOwnerStep(name: string, phone: string, password: string) {
    await this.page.locator('div:has(> label:has-text("Primary Account Owner Name")) input').fill(name);
    await this.page.locator('div:has(> label:has-text("Direct Phone Number")) input').fill(phone);
    await this.page.locator('input[placeholder="Enter account password"]').fill(password);
    await this.page.locator('input[placeholder="Confirm account password"]').fill(password);

    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  async completeLegalIdentityStep(legalName: string, regNumber: string) {
    await this.page.locator('div:has(> label:has-text("Legal Entity Name")) input').fill(legalName);
    await this.page.locator('div:has(> label:has-text("Company Registration No")) input').fill(regNumber);
  }

  async jumpToReviewAndSubmit() {
    // Click on Review & Submit step in stepper sidebar
    await this.page.getByRole('button', { name: /Review & Submit/i }).click();
  }

  async submitRegistration(): Promise<void> {
    const submitBtn = this.page.getByRole('button', { name: /submit company registration/i });
    await expect(submitBtn).toBeVisible();

    // Set up network listeners for real Go API Gateway calls (Profile + Auth User registration)
    const profileResponsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/organisation/profile') && resp.request().method() === 'PUT'
    );
    const authRegPromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/auth/register') && resp.request().method() === 'POST'
    ).catch(() => null);

    await submitBtn.click();

    // Verify real backend returned 200 OK (no mock)
    const profileResponse = await profileResponsePromise;
    expect(profileResponse.status()).toBe(200);

    const authRegResp = await authRegPromise;
    if (authRegResp) {
      expect([200, 201, 409]).toContain(authRegResp.status());
    }

    // Confirm success modal is displayed
    await expect(this.page.getByText('REGISTRATION SUCCESSFUL')).toBeVisible();
  }

  async proceedToLogin() {
    const proceedBtn = this.page.getByRole('button', { name: /proceed to login/i });
    await proceedBtn.click();
    await expect(this.page).toHaveURL(/.*\/login/);
  }
}
