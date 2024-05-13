import type { Page } from '@playwright/test';

export class DSyncPage {
  constructor(public readonly page: Page) {}

  async addDSyncConnection() {
    await this.page.goto('http://localhost:5225/admin/directory-sync');
    await this.page.getByRole('link', { name: 'New Directory' }).click();
    await this.page.getByLabel('Directory name').fill('DS-1');
    await this.page.getByLabel('Directory provider').click();
    await this.page.getByLabel('Tenant').fill('acme.com');
    await this.page.getByLabel('Product').fill('demo');
    await this.page.getByRole('button', { name: 'Create Directory' }).click();
    const scimUrl = await this.page.getByRole('textbox').first().inputValue();
    const scimToken = await this.page.getByRole('textbox').nth(1).inputValue();
    return { scimUrl, scimToken };
  }
}
