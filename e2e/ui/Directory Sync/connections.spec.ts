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
  const user = await createUser(request, directory, azureUser);
  const group = await createGroup(request, directory, azureGroup);
  await addGroupMember(request, directory, group, user.id);
  await dsyncPage.switchToUsersView();
  expect(await page.getByRole('cell', { name: 'givenName' })).toBeVisible();
  expect(await page.getByRole('cell', { name: 'familyName' })).toBeVisible();
  expect(await page.getByRole('cell', { name: 'jackson@example.com' })).toBeVisible();
  await dsyncPage.switchToGroupsView();
  expect(await page.getByRole('cell', { name: 'BoxyHQ' })).toBeVisible();
  await dsyncPage.enableWebHookEventLogging();
});
