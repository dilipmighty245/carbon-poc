import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface ProductBatchData {
  productName: string;
  commodity: string;
  facilityName: string;
  batchId: string;
  fuelLiters: number;
  electricityKwh: number;
}

export class ProductSetupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/products/new');
  }

  async createBatch(data: ProductBatchData) {
    const commoditySelect = this.page.locator('div:has(> label:has-text("Commodity *")) select');
    await commoditySelect.selectOption({ label: data.commodity });

    // Fill Product Name
    const productNameInput = this.page.locator('div:has(> label:has-text("Product Name")) input');
    await productNameInput.fill(data.productName);

    // Select or Fill Facility
    const facilitySelect = this.page.locator('label').filter({ hasText: 'Plant / Facility' }).locator('..').locator('..').locator('select');
    await facilitySelect.selectOption({ value: data.facilityName });

    // Fill Batch ID
    const batchInput = this.page.locator('div:has(> label:has-text("Batch / Lot Number")) input');
    await batchInput.fill(data.batchId);

    // Fill Scope 1 Fuel Liters
    const fuelInput = this.page.locator('div:has(> label:has-text("Scope 1: Diesel")) input');
    await fuelInput.fill(String(data.fuelLiters));

    // Fill Scope 2 Electricity kWh (bound from facility telemetry)
    const elecInput = this.page.locator('div:has(> label:has-text("Scope 2: Grid Electricity")) input');
    await elecInput.fill(String(data.electricityKwh));

    // Network assertion: Catch real Go API Gateway creation response
    const productResponsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/products') && resp.request().method() === 'POST'
    );

    const submitBtn = this.page.getByRole('button', { name: /save & register product/i });
    await submitBtn.click();

    const productResp = await productResponsePromise;
    expect(productResp.status()).toBe(201);

    const body = await productResp.json();
    expect(['Pending', 'VERIFIED']).toContain(body.status);

    // Verify navigation to /passport
    await this.page.waitForURL(/.*\/passport.*/, { timeout: 15000 });
  }
}
