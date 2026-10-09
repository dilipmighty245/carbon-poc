import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(password = 'Password123!') {
    const passwordInput = this.page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
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

    await expect(this.page).toHaveURL(/.*\/dashboard/);
  }

  async assertDashboardLoaded(legalName?: string) {
    await expect(this.page.getByRole('heading', { name: /company dashboard/i })).toBeVisible();
    if (legalName) {
      await expect(this.page.getByText(legalName).first()).toBeVisible();
    }
  }
}
