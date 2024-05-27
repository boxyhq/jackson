import { expect, test as baseTest } from '@playwright/test';
import { Portal, SetupLinkPage } from 'e2e/support/fixtures';

const TEST_SETUPLINK_MOCKSAML_ORIGIN = process.env.MOCKSAML_ORIGIN || 'https://mocksaml.com';
const TEST_SETUPLINK_MOCK_METADATA_URL = `${TEST_SETUPLINK_MOCKSAML_ORIGIN}/api/saml/metadata`;

const TEST_SETUPLINK_ADMIN_CONNECTION = '/admin/sso-connection';
const TENANT = 'acme-setuplink-test.com';
const PRODUCT = 'acme-setuplink-test';

type MyFixtures = {
  portal: Portal;
  setuplinkPage: SetupLinkPage;
};

export const test = baseTest.extend<MyFixtures>({
  portal: async ({ page }, use) => {
    const portal = new Portal(page);
    await portal.doCredentialsLogin();
    await use(portal);
  },
  setuplinkPage: async ({ page }, use) => {
    const setuplinkPage = new SetupLinkPage(page, PRODUCT, TENANT);
    await use(setuplinkPage);
  },
});

test.describe('Admin Portal Enterprise SSO SetupLink using generic SAML 2.0', () => {
  test('should be able to create setup link and sso connection using generic SAML 2.0', async ({
    page,
    setuplinkPage,
  }) => {
    // Create setup link
    await setuplinkPage.createSetupLink();

    // get setuplink url
    const linkContent = await setuplinkPage.getSetupLinkUrl();

    // Open new tab and go to setup link page
    const context = page.context();
    const setupLinkPage = await context.newPage();
    await setupLinkPage.goto(linkContent);

    // Create SSO connection using generic SAML 2.0 workflow
    await setupLinkPage.getByRole('button', { name: 'Generic SAML 2.0' }).click();
    await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();
    await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();
    await setupLinkPage
      .getByPlaceholder('Paste the Metadata URL here')
      .fill(TEST_SETUPLINK_MOCK_METADATA_URL);
    await setupLinkPage.getByRole('button', { name: 'Save' }).click();

    await setupLinkPage.waitForURL(/\/setup\/.+\/sso-connection$/);
    await expect(setupLinkPage.getByRole('cell', { name: 'saml.example.com' })).toBeVisible();
    await setupLinkPage.close();

    // Go to connections page
    await page.goto(TEST_SETUPLINK_ADMIN_CONNECTION);

    // Check if new SSO connection is created
    await expect(
      page.getByText(TENANT, { exact: true }),
      'Failed to create new sso connection from setup-link'
    ).toBeVisible();
    await expect(
      page.getByText(PRODUCT, { exact: true }),
      'Failed to create new sso connection from setup-link'
    ).toBeVisible();

    // Delete the SSO connection
    await page.getByLabel('Edit').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // remove setup link
    await setuplinkPage.removeSetupLink();
  });
});
