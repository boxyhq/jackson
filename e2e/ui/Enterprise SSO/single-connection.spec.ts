import { test as baseTest } from '@playwright/test';
import { SAMLPage } from 'e2e/support/fixtures/saml-page';
import { getSession } from 'next-auth/react';

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
    await samlPage.deleteSSOConnection(ssoName);
  },
});

test.only('OAuth2 wrapper + SAML provider', async ({ samlPage, page, baseURL }) => {
  await samlPage.logout();
  // Login using MockSAML
  await samlPage.signInWithMockSAML();
  // Wait for browser to redirect back to admin portal
  await page.waitForURL((url) => url.origin === baseURL);
  const session = await getSession();
  console.log(session?.user?.email);
});
