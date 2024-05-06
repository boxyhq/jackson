import { test as baseTest, expect } from '@playwright/test';
import { Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  portal: Portal;
};

export const test = baseTest.extend<MyFixtures>({
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await use(portal);
  },
  ssoPage: async ({ page, portal }, use) => {
    const ssoPage = new SSOPage(page);
    await ssoPage.goto();
    await use(ssoPage);
    await portal.doCredentialsLogin();
    await portal.isLoggedIn();
    await ssoPage.deleteAllSSOConnections();
  },
});

test('OAuth2 wrapper + SAML provider + wrong redirectUrl', async ({ ssoPage, page, baseURL }, testInfo) => {
  const ssoName = `saml-${testInfo.workerIndex}`;
  await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`${ssoName}-1`)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: `${ssoName}-1`,
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
  const ssoName = `saml-${testInfo.workerIndex}`;
  await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`${ssoName}-1`)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: `${ssoName}-1`,
    url: baseURL!,
    newStatus: false,
  });
  // Confirm connection label inactive is displayed
  await expect(
    page.getByText(`${ssoName}-1`).locator('xpath=..').getByRole('cell', { name: 'Inactive', exact: true })
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
  const ssoName = `oidc-${testInfo.workerIndex}`;
  await ssoPage.addSSOConnection({ name: ssoName, type: 'oidc', baseURL: baseURL! });
  // check if the oidc connection appears in the connection list
  await expect(page.getByText(`${ssoName}-1`)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: `${ssoName}-1`,
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
  const ssoName = `oidc-${testInfo.workerIndex}`;
  await ssoPage.addSSOConnection({ name: ssoName, type: 'oidc', baseURL: baseURL! });
  // check if the oidc connection appears in the connection list
  await expect(page.getByText(`${ssoName}-1`)).toBeVisible();
  await ssoPage.updateSSOConnection({
    name: `${ssoName}-1`,
    url: baseURL!,
    newStatus: false,
  });
  // Confirm connection label inactive is displayed
  await expect(
    page.getByText(`${ssoName}-1`).locator('xpath=..').getByRole('cell', { name: 'Inactive', exact: true })
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
