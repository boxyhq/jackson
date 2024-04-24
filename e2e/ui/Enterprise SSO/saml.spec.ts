import { test as baseTest, expect } from '@playwright/test';
import { SAMLPage } from 'e2e/support/fixtures/saml-page';

type MyFixtures = {
  samlPage: SAMLPage;
};
export const test = baseTest.extend<MyFixtures>({
  samlPage: async ({ page, baseURL }, use, testInfo) => {
    const samlPage = new SAMLPage(page);
    const ssoName = `single-connection-saml-${testInfo.workerIndex}`;
    await samlPage.goto();
    await samlPage.addSSOConnection(ssoName, baseURL!);
    await use(samlPage);
    await samlPage.deleteAllSSOConnections();
  },
});

test('OAuth2 wrapper + SAML provider', async ({ samlPage, page, baseURL }, testInfo) => {
  // check if the added connection appears in the connection list
  await expect(page.getByText(`single-connection-saml-${testInfo.workerIndex}`)).toBeVisible();
  // Logout of magic link login
  await samlPage.logout();
  await samlPage.signInWithSSO();
  // Login using MockSAML
  await samlPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
});

test('OAuth2 wrapper + 2 SAML providers', async ({ samlPage, page, baseURL }, testInfo) => {
  // check if the added connection appears in the connection list
  await expect(page.getByText(`single-connection-saml-${testInfo.workerIndex}`)).toBeVisible();
  // Add second SAML connection
  const ssoName = `single-connection-saml-${testInfo.workerIndex}-2`;
  await samlPage.addSSOConnection(ssoName, baseURL!);
  // check if the added connection appears in the connection list
  await expect(page.getByText(ssoName)).toBeVisible();
  // Logout of magic link login
  await samlPage.logout();
  // Login using MockSAML
  await samlPage.signInWithSSO();
  // Select IdP from selection screen
  await samlPage.selectIdP(ssoName);
  await samlPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
});
