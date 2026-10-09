import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FacilitiesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/organisation');
  }

  async selectFacilitiesTab() {
    const facilitiesTabBtn = this.page.getByRole('button', { name: 'Facilities' });
    await facilitiesTabBtn.click();
    await expect(this.page.getByRole('button', { name: 'Add Facility' })).toBeVisible();
  }

  async createFacility(name: string, address: string) {
    await this.page.getByRole('button', { name: 'Add Facility' }).click();

    await this.page.locator('input[placeholder*="Takoradi Grain Silos"]').fill(name);
    await this.page.locator('textarea[placeholder*="Street, City"]').fill(address);

    const saveFacilityPromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/organisation/facilities') && (resp.request().method() === 'POST' || resp.request().method() === 'PUT')
    );

    await this.page.getByRole('button', { name: 'Save Facility' }).click();

    const saveResp = await saveFacilityPromise;
    expect(saveResp.status()).toBe(200);

    // Confirm new facility card is rendered in the list
    await expect(this.page.getByText(name).first()).toBeVisible();
  }
}
