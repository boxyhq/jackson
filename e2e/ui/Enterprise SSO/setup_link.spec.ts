import { Locator, Page, expect, test as baseTest } from '@playwright/test';
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

async function retryForCondition(condition: Promise<any>, retries = 10, retryInterval = 500) {
  while (retries) {
    if (await condition) {
      break;
    } else {
      setTimeout(() => {
        retries -= 1;
      }, retryInterval);
    }
  }
}

async function getRowByTenantProduct(
  page: Page,
  tenant: string,
  product: string,
  tenantProductIndexes: Array<number>
): Promise<Locator | string> {
  const rows = await page.getByRole('row').all();
  const setupLinks = await Promise.all(rows.map(async (el: Locator) => el));
  let row: Locator | string = '';

  for (const link of setupLinks) {
    const el = await link.innerText();
    const cellContents = el.split('\t');
    if (
      cellContents.length > 1 &&
      cellContents[tenantProductIndexes[0]] === tenant &&
      cellContents[tenantProductIndexes[1]] === product
    ) {
      row = link;
    }
  }

  return row;
}

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

    // Get single row containing setuplink
    let linkRow = await getRowByTenantProduct(page, tenant, product, [0, 1]);
    expect(linkRow, 'Failed to create setup link').toBeTruthy();

    // Open new tab and go to setup link page
    const context = page.context();
    const page1 = await context.newPage();
    await page1.waitForLoadState();
    await page1.goto(linkContent);

    // Create SSO connection using generic SAML 2.0 workflow
    await page1.getByRole('button', { name: 'Generic SAML 2.0' }).click();
    await page1.getByRole('button', { name: 'Next Step' }).click();
    await page1.getByRole('button', { name: 'Next Step' }).click();
    await page1.getByPlaceholder('Paste the Metadata URL here').click();
    await page1.getByPlaceholder('Paste the Metadata URL here').isVisible();
    await page1.getByPlaceholder('Paste the Metadata URL here').fill(TEST_SETUPLINK_MOCK_METADATA_URL);
    await page1.getByRole('button', { name: 'Save' }).click();

    await page1.close();

    // Go to connections page
    await page.goto(TEST_SETUPLINK_ADMIN_CONNECTION);

    // Check if new connection button is enabled
    const connButtonEnabled = page.getByTestId('create-connection').isEnabled();
    await retryForCondition(connButtonEnabled);

    await page.getByTestId('create-connection').click();
    await page.getByRole('link', { name: 'Back' }).click();

    // wait for page to reload by checking if connection button is enabled
    await retryForCondition(connButtonEnabled);

    // Await for rows loaded
    await expect(page.getByRole('table')).toBeVisible();

    // Check if new SSO connection is created
    const createdConnRow = await getRowByTenantProduct(page, tenant, product, [2, 3]);
    expect(createdConnRow, 'Failed to create new sso connection from setup-link').toBeTruthy();

    // Delete the SSO connection
    await (createdConnRow as Locator).getByLabel('Edit').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Go back to setup link admin url
    await page.goto(TEST_SETUPLINK_ADMIN_URL);
    const newSetupLinkEnabled = page.getByRole('button', { name: 'New Setup Link' }).isEnabled();
    await retryForCondition(newSetupLinkEnabled);

    // Await for rows loaded
    await expect(page.getByRole('table')).toBeVisible();

    linkRow = await getRowByTenantProduct(page, tenant, product, [0, 1]);

    // Delete the created setuplink
    if (linkRow) {
      await (createdConnRow as Locator).getByRole('button').nth(3).click();
      await page.getByRole('button', { name: 'Delete' }).click();
    }
  });
});
