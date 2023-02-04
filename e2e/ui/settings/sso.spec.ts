import { expect, test } from '@playwright/test';
import dns from 'dns';

// SAML SSO
const TEST_SAML_SSO_CONNECTION_NAME = 'pw_admin_portal_saml_sso';
const MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const MOCKSAML_METADATA_URL = `${MOCKSAML_ORIGIN}/api/saml/metadata`;
const MOCKSAML_SIGNIN_BUTTON_NAME = 'Sign In';
// OIDC SSO
const TEST_OIDC_SSO_CONNECTION_NAME = 'pw_admin_portal_oidc_sso';
const MOCKLAB_DISCOVERY_PATH = '/.well-known/mocklab-openid-configuration';
const MOCKLAB_ORIGIN = 'https://oauth.mocklab.io';
const MOCKLAB_CLIENT_ID = 'mocklab_oauth2';
const MOCKLAB_CLIENT_SECRET = 'mocklab_secret';
const MOCKLAB_SIGNIN_BUTTON_NAME = 'Login';

test.beforeAll(async () => {
  dns.setDefaultResultOrder('ipv4first');
});

test.describe('Admin Portal SSO - SAML', () => {
  test('should be able to add SSO connection to mocksaml', async ({ page }) => {
    await page.goto('/admin/settings');
    // Find the new connection button and click on it
    await page.getByTestId('create-connection').click();
    // Fill the name for the connection
    const nameInput = page.locator('#name');
    await nameInput.fill(TEST_SAML_SSO_CONNECTION_NAME);
    // Enter the metadata url for mocksaml in the form
    const metadataUrlInput = page.locator('#metadataUrl');
    await metadataUrlInput.fill(MOCKSAML_METADATA_URL);
    // submit the form
    await page.getByTestId('submit-form-create-sso').click();
    // check if the added connection appears in the connection list
    await expect(page.getByText(TEST_SAML_SSO_CONNECTION_NAME)).toBeVisible();
  });

  test('should be able to login with mocksaml via SP initiated SSO', async ({ page, baseURL }) => {
    const userAvatarLocator = page.getByTestId('user-avatar');
    // Logout from the magic link authentication
    await page.goto('/');
    await userAvatarLocator.click();
    await page.getByTestId('logout').click();
    // Click on login with sso button
    await page.getByTestId('sso-login-button').click();
    // Perform sign in at mocksaml
    await page.waitForURL((url) => url.origin === MOCKSAML_ORIGIN);
    await page.getByPlaceholder('jackson').fill('bob');
    await page.getByRole('button', { name: MOCKSAML_SIGNIN_BUTTON_NAME }).click();
    // Wait for browser to redirect back to admin portal
    await page.waitForURL((url) => url.origin === baseURL);
    // assert login state
    await expect(userAvatarLocator).toBeVisible();
  });

  test('should be able to login with mocksaml via IdP initiated SSO', async ({ page, baseURL }) => {
    const userAvatarLocator = page.getByTestId('user-avatar');
    // Go directly to mocksaml hosting
    await page.goto(MOCKSAML_ORIGIN);
    await page.getByRole('link', { name: 'Test IdP Login' }).click();
    await page
      .getByPlaceholder('https://jackson-demo.boxyhq.com/api/oauth/saml')
      .fill(`${baseURL}/api/oauth/saml`);
    await page.getByRole('textbox', { name: 'Please provide a mock email address' }).fill('bob');
    await page.getByRole('button', { name: MOCKSAML_SIGNIN_BUTTON_NAME }).click();
    // Wait for browser to redirect to admin portal
    await page.waitForURL((url) => url.origin === baseURL);
    // assert login state
    await expect(userAvatarLocator).toBeVisible();
  });

  test('delete the SAML SSO connection', async ({ page }) => {
    await page.goto('/admin/settings');
    // select the row of the connection list table, then locate the edit button
    const editButton = page.getByText(TEST_SAML_SSO_CONNECTION_NAME).locator('..').getByTestId('edit');
    await editButton.click();
    // click the delete and confirm deletion
    await page.getByTestId('delete-connection').click();
    await page.getByTestId('confirm-delete').click();
    // check that the SSO connection is deleted from the connection list
    await expect(page.getByText(TEST_SAML_SSO_CONNECTION_NAME)).not.toBeVisible();
  });
});

test.describe('Admin Portal SSO - OIDC', () => {
  test('should be able to add SSO connection to mocklab', async ({ page, baseURL }) => {
    await page.goto('/admin/settings');
    // Find the new connection button and click on it
    await page.getByTestId('create-connection').click();
    // Toggle connection type to OIDC
    await page.getByText('OIDC').click();
    // Fill the name for the connection
    const nameInput = page.locator('#name');
    await nameInput.fill(TEST_OIDC_SSO_CONNECTION_NAME);
    // Enter the OIDC discovery url for mocklab in the form
    const discoveryUrlInput = page.locator('#oidcDiscoveryUrl');
    await discoveryUrlInput.fill(baseURL + MOCKLAB_DISCOVERY_PATH);
    // Enter the OIDC client credentials for mocklab in the form
    const clientIdInput = page.locator('#oidcClientId');
    await clientIdInput.fill(MOCKLAB_CLIENT_ID);
    const clientSecretInput = page.locator('#oidcClientSecret');
    await clientSecretInput.fill(MOCKLAB_CLIENT_SECRET);
    // submit the form
    await page.getByTestId('submit-form-create-sso').click();
    // check if the added connection appears in the connection list
    await expect(page.getByText(TEST_OIDC_SSO_CONNECTION_NAME)).toBeVisible();
  });

  test('should be able to login with mocklab', async ({ page, baseURL }) => {
    const userAvatarLocator = page.getByTestId('user-avatar');
    // Logout from the magic link authentication
    await page.goto('/');
    await userAvatarLocator.click();
    await page.getByTestId('logout').click();
    // Click on login with sso button
    await page.getByTestId('sso-login-button').click();
    // Perform sign in at mocksaml
    await page.waitForURL((url) => url.origin === MOCKLAB_ORIGIN);
    await page.getByPlaceholder('yours@example.com').fill('bob@oidc.com');
    await page.getByRole('button', { name: MOCKLAB_SIGNIN_BUTTON_NAME }).click();
    // Wait for browser to redirect back to admin portal
    await page.waitForURL((url) => url.origin === baseURL);
    // assert login state
    await expect(userAvatarLocator).toBeVisible();
  });

  test('delete the OIDC SSO connection', async ({ page }) => {
    await page.goto('/admin/settings');
    // select the row of the connection list table, then locate the edit button
    const editButton = page.getByText(TEST_OIDC_SSO_CONNECTION_NAME).locator('..').getByTestId('edit');
    await editButton.click();
    // click the delete and confirm deletion
    await page.getByTestId('delete-connection').click();
    await page.getByTestId('confirm-delete').click();
    // check that the SSO connection is deleted from the connection list
    await expect(page.getByText(TEST_OIDC_SSO_CONNECTION_NAME)).not.toBeVisible();
  });
});
