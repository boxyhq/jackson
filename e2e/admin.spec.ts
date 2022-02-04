import { test } from '@playwright/test';

test('MAGIC_LINK in globalSetup should log me in', async ({ page }) => {
  await page.goto('/admin/saml/config');
  // Find an element with the text 'About Page' and click on it
  await page.waitForSelector('text=SAML Configurations');
});
