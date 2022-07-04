import { test, expect } from '@playwright/test';

test('', async ({ page }) => {
  await page.goto('/oauth/jwks');
  // Snapshot testing
  await expect(page).toHaveScreenshot('jwks.png');
});
