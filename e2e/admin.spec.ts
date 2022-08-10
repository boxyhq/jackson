import { test } from '@playwright/test';

test('MAGIC_LINK in globalSetup should log me in', async ({ page }) => {
  await page.goto('/admin/saml/config');

  // Find the button and click on it
  await page.locator('data-test-id=create-connection').click();
});
