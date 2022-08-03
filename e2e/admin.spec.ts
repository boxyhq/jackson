import { test } from '@playwright/test';

test('MAGIC_LINK in globalSetup should log me in', async ({ page }) => {
  await page.goto('/admin/saml/config');
  await page.waitForNavigation();
  await page.waitForSelector('text=/SAML Connections/');
  // Find an element with the text 'SAML Connections' and click on it
  //await page.waitForSelector('text=SAML Connections');
});
