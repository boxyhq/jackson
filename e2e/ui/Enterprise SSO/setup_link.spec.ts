import { expect, test as baseTest } from '@playwright/test';
import { Portal } from 'e2e/support/fixtures';

const TEST_SETUPLINK_REDIRECT_URL = 'http://localhost:3366';
const TEST_SETUPLINK_DEFAULT_REDIRECT_URL = 'http://localhost:3366/login/saml';
const TEST_SETUPLINK_MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const TEST_SETUPLINK_MOCK_METADATA_URL = `${TEST_SETUPLINK_MOCKSAML_ORIGIN}/api/saml/metadata`;
const TEST_SETUPLINK_URL_LABEL_SELECTOR =
  'Share this link with your customers to allow them to set up the integrationClose';
const TEST_SETUPLINK_ADMIN_URL = '/admin/sso-connection/setup-link';
const TEST_SETUPLINK_ADMIN_CONNECTION = '/admin/sso-connection';

type MyFixtures = {
  portal: Portal;
};

export const test = baseTest.extend<MyFixtures>({
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await portal.doCredentialsLogin();
    await use(portal);
  },
});

test.describe('Admin Portal Enterprise SSO SetupLink using generic SAML 2.0', () => {
  test('should be able to create setup link and sso connection using generic SAML 2.0', async ({ page }) => {
    const tenant = 'acme-setuplink-test.com';
    const product = 'acme-setuplink-test';

    // Go to admin/sso-connection/setup-link page and create setup link
    await page.goto(TEST_SETUPLINK_ADMIN_URL);
    await page.getByRole('button', { name: 'New Setup Link' }).click();
    await page.getByPlaceholder('Acme SSO').fill('acme-test');
    await page.getByLabel('Description (Optional)').fill('acme test');
    await page.getByPlaceholder('acme', { exact: true }).fill(tenant);
    await page.getByPlaceholder('MyApp').fill(product);
    await page.getByPlaceholder('http://localhost:3366', { exact: true }).fill(TEST_SETUPLINK_REDIRECT_URL);
    await page.getByPlaceholder('http://localhost:3366/login/').fill(TEST_SETUPLINK_DEFAULT_REDIRECT_URL);

    await page.getByRole('button', { name: 'Create Setup Link' }).click();

    // Extract generated setup link
    const linkContent = await page
      .getByText(TEST_SETUPLINK_URL_LABEL_SELECTOR)
      .locator('input[type="text"]')
      .first()
      .inputValue();

    // Go back to new connections page
    await page.goto(TEST_SETUPLINK_ADMIN_URL);

    // Await for rows loaded
    await expect(page.getByRole('table')).toBeVisible();

    // Check if setup link is created
    await expect(page.getByText(tenant, { exact: true }), 'Failed to create setup link').toBeVisible();
    await expect(page.getByText(product, { exact: true }), 'Failed to create setup link').toBeVisible();

    // Open new tab and go to setup link page
    const context = page.context();
    const setupLinkPage = await context.newPage();
    await setupLinkPage.goto(linkContent);

    // Create SSO connection using generic SAML 2.0 workflow
    await setupLinkPage.getByRole('button', { name: 'Generic SAML 2.0' }).click();
    await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();
    await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();
    await setupLinkPage.getByPlaceholder('Paste the Metadata URL here').click();
    await setupLinkPage.getByPlaceholder('Paste the Metadata URL here').isVisible();
    await setupLinkPage
      .getByPlaceholder('Paste the Metadata URL here')
      .fill(TEST_SETUPLINK_MOCK_METADATA_URL);
    await setupLinkPage.getByRole('button', { name: 'Save' }).click();

    await setupLinkPage.waitForURL(/\/setup\/.+\/sso-connection$/);
    await expect(setupLinkPage.getByRole('cell', { name: 'saml.example.com' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await setupLinkPage.close();

    // Go to connections page
    await page.goto(TEST_SETUPLINK_ADMIN_CONNECTION);

    // Await for rows loaded
    await expect(page.getByRole('table')).toBeVisible();

    // Check if new SSO connection is created
    await expect(
      page.getByText(tenant, { exact: true }),
      'Failed to create new sso connection from setup-link'
    ).toBeVisible();
    await expect(
      page.getByText(product, { exact: true }),
      'Failed to create new sso connection from setup-link'
    ).toBeVisible();

    // Delete the SSO connection
    await page.getByLabel('Edit').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Go back to setup link admin url
    await page.goto(TEST_SETUPLINK_ADMIN_URL);

    // Await for rows loaded
    await expect(page.getByRole('table')).toBeVisible();

    // Delete the created setuplink
    await page.getByRole('button').nth(5).click();
    await page.getByRole('button', { name: 'Delete' }).click();
  });
});
