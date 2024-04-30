import { test as baseTest, expect } from '@playwright/test';
import { Portal, SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
  portal: Portal;
  ssoPageWithoutDelete: SSOPage;
};

export const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page, baseURL }, use, testInfo) => {
    const ssoPage = new SSOPage(page);
    const ssoName = `saml-${testInfo.workerIndex}`;
    await ssoPage.goto();
    await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
    await use(ssoPage);
    await ssoPage.deleteAllSSOConnections();
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await use(portal);
  },
  ssoPageWithoutDelete: async ({ page, baseURL }, use, testInfo) => {
    const ssoPage = new SSOPage(page);
    const ssoName = `saml-${testInfo.workerIndex}`;
    await ssoPage.goto();
    await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
    await use(ssoPage);
  },
});

test('OAuth2 wrapper + SAML provider', async ({ ssoPage, portal, page, baseURL }, testInfo) => {
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`saml-${testInfo.workerIndex}-1`)).toBeVisible();
  // Logout of magic link login
  await ssoPage.logout();
  await ssoPage.signInWithSSO();
  // Login using MockSAML
  await ssoPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  // Assert logged in state
  await portal.isLoggedIn();
});

test('OAuth2 wrapper + SAML provider + wrong redirectUrl', async ({
  ssoPageWithoutDelete,
  page,
  baseURL,
}, testInfo) => {
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`saml-${testInfo.workerIndex}-1`)).toBeVisible();
  await ssoPageWithoutDelete.updateSSOConnection({
    name: `saml-${testInfo.workerIndex}-1`,
    url: 'https://invalid-url.com',
  });
  // Logout of magic link login
  await ssoPageWithoutDelete.logout();
  await ssoPageWithoutDelete.signInWithSSO();
  // // Login using MockSAML
  // await ssoPage.signInWithMockSAML();
  // Wait for browser to redirect to error page
  await page.waitForURL((url) => url.origin === baseURL && url.pathname === '/error');
  // Assert error text
  await expect(page.getByText(`SSO error: Redirect URL is not allowed.`)).toBeVisible();
});

test('OAuth2 wrapper + 2 SAML providers', async ({ ssoPage, portal, page, baseURL }, testInfo) => {
  const ssoName = `saml-${testInfo.workerIndex}`;
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`${ssoName}-1`)).toBeVisible();
  // Add second SAML connection
  await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
  // check if the second added connection appears in the connection list
  await expect(page.getByText(`${ssoName}-2`)).toBeVisible();
  // Logout of magic link login
  await ssoPage.logout();
  // Login using MockSAML
  await ssoPage.signInWithSSO();
  // Select IdP from selection screen
  await ssoPage.selectIdP(`${ssoName}-2`);
  await ssoPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  // Assert logged in state
  await portal.isLoggedIn();
});
