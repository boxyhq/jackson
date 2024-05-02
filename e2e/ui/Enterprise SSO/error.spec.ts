import { test as baseTest, expect } from '@playwright/test';
import { SSOPage } from 'e2e/support/fixtures';

type MyFixtures = {
  ssoPage: SSOPage;
};

export const test = baseTest.extend<MyFixtures>({
  ssoPage: async ({ page, baseURL }, use, testInfo) => {
    const ssoPage = new SSOPage(page);
    const ssoName = `saml-${testInfo.workerIndex}`;
    await ssoPage.goto();
    await ssoPage.addSSOConnection({ name: ssoName, type: 'saml', baseURL: baseURL! });
    await use(ssoPage);
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
