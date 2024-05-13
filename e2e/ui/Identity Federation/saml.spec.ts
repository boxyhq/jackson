import { test as baseTest, expect } from '@playwright/test';
import { Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  portal: Portal;
};

const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page }, use) => {
    const ssoPage = new SSOPage(page);
    await use(ssoPage);
    // Delete SSO Connections mapped to SAML federation
    await ssoPage.deleteSSOConnection('SSO-via-SAML-Fed');
    await ssoPage.deleteAllSSOConnections();
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    // Create SAML Federated connection
    await page.goto('/admin/settings');
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await page.getByRole('button', { name: 'New App' }).click();
    await page.waitForURL(/.*admin\/identity-federation\/new$/);
    await page.getByPlaceholder('Your app').and(page.getByLabel('Name')).fill('SF-1');
    await page.getByPlaceholder('example.com').and(page.getByLabel('Tenant')).fill('acme.com');
    await page.getByLabel('Product').fill('_jackson_admin_portal');
    await page.getByLabel('ACS URL').fill('http://localhost:5225/api/oauth/saml');
    await page.getByLabel('Entity ID / Audience URI / Audience Restriction').fill('https://saml.boxyhq.com');
    await page.getByRole('button', { name: 'Create App' }).click();
    await page.waitForURL(/.*admin\/identity-federation\/.*\/edit$/);
    await page.getByRole('link', { name: 'Back' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await expect(page.getByRole('cell', { name: 'SF-1' })).toBeVisible();
    // Add SAML connection via SAML Fed for Admin portal
    await page.getByRole('link', { name: 'Single Sign-On' }).click();
    await page.getByTestId('create-connection').click();
    await page.getByLabel('Connection name (Optional)').fill('SSO-via-SAML-Fed');
    await page
      .getByPlaceholder('Paste the Metadata URL here')
      .fill('http://localhost:5225/.well-known/idp-metadata');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('cell', { name: 'SSO-via-SAML-Fed' })).toBeVisible();
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

test('SAML Federated app + 1 SAML & 1 OIDC providers', async ({ ssoPage, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'SF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  await ssoPage.addSSOConnection({
    name: 'SF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  // Login using MockSAML
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-SAML-1');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
  // Login using MockLab
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-OIDC-2');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
});

test('SAML Federated app + 2 SAML providers', async ({ ssoPage, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'SF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  await ssoPage.addSSOConnection({
    name: 'SF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });

  // Login using MockSAML-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-SAML-1');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
  // Login using MockSAML-2
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-SAML-2');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
});

test('SAML Federated app + 2 OIDC providers', async ({ ssoPage, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'SF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  await ssoPage.addSSOConnection({
    name: 'SF-OIDC',
    type: 'oidc',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });

  // Login using MockLab-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-OIDC-1');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
  // Login using MockLab-2
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-OIDC-2');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
});

test('SAML Federated app + 1 SAML provider', async ({ ssoPage, page, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'SF-SAML',
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

test('SAML Federated app + 1 OIDC provider', async ({ ssoPage, page, portal, baseURL }) => {
  // Add SSO connection for tenants
  await ssoPage.addSSOConnection({
    name: 'SF-OIDC',
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
