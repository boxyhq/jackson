import { test } from '@playwright/test';

test('MAGIC_LINK in globalSetup should log me in', async ({ page }) => {
  await page.goto('/admin/saml/config');

  // Find an element with the text 'SAML Connections' and click on it
  await page.locator('data-test-id=create-saml-connections').click();
});
