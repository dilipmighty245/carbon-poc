import { Page } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async getSidebarOrgName(): Promise<string> {
    const orgElement = this.page.locator('aside p.text-xs.font-bold.text-white');
    return (await orgElement.textContent()) || '';
  }
}
