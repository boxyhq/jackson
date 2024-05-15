import { test as baseTest, expect } from '@playwright/test';
import { Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  portal: Portal;
};

let oidcClientId;
let oidcClientSecret;

const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page }, use) => {
    const ssoPage = new SSOPage(page);
    await use(ssoPage);
    // Delete SSO Connections mapped to OIDC federation
    await ssoPage.deleteSSOConnection('SSO-via-OIDC-Fed');
    await ssoPage.deleteAllSSOConnections();
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    // Create OIDC Federated connection
    await page.goto('/admin/settings');
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await page.getByRole('button', { name: 'New App' }).click();
    await page.waitForURL(/.*admin\/identity-federation\/new$/);
    // Toggle connection type to OIDC
    await page.getByLabel('OIDC').check();
    await page.getByPlaceholder('Your app').and(page.getByLabel('Name')).fill('OF-1');
    await page.getByPlaceholder('example.com').and(page.getByLabel('Tenant')).fill('acme.com');
    await page.getByLabel('Product').fill('_jackson_admin_portal');
    await page.locator('input[name="item"]').fill('http://localhost:5225');
    await page.getByRole('button', { name: 'Create App' }).click();
    await page.waitForURL(/.*admin\/identity-federation\/.*\/edit$/);
    oidcClientId = await page
      .locator('label')
      .filter({ hasText: 'Client ID' })
      .getByRole('textbox')
      .inputValue();
    oidcClientSecret = await page
      .locator('label')
      .filter({ hasText: 'Client Secret' })
      .getByRole('textbox')
      .inputValue();
    await page.getByRole('link', { name: 'Back' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await expect(page.getByRole('cell', { name: 'OF-1' })).toBeVisible();

    // Add OIDC Connection via OIDC Fed for Admin portal
    await page.getByRole('link', { name: 'Single Sign-On' }).click();
    await page.getByTestId('create-connection').click();
    await page.getByLabel('OIDC').check();
    await page.getByLabel('Connection name (Optional)').fill('SSO-via-OIDC-Fed');
    await page.getByLabel('Client ID').fill(oidcClientId);
    await page.getByLabel('Client Secret').fill(oidcClientSecret);
    await page
      .getByLabel('Well-known URL of OpenID Provider')
      .fill('http://localhost:5225/.well-known/openid-configuration');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: 'SSO-via-OIDC-Fed' })).toBeVisible();
    await use(portal);
    // Delete Saml Fed connection
    await page.goto('/admin/settings');
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await page.getByRole('cell', { name: 'Edit' }).getByRole('button').click();
    await page.getByLabel('Card').getByRole('button', { name: 'Delete' }).click();
    await page.getByTestId('confirm-delete').click();
  },
});

test('OIDC Federated app + 1 SAML & 1 OIDC providers', async ({ ssoPage, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'OF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  await ssoPage.addSSOConnection({
    name: 'OF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  // Login using MockSAML
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-SAML-1');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
  // Login using MockLab
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-OIDC-2');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
});

test('OIDC Federated app + 2 SAML providers', async ({ ssoPage, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'OF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  await ssoPage.addSSOConnection({
    name: 'OF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });

  // Login using MockSAML-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-SAML-1');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
  // Login using MockSAML-2
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-SAML-2');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
});

test('OIDC Federated app + 2 OIDC providers', async ({ ssoPage, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'OF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  await ssoPage.addSSOConnection({
    name: 'OF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });

  // Login using MockLab-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-OIDC-1');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
  // Login using MockLab-2
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('OF-OIDC-2');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
});

test('OIDC Federated app + 1 SAML provider', async ({ ssoPage, page, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'OF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  // Login using MockSAML-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  await portal.isLoggedIn();
});

test('OIDC Federated app + 1 OIDC provider', async ({ ssoPage, page, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'OF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  // Login using MockLab-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.signInWithMockLab();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  await portal.isLoggedIn();
});
