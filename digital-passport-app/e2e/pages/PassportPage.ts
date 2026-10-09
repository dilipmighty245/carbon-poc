import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PassportPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async gotoReadiness() {
    await this.page.goto('/passport/readiness');
  }

  async verifyReadinessAndProceed(batchId?: string): Promise<void> {
    await this.page.goto('/passport/readiness');
    if (batchId) {
      const batchSelect = this.page.locator('select');
      if (await batchSelect.isVisible()) {
        await batchSelect.selectOption({ label: new RegExp(batchId, 'i') }).catch(() => {});
      }
    }
    await expect(this.page.getByText('100%')).toBeVisible();

    const proceedBtn = this.page.getByRole('button', { name: /proceed to sign & issue/i });
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
    await signBtn.click();

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
