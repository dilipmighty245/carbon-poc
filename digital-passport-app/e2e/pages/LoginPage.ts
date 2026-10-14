import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/login');
  }

  async loginAsAuthority(role: 'Verifier' | 'Passport Officer') {
    await this.goto();
    await this.page.getByRole('button', { name: new RegExp(role, 'i') }).click();
    const responsePromise = this.page.waitForResponse(resp => resp.url().endsWith('/api/v1/auth/login') && resp.request().method() === 'POST');
    await this.page.getByRole('button', { name: /sign in to workspace/i }).click();
    const response = await responsePromise;
    expect(response.status(), await response.text()).toBe(200);
    await expect(this.page).toHaveURL(role === 'Verifier' ? /\/mrv/ : /\/passport\/sign-issue/);
  }

  async login(password = 'Password123!', email?: string) {
    if (email) {
      const emailInput = this.page.locator('input[type="email"]');
      if (await emailInput.isVisible()) {
        await emailInput.clear();
        await emailInput.fill(email);
      }
    }

    const passwordInput = this.page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.clear();
      await passwordInput.fill(password);
    }

    const loginResponsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/auth/login') && resp.request().method() === 'POST'
    );

    const submitBtn = this.page.getByRole('button', { name: /sign in to workspace/i });
    await submitBtn.click();

    const loginResp = await loginResponsePromise;
    expect(loginResp.status()).toBe(200);

    const body = await loginResp.json();
    expect(body.token).toBeDefined();

    await expect(this.page).toHaveURL(/.*organisation/);
  }

  async assertDashboardLoaded(legalName?: string) {
    if (this.page.url().includes('/organisation')) {
      await expect(this.page).toHaveURL(/.*organisation/);
      if (legalName) {
        await expect(this.page.getByText(legalName).first()).toBeVisible();
      }
      return;
    }
    await expect(this.page.getByRole('heading', { name: /company dashboard/i })).toBeVisible();
    if (legalName) {
      await expect(this.page.getByText(legalName).first()).toBeVisible();
    }
  }

  async assertOrganisationLoaded(legalName?: string) {
    await expect(this.page).toHaveURL(/.*organisation/);
    if (legalName) {
      await expect(this.page.getByText(legalName).first()).toBeVisible();
    }
  }
}
