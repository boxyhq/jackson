import { test as baseTest, expect } from '@playwright/test';
import { DSyncPage } from 'e2e/support/fixtures';
import { getDirectory } from 'e2e/api/helpers/directories';
import { createUser } from 'e2e/api/helpers/users';
import { options } from 'e2e/api/helpers/api';

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
  //   Send API requests to user/groups endpoint
  const [directory] = await getDirectory(request, { tenant: dsyncPage.tenant, product: dsyncPage.product });
  await createUser(request, directory, {
    schemas: [
      'urn:ietf:params:scim:schemas:core:2.0:User',
      'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
    ],
    externalId: 'jackson',
    userName: 'jackson@aswinboxyhq.onmicrosoft.com',
    active: true,
    displayName: 'Jackson',
    emails: [{ primary: true, type: 'work', value: 'jackson@example.com' }],
    meta: { resourceType: 'User' },
    name: { formatted: 'givenName familyName', familyName: 'familyName', givenName: 'givenName' },
    title: 'Manager',
  });
  await dsyncPage.switchToUsersView();
  expect(await page.getByRole('cell', { name: 'givenName' })).toBeVisible();
  expect(await page.getByRole('cell', { name: 'familyName' })).toBeVisible();
  expect(await page.getByRole('cell', { name: 'jackson@example.com' })).toBeVisible();
});
