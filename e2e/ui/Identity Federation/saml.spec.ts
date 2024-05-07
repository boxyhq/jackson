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
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await use(portal);
  },
});

test.only('Create SAML Federated app', async ({ ssoPage, portal, page }) => {
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
  await page.getByRole('cell', { name: 'SF-1' }).waitFor();

  // Add SAML connection for Admin portal
  await page.getByRole('link', { name: 'Single Sign-On' }).click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('Connection name (Optional)').fill('SSO-via-SAML-Fed');
  await page
    .getByPlaceholder('Paste the Metadata URL here')
    .fill('http://localhost:5225/.well-known/idp-metadata');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: 'SSO-via-SAML-Fed' })).toBeVisible();

  // Add SSO connection for tenants
  await page.getByRole('link', { name: 'Connections' }).first().click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('Connection name (Optional)').fill('SF-SAML-1');
  await page.getByLabel('Tenant').fill('acme.com');
  await page.getByLabel('Product').fill('_jackson_admin_portal');
  await page.locator('input[name="item"]').fill('http://localhost:3366');
  await page.getByLabel('Default redirect URL').fill('http://localhost:3366/login/saml');
  await page.getByPlaceholder('Paste the Metadata URL here').fill('https://mocksaml.com/api/saml/metadata');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('OIDC').check();
  await page.getByLabel('Connection name (Optional)').fill('SF-OIDC-1');
  await page.getByLabel('Tenant').fill('acme.com');
  await page.getByLabel('Product').fill('_jackson_admin_portal');
  await page.locator('input[name="item"]').fill('http://localhost:3366');
  await page.getByLabel('Default redirect URL').fill('http://localhost:3366/login/saml');
  await page.getByLabel('Client ID').fill('some_client_id');
  await page.getByLabel('Client Secret').fill('some_client_secret');
  await page
    .getByLabel('Well-known URL of OpenID Provider')
    .fill('https://oauth.wiremockapi.cloud/.well-known/openid-configuration');
  await page.getByRole('button', { name: 'Save' }).click();
  // Login using MockSAML
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-SAML-1');
  await ssoPage.signInWithMockSAML();
  await portal.isLoggedIn();
  // Login using MockLab
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  await ssoPage.selectIdP('SF-OIDC-1');
  await ssoPage.signInWithMockLab();
  await portal.isLoggedIn();
});
