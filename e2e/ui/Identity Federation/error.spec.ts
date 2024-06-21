import { test as baseTest, expect, request } from '@playwright/test';
import { ADMIN_PORTAL_PRODUCT, Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  samlFedPage: Portal;
  oidcFedPage: Portal;
};

let oidcClientId;
let oidcClientSecret;

const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page }, use) => {
    const ssoPage = new SSOPage(page);
    await use(ssoPage);
    // Delete SSO Connections mapped to SAML federation
    await ssoPage.deleteAllSSOConnections();
  },
  samlFedPage: async ({ page }, use) => {
    const portal = new Portal(page);
    // Create SAML Federated connection
    await page.goto('/');
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await page.getByRole('button', { name: 'New App' }).click();
    await page.waitForURL(/.*admin\/identity-federation\/new$/);
    await page.getByPlaceholder('Your app').and(page.getByLabel('Name')).fill('SF-1');
    await page.getByPlaceholder('example.com').and(page.getByLabel('Tenant')).fill('acme.com');
    await page.getByLabel('Product').fill('_jackson_admin_portal');
    await page.getByLabel('ACS URL').fill('https://invalid-url.com');
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
    await page.goto('/');
    await page.getByRole('link', { name: 'Apps' }).click();
    await page.waitForURL(/.*admin\/identity-federation$/);
    await page.getByRole('cell', { name: 'Edit' }).getByRole('button').click();
    await page.getByLabel('Card').getByRole('button', { name: 'Delete' }).click();
    await page.getByTestId('confirm-delete').click();
  },
  oidcFedPage: async ({ page }, use) => {
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
    await page.locator('input[name="item"]').fill('https://invalid-url.com');
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

test.afterAll(async () => {
  const apiContext = await request.newContext();
  await apiContext.delete(`/api/v1/sso-traces/product?product=${ADMIN_PORTAL_PRODUCT}`, {
    headers: { Authorization: 'Api-Key secret' },
  });
});

const errorMessages: string[] = [];

test('SAML Federated app + Wrong ACS url', async ({ ssoPage, samlFedPage, page, baseURL }) => {
  // Add SSO connection for tenants
  await page.getByRole('link', { name: 'Connections' }).first().click();
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
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(page.getByText("SSO error: Assertion Consumer Service URL doesn't match.")).toBeVisible();
  errorMessages.push("Assertion Consumer Service URL doesn't match.");
  await samlFedPage.doCredentialsLogin();
  await samlFedPage.isLoggedIn();

  await ssoPage.deleteSSOConnection('SSO-via-SAML-Fed');
});

test('OIDC Federated app + SSO Provider with wrong Redirect url', async ({
  ssoPage,
  oidcFedPage,
  page,
  baseURL,
}) => {
  // Add SSO connection for tenants
  await page.getByRole('link', { name: 'Connections' }).first().click();
  await ssoPage.addSSOConnection({
    name: 'OF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  // check if the SAML connection appears in the connection list
  await expect(page.getByText('OF-SAML')).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: 'OF-SAML',
    url: 'https://invalid-url.com',
  });
  // Login using MockSAML-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(page.getByText('SSO error: Redirect URL is not allowed.')).toBeVisible();
  errorMessages.push('Redirect URL is not allowed.');
  await oidcFedPage.doCredentialsLogin();
  await oidcFedPage.isLoggedIn();

  await ssoPage.deleteSSOConnection('SSO-via-OIDC-Fed');
});

test('OIDC Federated app + inactive SSO connection', async ({ ssoPage, oidcFedPage, page, baseURL }) => {
  // Add SSO connection for tenants
  await page.getByRole('link', { name: 'Connections' }).first().click();
  await ssoPage.addSSOConnection({
    name: 'OF-SAML',
    type: 'saml',
    baseURL: baseURL!,
    tenant: 'acme.com',
    product: '_jackson_admin_portal',
  });
  // check if the SAML connection appears in the connection list
  await expect(page.getByText('OF-SAML')).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: 'OF-SAML',
    url: baseURL!,
    newStatus: false,
  });
  // Login using MockSAML-1
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(
    page.getByText('SSO error: SSO connection is deactivated. Please contact your administrator.')
  ).toBeVisible();
  errorMessages.push('SSO connection is deactivated. Please contact your administrator.');
  await oidcFedPage.doCredentialsLogin();
  await oidcFedPage.isLoggedIn();

  await ssoPage.deleteSSOConnection('SSO-via-OIDC-Fed');
});

test('SSO Tracer inspect', async ({ page }) => {
  await page.goto('/');
  const responsePromise = page.waitForResponse('/api/admin/sso-traces?pageOffset=0&pageLimit=50');
  await page.getByRole('link', { name: 'SSO Traces' }).click();
  const response = await responsePromise;
  const traces = (await response.json()).data;
  for (let i = 0; i < errorMessages.length; i++) {
    await page.getByRole('cell').getByRole('button', { name: traces[i].traceId }).click();
    await expect(page.getByLabel('SP Protocol')).toContainText(/OIDC Federation|SAML Federation/);
    await expect(page.locator('dl')).toContainText(errorMessages[errorMessages.length - i - 1]);
    await page.getByRole('link', { name: 'Back' }).click();
  }
});
