import { test as baseTest, expect } from '@playwright/test';
import { DSyncPage } from 'e2e/support/fixtures';
import { getDirectory } from 'e2e/api/helpers/directories';
import { options } from 'e2e/api/helpers/api';
import { addGroupMember, createGroup, createUser } from 'e2e/api/helpers';
import { azureGroup, azureUser } from 'e2e/support/data/dsync';

type MyFixtures = {
  dsyncPage: DSyncPage;
};

export const test = baseTest.extend<MyFixtures>({
  dsyncPage: async ({ page }, use) => {
    const dsyncPage = new DSyncPage(page);
    await use(dsyncPage);
    await dsyncPage.deleteConnection();
  },
});

test.use(options);

test('Azure SCIM connection', async ({ dsyncPage, request, page }) => {
  await dsyncPage.addDSyncConnection('azure-scim-v2');
  //  Send API requests to user/groups endpoint
  const [directory] = await getDirectory(request, { tenant: dsyncPage.tenant, product: dsyncPage.product });
  const azureUser1 = azureUser(1);
  const user1 = await createUser(request, directory, azureUser1);
  const group = await createGroup(request, directory, azureGroup);
  await addGroupMember(request, directory, group, user1.id);
  // Assert created user
  await dsyncPage.switchToUsersView();
  expect(await page.getByRole('cell', { name: azureUser1.name.givenName, exact: true })).toBeVisible();
  expect(await page.getByRole('cell', { name: azureUser1.name.familyName, exact: true })).toBeVisible();
  expect(await page.getByRole('cell', { name: azureUser1.emails[0].value, exact: true })).toBeVisible();
  // Assert created group
  await dsyncPage.switchToGroupsView();
  expect(await page.getByRole('cell', { name: 'BoxyHQ' })).toBeVisible();
  // Enable webhook logs
  await dsyncPage.enableWebHookEventLogging();
  const azureUser2 = azureUser(2);
  const user2 = await createUser(request, directory, azureUser2);
  await addGroupMember(request, directory, group, user2.id);
  // Assert created user
  await dsyncPage.switchToUsersView();
  expect(await page.getByRole('cell', { name: azureUser2.name.givenName, exact: true })).toBeVisible();
  expect(await page.getByRole('cell', { name: azureUser2.name.familyName, exact: true })).toBeVisible();
  expect(await page.getByRole('cell', { name: azureUser2.emails[0].value, exact: true })).toBeVisible();
  await page.getByText('Webhook Events').click();
  const webhookRowRegex = new RegExp(`${directory.webhook.endpoint}.*View`);
  await page.getByRole('row', { name: webhookRowRegex }).getByRole('button').first().click();
  await page.waitForURL('**/admin/directory-sync/**/events/**');
  await page.getByText('Loading...').waitFor();
  await page.locator('pre').waitFor();
  expect(await page.getByText('"group.user_added"')).toBeVisible();
  await page.getByRole('listitem').and(page.getByText('Webhook Events')).click();
  await page.getByRole('row', { name: webhookRowRegex }).getByRole('button').nth(1).click();
  await page.waitForURL('**/admin/directory-sync/**/events/**');
  await page.getByText('Loading...').waitFor();
  await page.locator('pre').waitFor();
  expect(await page.getByText('"user.created"')).toBeVisible();
});
