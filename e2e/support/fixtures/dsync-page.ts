import type { Page } from '@playwright/test';

enum DirectorySyncProviders {
  'azure-scim-v2' = 'Azure SCIM v2.0',
  'onelogin-scim-v2' = 'OneLogin SCIM v2.0',
  'okta-scim-v2' = 'Okta SCIM v2.0',
  'jumpcloud-scim-v2' = 'JumpCloud v2.0',
  'generic-scim-v2' = 'Generic SCIM v2.0',
  'google' = 'Google',
}
export class DSyncPage {
  constructor(public readonly page: Page) {}

  async gotoDSync() {
    await this.page.goto(`/admin/directory-sync`);
  }

  async addDSyncConnection(provider: keyof typeof DirectorySyncProviders) {
    await this.gotoDSync();
    await this.page.getByRole('link', { name: 'New Directory' }).click();
    await this.page.getByLabel('Directory name').fill('DS-1');
    await this.page.getByLabel('Directory provider').selectOption({ value: provider });
    await this.page.getByLabel('Tenant').fill('acme.com');
    await this.page.getByLabel('Product').fill('demo');
    await this.page.getByRole('button', { name: 'Create Directory' }).click();
    const scimUrl = await this.page.getByLabel('SCIM Endpoint').inputValue();
    const scimToken = await this.page.getByLabel('SCIM Token').inputValue();
    return { scimUrl, scimToken };
  }

  async deleteConnection() {
    await this.gotoDSync();
    await this.page.getByLabel('Loading').waitFor({ state: 'hidden' });
    const editButton = await this.page.getByRole('button').and(this.page.getByLabel('Edit'));
    await editButton.click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
    await this.page.getByRole('button', { name: 'Confirm' }).click();
  }
}
