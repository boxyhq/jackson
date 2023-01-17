import { test } from '@playwright/test';

test('MAGIC_LINK in globalSetup should log me in', async ({ page }) => {
  await page.goto('/admin/sso-connection');

  // Find the button and click on it
  await page.getByTestId('create-connection').click();
});
