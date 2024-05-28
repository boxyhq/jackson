import { expect, test as baseTest, Page } from '@playwright/test';
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

    // Create setup link
    await setuplinkPage.createSetupLink();

    // use setup link in all tests
    await use(setuplinkPage);

    // remove setup link
    await setuplinkPage.removeSetupLink();
  },
});

const setupLinkTestsData: {
  testDescription: string;
  testTitle: string;
  testRunner: (setupLinkPage: Page) => Promise<void>;
}[] = [
  {
    testDescription: 'Admin Portal Enterprise SSO SetupLink using generic SAML 2.0',
    testTitle: 'should be able to create setup link and sso connection using generic SAML 2.0',
    testRunner: testGenericSaml,
  },
  {
    testDescription: 'AAdmin Portal Enterprise SSO SetupLink using PingOne SAML 2.0',
    testTitle: 'should be able to create setup link and sso connection using PingOne SAML 2.0',
    testRunner: testPingOneSaml,
  },
];

setupLinkTestsData.forEach((testData) => {
  test.describe(testData.testDescription, () => {
    test(testData.testTitle, async ({ page, setuplinkPage }) => {
      // get setuplink url
      const linkContent = await setuplinkPage.getSetupLinkUrl();

      // Open new tab and go to setup link page
      const context = page.context();
      const setupLinkPage = await context.newPage();
      await setupLinkPage.goto(linkContent);

      // run generic saml 2.0 test
      await testData.testRunner(setupLinkPage);

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
    });
  });
});

async function testGenericSaml(setupLinkPage: Page) {
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
  await expect(setupLinkPage.getByRole('heading', { name: 'Step 3: Create SAML Connection' })).toBeVisible();
  p1 = await setupLinkPage.getByText('Enter the Identity Provider').textContent();
  expect(
    p1 ===
      'Enter the Identity Provider Metadata below. You can either enter the metadata URL or paste the XML file content directly.'
  ).toBeTruthy();

  await setupLinkPage.getByPlaceholder('Paste the Metadata URL here').fill(TEST_SETUPLINK_MOCK_METADATA_URL);
  await setupLinkPage.getByRole('button', { name: 'Save' }).click();
}

async function testPingOneSaml(setupLinkPage: Page) {
  // Create SSO connection using PingOne SAML 2.0 workflow
  await setupLinkPage.getByRole('button', { name: 'PingOne SAML SSO' }).click();

  // check mdx generated content using remart-gfm plugin for step1
  await expect(setupLinkPage.getByRole('heading', { name: 'Step 1: Create Application' })).toBeVisible();
  let p1 = await setupLinkPage.getByText('From your PingOne account,').textContent();
  expect(
    p1 === 'From your PingOne account, click Connections > Applications from left navigation menu.'
  ).toBeTruthy();

  let p2 = await setupLinkPage.getByText('If your application is').textContent();
  expect(
    p2 === 'If your application is already created, choose it from the list and move to the next step.'
  ).toBeTruthy();

  let img = await setupLinkPage.getByRole('img', { name: 'img alt' }).getAttribute('src');
  expect(img === 'https://cdn.boxyhq.com/docs/sso/providers/pingone/1.png').toBeTruthy();

  await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();

  // check mdx generated content using remart-gfm plugin for step2
  await expect(setupLinkPage.getByRole('heading', { name: 'Step 2: Configure Application' })).toBeVisible();
  img = await setupLinkPage.getByRole('img', { name: 'img alt' }).first().getAttribute('src');
  expect(img === 'https://cdn.boxyhq.com/docs/sso/providers/pingone/2.png').toBeTruthy();

  p1 = await setupLinkPage.getByText('From the next screen, you').textContent();
  expect(
    p1 === 'From the next screen, you have to enter the following values in the SAML Configuration section:'
  ).toBeTruthy();

  p2 = await setupLinkPage.getByText('Click Save to save the').textContent();
  expect(p2 === 'Click Save to save the configuration.').toBeTruthy();

  await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();

  // check mdx generated content using remart-gfm plugin for step3
  await expect(setupLinkPage.getByRole('heading', { name: 'Step 3: Attribute Mapping' })).toBeVisible();

  p1 = await setupLinkPage.getByText('Click the Attribute Mappings').textContent();
  expect(
    p1 === 'Click the Attribute Mappings tab from the top and you have to configure the following attributes:'
  ).toBeTruthy();

  img = await setupLinkPage.getByRole('img', { name: 'img alt' }).first().getAttribute('src');
  expect(img === 'https://cdn.boxyhq.com/docs/sso/providers/pingone/5.png').toBeTruthy();

  await setupLinkPage.getByRole('button', { name: 'Next Step' }).click();

  // check mdx generated content using remart-gfm plugin for step4
  await expect(setupLinkPage.getByRole('heading', { name: 'Step 4: Create SAML Connection' })).toBeVisible();

  await setupLinkPage.getByPlaceholder('Paste the Metadata URL here').fill(TEST_SETUPLINK_MOCK_METADATA_URL);
  await setupLinkPage.getByRole('button', { name: 'Save' }).click();
}
