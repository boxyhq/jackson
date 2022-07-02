import { test, expect } from '@playwright/test';

test('', async ({ page }) => {
  await page.goto('/.well-known/openid-configuration');
  // Snapshot testing
  await expect(page).toHaveScreenshot('oidc-discovery.png');
});
