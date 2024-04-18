import { test } from '@playwright/test';

test.describe('Enterprise SSO - Manage Connections', () => {
  test('Add SAML SSO', async ({ page }) => {
    await page.goto('/admin/sso-connection');
    // Find the new connection button and click on it
    await page.getByTestId('create-connection').click();
  });
});
