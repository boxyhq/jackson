import type { Page, Locator } from '@playwright/test';
import { adminPortalSSODefaults } from '@lib/env';

const TEST_SAML_TENANT = adminPortalSSODefaults.tenant;
const TEST_SAML_PRODUCT = adminPortalSSODefaults.product;

const MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const MOCKSAML_SIGNIN_BUTTON_NAME = 'Sign In';

export class SAMLPage {
  private readonly createConnection: Locator;
  private readonly nameInput: Locator;
  private readonly tenantInput: Locator;
  private readonly productInput: Locator;
  private readonly redirectURLSInput: Locator;
  private readonly defaultRedirectURLInput: Locator;
  private readonly metadataUrlInput: Locator;
  private readonly saveConnection: Locator;
  private readonly deleteButton: Locator;
  private readonly confirmButton: Locator;

  constructor(public readonly page: Page) {
    this.createConnection = this.page.getByTestId('create-connection');
    this.nameInput = this.page.getByLabel('Connection name (Optional)');
    this.tenantInput = this.page.getByLabel('Tenant');
    this.productInput = this.page.getByLabel('Product');
    this.redirectURLSInput = page
      .getByRole('group')
      .filter({ hasText: 'Allowed redirect URLs' })
      .locator(page.getByRole('textbox').first());
    this.defaultRedirectURLInput = this.page.getByLabel('Default redirect URL');
    this.metadataUrlInput = this.page.getByLabel('Metadata URL');
    this.saveConnection = this.page.getByRole('button', { name: /save/i });
    this.deleteButton = this.page.getByRole('button', { name: 'Delete' });
    this.confirmButton = this.page.getByRole('button', { name: 'Confirm' });
  }

  async goto() {
    await this.page.goto('/admin/sso-connection');
  }

  async addSSOConnection(name: string, baseURL: string) {
    // Find the new connection button and click on it
    await this.createConnection.click();
    // Fill the name for the connection
    await this.nameInput.fill(name);
    // Fill the tenant for the connection
    await this.tenantInput.fill(TEST_SAML_TENANT);
    // Fill the product for the connection
    await this.productInput.fill(TEST_SAML_PRODUCT);
    // Fill the Allowed redirect URLs for the connection

    await this.redirectURLSInput.fill(baseURL!);
    // Fill the default redirect URLs for the connection
    await this.defaultRedirectURLInput.fill(`${baseURL}/admin/auth/idp-login`);
    // Enter the metadata url for mocksaml in the form
    console.log(`${MOCKSAML_ORIGIN}/api/namespace/${name}/saml/metadata`);
    await this.metadataUrlInput.fill(`${MOCKSAML_ORIGIN}/api/namespace/${name}/saml/metadata`);
    // submit the form
    await this.saveConnection.click();
  }

  async deleteSSOConnection(name: string) {
    await this.goto();
    const editButton = this.page.getByText(name, { exact: true }).locator('..').getByLabel('Edit');
    await editButton.click();
    // click the delete and confirm deletion
    await this.deleteButton.click();
    await this.confirmButton.click();
  }

  async logout() {
    const userAvatarLocator = this.page.getByTestId('user-avatar');
    // Logout from the magic link authentication
    await userAvatarLocator.click();
    await this.page.getByTestId('logout').click();
  }

  async signInWithMockSAML() {
    await this.page.getByTestId('sso-login-button').click();
    // Perform sign in at mocksaml
    await this.page.waitForURL((url) => url.origin === MOCKSAML_ORIGIN);
    await this.page.getByPlaceholder('jackson').fill('bob');
    await this.page.getByRole('button', { name: MOCKSAML_SIGNIN_BUTTON_NAME }).click();
  }
}
