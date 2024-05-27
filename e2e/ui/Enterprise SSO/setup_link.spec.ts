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

    // check mdx generated content using remart-gfm plugin for step1
    await expect(setupLinkPage.getByRole('heading', { name: 'Step 1: Configuration SAML' })).toBeVisible();
    let p1 = await setupLinkPage.getByText('Your Identity Provider (IdP)').textContent();
    expect(
      p1 ===
        'Your Identity Provider (IdP) will ask for the following information while configuring the SAML application.'
    ).toBeTruthy();

    let p2 = await setupLinkPage.getByText('Please do not add a trailing').textContent();
    expect(p2 === 'Please do not add a trailing slash at the end of the URLs.').toBeTruthy();

    const p3 = await setupLinkPage.getByText('Create them exactly as shown').textContent();
    expect(p3 === 'Create them exactly as shown below:').toBeTruthy();

    await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();

    // check mdx generated content using remart-gfm plugin for step2
    await expect(setupLinkPage.getByRole('heading', { name: 'Step 2: SAML Profile/Claims/' })).toBeVisible();
    p1 = await setupLinkPage.getByText('We try and support 4').textContent();
    expect(p1 === 'We try and support 4 attributes in the SAML claims:').toBeTruthy();

    p2 = await setupLinkPage.getByText('This is how the common SAML').textContent();
    expect(
      p2 ===
        'This is how the common SAML attributes map over for most providers, but some providers have custom mappings. Please refer to the documentation on Identity Provider to understand the exact mapping.'
    ).toBeTruthy();

    await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();

    // check mdx generated content using remart-gfm plugin for step3
    await expect(
      setupLinkPage.getByRole('heading', { name: 'Step 3: Create SAML Connection' })
    ).toBeVisible();
    p1 = await setupLinkPage.getByText('Enter the Identity Provider').textContent();
    expect(
      p1 ===
        'Enter the Identity Provider Metadata below. You can either enter the metadata URL or paste the XML file content directly.'
    ).toBeTruthy();

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
