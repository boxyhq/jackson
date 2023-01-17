import { expect, test } from '@playwright/test';

test.only('Add SSO connection to mocksaml.com for admin portal login', async ({ page }) => {
  await page.goto('/admin/settings');

  // Find the add connection button and click on it
  await page.getByTestId('create-connection').click();
  // Enter the metadata url for mocksaml.com
  const metadataUrlInput = await page.locator('#metadataUrl');
  await metadataUrlInput.scrollIntoViewIfNeeded();
  await metadataUrlInput.fill('https://mocksaml.com/api/saml/metadata');
  // Add the connection
  await page.getByTestId('submit-form-create-sso').click();
  // Check if new entry appears in connection list page
  await page.waitForURL('/admin/settings');
  await expect(page.getByText('saml.example.com')).toBeVisible();
  // Logout to test login using the above connection
  await page.getByTestId('logout');
});

test.only('Login via SSO connection to mocksaml.com added previously', async ({ page }) => {
  await page.getByTestId('sso-login-button').click();
  await page.waitForURL('https://mocksaml.com');
});
