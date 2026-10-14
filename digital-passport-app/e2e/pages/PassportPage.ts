import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginPage } from './LoginPage';

export class PassportPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoReadiness() {
    await this.page.goto('/passport/readiness');
  }

  async verifyReadinessAndProceed(batchId: string): Promise<void> {
    await this.page.goto(`/passport/readiness?id=${encodeURIComponent(batchId)}`);
    const submitResponse = this.page.waitForResponse(resp => resp.url().includes('/submit') && resp.request().method() === 'POST');
    await this.page.getByRole('button', { name: /submit for verification/i }).click();
    expect((await submitResponse).status()).toBe(200);
    await expect(this.page.getByText(/successfully submitted for independent verification/i)).toBeVisible();
    const login = new LoginPage(this.page);
    await login.loginAsAuthority('Verifier');
    await this.page.goto(`/mrv/report?id=${encodeURIComponent(batchId)}`);
    const verificationResponse = this.page.waitForResponse(resp => resp.url().includes('/verify') && resp.request().method() === 'POST');
    await this.page.getByRole('button', { name: /approve & sign verification statement/i }).click();
    expect((await verificationResponse).status()).toBe(200);
    await expect(this.page.getByText(/Verification Statement Issued/i)).toBeVisible();
    await login.loginAsAuthority('Passport Officer');
    await this.page.goto(`/passport/readiness?id=${encodeURIComponent(batchId)}`);
    await expect(this.page.getByText('100%')).toBeVisible();

    const proceedBtn = this.page.getByRole('button', { name: /authorize & issue passport/i });
    await expect(proceedBtn).toBeEnabled();
    await proceedBtn.click();

    await expect(this.page).toHaveURL(/.*\/passport\/sign-issue.*/);
  }

  async authorizeAndIssue(signerName: string, keyId: string): Promise<void> {
    const signerInput = this.page.locator('div:has(> label:has-text("Authorized Signer Identity")) input');
    await signerInput.fill(signerName);

    const keyInput = this.page.locator('div:has(> label:has-text("Organizational Key Identifier")) input');
    await keyInput.fill(keyId);

    const signBtn = this.page.getByRole('button', { name: /authorize digital signature & issue/i });
    const responsePromise = this.page.waitForResponse(resp => resp.url().includes('/sign') && resp.request().method() === 'POST');
    await signBtn.click();
    expect((await responsePromise).status()).toBe(200);

    // Verify cryptographic issuance success message
    await expect(this.page.getByText('Passport Successfully Signed & Published!')).toBeVisible({ timeout: 10000 });
  }

  async verifyQrVerification(): Promise<void> {
    const qrBtn = this.page.getByRole('button', { name: /get verification qr/i });
    await qrBtn.click();

    await expect(this.page).toHaveURL(/.*\/passport\/qr.*/);
    await expect(this.page.getByRole('heading', { name: /customs & public qr verification/i })).toBeVisible();
    await expect(this.page.locator('svg').first()).toBeVisible();
  }
}
