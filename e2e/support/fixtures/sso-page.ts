import type { Page, Locator } from '@playwright/test';
import { adminPortalSSODefaults } from '@lib/env';

const ADMIN_PORTAL_TENANT = adminPortalSSODefaults.tenant;
const ADMIN_PORTAL_PRODUCT = adminPortalSSODefaults.product;

const MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const MOCKSAML_SIGNIN_BUTTON_NAME = 'Sign In';

const MOCKLAB_ORIGIN = 'https://oauth.wiremockapi.cloud';
const MOCKLAB_CLIENT_ID = 'mocklab_oauth2';
const MOCKLAB_CLIENT_SECRET = 'mocklab_secret';
const MOCKLAB_SIGNIN_BUTTON_NAME = 'Login';
const MOCKLAB_DISCOVERY_ENDPOINT = 'https://oauth.wiremockapi.cloud/.well-known/openid-configuration';

function rawMetadataString(ssoName) {
  return `<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://saml.example.com/entityid/${ssoName}" validUntil="2034-05-10T06:08:53.075Z">
<script/>
<md:IDPSSODescriptor WantAuthnRequestsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
<md:KeyDescriptor use="signing">
<ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
<ds:X509Data>
<ds:X509Certificate>MIIC4jCCAcoCCQC33wnybT5QZDANBgkqhkiG9w0BAQsFADAyMQswCQYDVQQGEwJV SzEPMA0GA1UECgwGQm94eUhRMRIwEAYDVQQDDAlNb2NrIFNBTUwwIBcNMjIwMjI4 MjE0NjM4WhgPMzAyMTA3MDEyMTQ2MzhaMDIxCzAJBgNVBAYTAlVLMQ8wDQYDVQQK DAZCb3h5SFExEjAQBgNVBAMMCU1vY2sgU0FNTDCCASIwDQYJKoZIhvcNAQEBBQAD ggEPADCCAQoCggEBALGfYettMsct1T6tVUwTudNJH5Pnb9GGnkXi9Zw/e6x45DD0 RuRONbFlJ2T4RjAE/uG+AjXxXQ8o2SZfb9+GgmCHuTJFNgHoZ1nFVXCmb/Hg8Hpd 4vOAGXndixaReOiq3EH5XvpMjMkJ3+8+9VYMzMZOjkgQtAqO36eAFFfNKX7dTj3V pwLkvz6/KFCq8OAwY+AUi4eZm5J57D31GzjHwfjH9WTeX0MyndmnNB1qV75qQR3b 2/W5sGHRv+9AarggJkF+ptUkXoLtVA51wcfYm6hILptpde5FQC8RWY1YrswBWAEZ NfyrR4JeSweElNHg4NVOs4TwGjOPwWGqzTfgTlECAwEAATANBgkqhkiG9w0BAQsF AAOCAQEAAYRlYflSXAWoZpFfwNiCQVE5d9zZ0DPzNdWhAybXcTyMf0z5mDf6FWBW 5Gyoi9u3EMEDnzLcJNkwJAAc39Apa4I2/tml+Jy29dk8bTyX6m93ngmCgdLh5Za4 khuU3AM3L63g7VexCuO7kwkjh/+LqdcIXsVGO6XDfu2QOs1Xpe9zIzLpwm/RNYeX UjbSj5ce/jekpAw7qyVVL4xOyh8AtUW1ek3wIw1MJvEgEPt0d16oshWJpoS1OT8L r/22SvYEo3EmSGdTVGgk3x3s+A0qWAqTcyjr7Q4s/GKYRFfomGwz0TZ4Iw1ZN99M m0eo2USlSRTVl7QHRTuiuSThHpLKQQ==</ds:X509Certificate>
</ds:X509Data>
</ds:KeyInfo>
</md:KeyDescriptor>
<md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
<md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${MOCKSAML_ORIGIN}/api/namespace/${ssoName}/saml/sso"/>
<md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${MOCKSAML_ORIGIN}/api/namespace/${ssoName}/saml/sso"/>
</md:IDPSSODescriptor>
</md:EntityDescriptor>`;
}

export class SSOPage {
  private readonly createConnection: Locator;
  private readonly nameInput: Locator;
  private readonly tenantInput: Locator;
  private readonly productInput: Locator;
  private readonly redirectURLSInput: Locator;
  private readonly defaultRedirectURLInput: Locator;
  private readonly metadataUrlInput: Locator;
  private readonly rawMetadataInput: Locator;
  private readonly oidcDiscoveryUrlInput: Locator;
  private readonly oidcClientIdInput: Locator;
  private readonly oidcClientSecretInput: Locator;
  private readonly saveConnection: Locator;
  private readonly deleteButton: Locator;
  private readonly confirmButton: Locator;
  private readonly toggleConnectionStatusCheckbox: Locator;
  private readonly toggleConnectionStatusLabel: Locator;
  private connections: string[];

  constructor(public readonly page: Page) {
    this.connections = [];
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
    this.rawMetadataInput = this.page.getByLabel('Raw IdP XML');
    this.oidcDiscoveryUrlInput = this.page.getByLabel('Well-known URL of OpenID Provider');
    this.oidcClientIdInput = this.page.getByLabel('Client ID');
    this.oidcClientSecretInput = this.page.getByLabel('Client Secret');
    this.saveConnection = this.page.getByRole('button', { name: /save/i });
    this.toggleConnectionStatusCheckbox = this.page.getByRole('checkbox', { name: 'Active' });
    this.toggleConnectionStatusLabel = this.page.locator('label').filter({ hasText: 'Active' });
    this.deleteButton = this.page.getByRole('button', { name: 'Delete' });
    this.confirmButton = this.page.getByRole('button', { name: 'Confirm' });
  }

