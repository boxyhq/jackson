import { test as baseTest, expect } from '@playwright/test';
import { Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  portal: Portal;
};

export const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page, baseURL }, use, testInfo) => {
    const ssoPage = new SSOPage(page);
    const ssoName = `saml-${testInfo.workerIndex}`;
    await ssoPage.goto();
    await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
    await use(ssoPage);
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await use(portal);
  },
});

test('OAuth2 wrapper + SAML provider + wrong redirectUrl', async ({ ssoPage, page, baseURL }, testInfo) => {
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`saml-${testInfo.workerIndex}-1`)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: `saml-${testInfo.workerIndex}-1`,
    url: 'https://invalid-url.com',
  });
  // Logout of magic link login
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(page.getByText(`SSO error: Redirect URL is not allowed.`)).toBeVisible();
});

test('OAuth2 wrapper + SAML provider + inactive connection', async ({ ssoPage, page, baseURL }, testInfo) => {
  // check if the first added connection appears in the connection list
  const ssoName = `saml-${testInfo.workerIndex}-1`;
  await expect(page.getByText(ssoName)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: ssoName,
    url: baseURL!,
    newStatus: false,
  });
  // Confirm connection label inactive is displayed
  await expect(
    page.getByText(ssoName).locator('xpath=..').getByRole('cell', { name: 'Inactive', exact: true })
  ).toBeVisible();
  // Logout and try to sign in with connection
  // Logout of magic link login
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(
    page.getByText('SSO error: SSO connection is deactivated. Please contact your administrator.')
  ).toBeVisible();
});

test('OAuth2 wrapper + OIDC provider + wrong redirectUrl', async ({ ssoPage, page, baseURL }, testInfo) => {
  await ssoPage.deleteAllSSOConnections(); // should delete the saml connection from the fixture
  const ssoName = `oidc-${testInfo.workerIndex}`;
  await ssoPage.addSSOConnection({ name: ssoName, type: 'oidc', baseURL: baseURL! });
  // check if the oidc connection appears in the connection list
  await expect(page.getByText(ssoName)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: ssoName,
    url: 'https://invalid-url.com',
  });
  // Logout of magic link login
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(page.getByText('SSO error: Redirect URL is not allowed.')).toBeVisible();
});

test('OAuth2 wrapper + OIDC provider + inactive connection', async ({ ssoPage, page, baseURL }, testInfo) => {
  await ssoPage.deleteAllSSOConnections(); // should delete the sso connections from the fixture and prev test
  const ssoName = `oidc-${testInfo.workerIndex}`;
  await ssoPage.addSSOConnection({ name: ssoName, type: 'oidc', baseURL: baseURL! });
  // check if the oidc connection appears in the connection list
  await expect(page.getByText(ssoName)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: ssoName,
    url: baseURL!,
    newStatus: false,
  });
  // Confirm connection label inactive is displayed
  await expect(
    page.getByText(ssoName).locator('xpath=..').getByRole('cell', { name: 'Inactive', exact: true })
  ).toBeVisible();
  // Logout and try to sign in with connection
  // Logout of magic link login
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(
    page.getByText('SSO error: SSO connection is deactivated. Please contact your administrator.')
  ).toBeVisible();
});

// below is a hack, TODO: use proper cleanup mechanism afterAll hook to remove the SSO from the last test in this file
test('cleanup', async ({ ssoPage }) => {
  await ssoPage.deleteAllSSOConnections();
});

// test.afterAll(())
