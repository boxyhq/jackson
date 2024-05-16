import type { Page } from '@playwright/test';
import type { DirectorySyncProviders } from '../data/dsync';

export class DSyncPage {
  tenant: string;
  product: string;
  constructor(public readonly page: Page) {
    this.tenant = 'acme.com';
    this.product = 'demo';
  }

  async gotoDSync() {
    await this.page.goto(`/admin/directory-sync`);
  }

  async addDSyncConnection(provider: keyof typeof DirectorySyncProviders) {
    await this.gotoDSync();
    await this.page.getByRole('link', { name: 'New Directory' }).click();
    await this.page.getByLabel('Directory name').fill('DS-1');
    await this.page.getByLabel('Directory provider').selectOption({ value: provider });
    await this.page.getByLabel('Tenant').fill(this.tenant);
    await this.page.getByLabel('Product').fill(this.product);
    await this.page.getByLabel('Webhook URL').fill('https://example.com');
    await this.page.getByLabel('Webhook secret').fill('secret');
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

  async switchToUsersView() {
    await this.gotoDSync();
    await this.page.getByLabel('View').click();
    await this.page.getByText('Users').click();
    await this.page.waitForURL('**/admin/directory-sync/**/users');
    await this.page.getByText('Loading...').waitFor();
    await this.page.getByRole('table').waitFor();
  }
  async switchToGroupsView() {
    await this.gotoDSync();
    await this.page.getByLabel('View').click();
    await this.page.getByText('Groups').click();
    await this.page.waitForURL('**/admin/directory-sync/**/groups');
    await this.page.getByText('Loading...').waitFor();
    await this.page.getByRole('table').waitFor();
  }
  async enableWebHookEventLogging() {
    await this.gotoDSync();
    await this.page.getByLabel('Edit').click();
    await this.page.getByLabel('Enable Webhook events logging').check();
    await this.page.getByRole('button', { name: 'Save' }).click();
  }
}
