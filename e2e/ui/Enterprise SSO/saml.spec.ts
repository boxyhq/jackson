import { test as baseTest, expect } from '@playwright/test';
import { Portal, SAMLPage } from 'e2e/support/fixtures';

type MyFixtures = {
  samlPage: SAMLPage;
  portal: Portal;
};

export const test = baseTest.extend<MyFixtures>({
  samlPage: async ({ page, baseURL }, use, testInfo) => {
    const samlPage = new SAMLPage(page);
    const ssoName = `saml-${testInfo.workerIndex}`;
    await samlPage.goto();
    await samlPage.addSSOConnection(ssoName, baseURL!);
    await use(samlPage);
    await samlPage.deleteAllSSOConnections();
  },
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await use(portal);
  },
});

test('OAuth2 wrapper + SAML provider', async ({ samlPage, portal, page, baseURL }, testInfo) => {
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`saml-${testInfo.workerIndex}-1`)).toBeVisible();
  // Logout of magic link login
  await samlPage.logout();
  await samlPage.signInWithSSO();
  // Login using MockSAML
  await samlPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  // Assert logged in state
  await portal.isLoggedIn();
});

test('OAuth2 wrapper + 2 SAML providers', async ({ samlPage, portal, page, baseURL }, testInfo) => {
  const ssoName = `saml-${testInfo.workerIndex}`;
  // check if the first added connection appears in the connection list
  await expect(page.getByText(`${ssoName}-1`)).toBeVisible();
  // Add second SAML connection
  await samlPage.addSSOConnection(ssoName, baseURL!);
  // check if the second added connection appears in the connection list
  await expect(page.getByText(`${ssoName}-2`)).toBeVisible();
  // Logout of magic link login
  await samlPage.logout();
  // Login using MockSAML
  await samlPage.signInWithSSO();
  // Select IdP from selection screen
  await samlPage.selectIdP(`${ssoName}-2`);
  await samlPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  // Assert logged in state
  await portal.isLoggedIn();
});
