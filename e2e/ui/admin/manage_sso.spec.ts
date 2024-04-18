import { expect, test } from '@playwright/test';

const MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const MOCKSAML_METADATA_URL = `${MOCKSAML_ORIGIN}/api/namespace/pw_sso/saml/metadata`;
const TEST_SAML_SSO_CONNECTION_NAME = 'pw_sso_saml_1';
const TEST_SAML_TENANT = 'acme.com';
const TEST_SAML_PRODUCT = 'demo';

test.describe.only('Enterprise SSO - Manage Connections', () => {
  test('Add SAML SSO Connection', async ({ page, baseURL }) => {
    await page.goto('/admin/sso-connection');
    // Find the new connection button and click on it
    await page.getByTestId('create-connection').click();
    // Fill the name for the connection
    const nameInput = page.getByLabel('Connection name (Optional)');
    await nameInput.fill(TEST_SAML_SSO_CONNECTION_NAME);
    // Fill the tenant for the connection
    const tenantInput = page.getByLabel('Tenant');
    await tenantInput.fill(TEST_SAML_TENANT);
    // Fill the product for the connection
    const productInput = page.getByLabel('Product');
    await productInput.fill(TEST_SAML_PRODUCT);
    // Fill the Allowed redirect URLs for the connection
    const redirectURLSInput = page
      .getByRole('group')
      .filter({ hasText: 'Allowed redirect URLs' })
      .locator(page.getByRole('textbox').first());
    await redirectURLSInput.fill(baseURL!);
    // Fill the default redirect URLs for the connection
    const defaultRedirectURLInput = page.getByLabel('Default redirect URL');
    await defaultRedirectURLInput.fill(`${baseURL}/admin/auth/idp-login`);
    // Enter the metadata url for mocksaml in the form
    const metadataUrlInput = page.getByLabel('Metadata URL');
    await metadataUrlInput.fill(MOCKSAML_METADATA_URL);
    // submit the form
    await page.getByRole('button', { name: /save/i }).click();
    // check if the added connection appears in the connection list
    await expect(page.getByText(TEST_SAML_SSO_CONNECTION_NAME)).toBeVisible();
  });
});
