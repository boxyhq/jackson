import { expect, test } from '@playwright/test';

test.describe('Admin Portal SSO', () => {
  test('should be able to add SSO connection to mocksaml.com', async ({ page }) => {
    await page.goto('/admin/settings');
    // Find the add connection button and click on it
    await page.getByTestId('create-connection').click();
    // Enter the metadata url for mocksaml.com
    const metadataUrlInput = page.locator('#metadataUrl');
    await metadataUrlInput.scrollIntoViewIfNeeded();
    await metadataUrlInput.fill('https://mocksaml.com/api/saml/metadata');
    await page.getByTestId('submit-form-create-sso').click();
    await expect(page.getByText('saml.example.com')).toBeVisible();
  });

  test('should be able to login via mocksaml.com SSO', async ({ page, baseURL }) => {
    const userAvatarLocator = page.getByTestId('user-avatar');

    await page.goto('/');
    await userAvatarLocator.click();
    // Logout to test login using the above connection
    await page.getByTestId('logout').click();
    await page.getByTestId('sso-login-button').click();
    await page.waitForURL((url) => url.origin === 'https://mocksaml.com');
    await page.getByPlaceholder('jackson').fill('bob');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => url.origin === baseURL);
    await expect(userAvatarLocator).toBeVisible();
  });
});
