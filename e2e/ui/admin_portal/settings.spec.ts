import { expect, test } from '@playwright/test';

test('Add SSO connection to mocksaml.com for admin portal login', async ({ page }) => {
  await page.goto('/admin/settings');
  // Find the add connection button and click on it
  await page.getByTestId('create-connection').click();
  // Enter the metadata url for mocksaml.com
  const metadataUrlInput = await page.locator('#metadataUrl');
  await metadataUrlInput.scrollIntoViewIfNeeded();
  await metadataUrlInput.fill('https://mocksaml.com/api/saml/metadata');
  // Add the connection, also handle asynchronous navigation
  const navigationPromise = page.waitForNavigation();
  await page.getByTestId('submit-form-create-sso').click();
  await navigationPromise;
  // Check if new entry appears in connection list page
  await expect(page.getByText('saml.example.com')).toBeVisible();
});

test('Login via SSO connection to mocksaml.com added previously', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('user-avatar').click();
  // Logout to test login using the above connection
  await page.getByTestId('logout').click();
  await page.getByTestId('sso-login-button').click();
  await page.waitForURL('https://mocksaml.com');
});