  async goto() {
    const url = new URL(this.page.url());
    if (url.pathname !== '/admin/sso-connection') {
      await this.page.goto('/admin/sso-connection');
    }
  }

  async addSSOConnection({
    name,
    type = 'saml',
    baseURL,
    tenant,
    product,
    useRawMetadata,
  }: {
    name: string;
    type: 'saml' | 'oidc';
    baseURL: string;
    tenant?: string;
    product?: string;
    useRawMetadata?: boolean;
  }) {
    const connectionIndex = this.connections.length + 1;
    const ssoName = `${name}-${connectionIndex}`;
    // Find the new connection button and click on it
    await this.createConnection.click();
    if (type === 'oidc') {
      // Toggle connection type to OIDC
      await this.page.getByLabel('OIDC').check();
    }
    // Fill the name for the connection
    await this.nameInput.fill(ssoName);
    // Fill the tenant for the connection
    await this.tenantInput.fill(tenant || ADMIN_PORTAL_TENANT);
    // Fill the product for the connection
    await this.productInput.fill(product || ADMIN_PORTAL_PRODUCT);
    // Fill the Allowed redirect URLs for the connection

    await this.redirectURLSInput.fill(baseURL!);
    // Fill the default redirect URLs for the connection
    await this.defaultRedirectURLInput.fill(`${baseURL}/admin/auth/idp-login`);
    if (type === 'saml') {
      if (useRawMetadata) {
        await this.rawMetadataInput.fill(rawMetadataString(ssoName));
      } else {
        // Enter the metadata url for mocksaml in the form
        await this.metadataUrlInput.fill(`${MOCKSAML_ORIGIN}/api/namespace/${ssoName}/saml/metadata`);
      }
    }
    if (type === 'oidc') {
      // Enter the OIDC client credentials for mocklab in the form
      await this.oidcClientIdInput.fill(`${MOCKLAB_CLIENT_ID}-${connectionIndex}`);
      await this.oidcClientSecretInput.fill(`${MOCKLAB_CLIENT_SECRET}-${connectionIndex}`);
      // Enter the OIDC discovery url for mocklab in the form
      await this.oidcDiscoveryUrlInput.fill(MOCKLAB_DISCOVERY_ENDPOINT);
    }
    // submit the form
    await this.saveConnection.click();
    this.connections = [...this.connections, ssoName];
  }

  async gotoEditView(name: string) {
    await this.goto();
    const editButton = this.page.getByText(name).locator('xpath=..').getByLabel('Edit');
    await editButton.click();
  }

  async toggleConnectionStatus(newStatus: boolean) {
    const isChecked = await this.toggleConnectionStatusCheckbox.isChecked();
    if (isChecked && !newStatus) {
      await this.toggleConnectionStatusLabel.click();
      await this.confirmButton.click();
    } else if (!isChecked && newStatus) {
      await this.toggleConnectionStatusLabel.click();
      await this.confirmButton.click();
    }
  }

  async updateSSOConnection({ name, url, newStatus }: { name: string; url: string; newStatus?: boolean }) {
    await this.gotoEditView(name);
    await this.redirectURLSInput.fill(url);
    await this.saveConnection.click();
    if (typeof newStatus === 'boolean') {
      await this.gotoEditView(name);
      await this.toggleConnectionStatus(newStatus);
    }
  }

  async deleteSSOConnection(name: string) {
    await this.gotoEditView(name);
    // click the delete and confirm deletion
    await this.deleteButton.click();
    await this.confirmButton.click();
  }

  async deleteAllSSOConnections() {
    let _connection;
    while ((_connection = this.connections.shift())) {
      await this.deleteSSOConnection(_connection);
    }
  }

  async logout() {
    const userAvatarLocator = this.page.getByTestId('user-avatar');
    // Logout from the magic link authentication
    await userAvatarLocator.click();
    await this.page.getByTestId('logout').click();
  }

  async signInWithSSO() {
    await this.page.getByTestId('sso-login-button').click();
  }

  async selectIdP(name: string) {
    const idpSelectionTitle = 'Select an Identity Provider to continue';
    await this.page.getByText(idpSelectionTitle).waitFor();
    await this.page.getByRole('button', { name }).click();
  }

  async signInWithMockSAML() {
    // Perform sign in at mocksaml
    await this.page.waitForURL((url) => url.origin === MOCKSAML_ORIGIN);
    await this.page.getByPlaceholder('jackson').fill('bob');
    await this.page.getByRole('button', { name: MOCKSAML_SIGNIN_BUTTON_NAME }).click();
  }

  async signInWithMockLab() {
    // Perform sign in at mocklab
    await this.page.waitForURL((url) => url.origin === MOCKLAB_ORIGIN);
    await this.page.getByPlaceholder('yours@example.com').fill('bob@oidc.com');
    await this.page.getByRole('button', { name: MOCKLAB_SIGNIN_BUTTON_NAME }).click();
  }
}
