import { test as baseTest, expect } from '@playwright/test';
import { DSyncPage } from 'e2e/support/fixtures';
import { getDirectory } from 'e2e/api/helpers/directories';
import { options } from 'e2e/api/helpers/api';
import { addGroupMember, createGroup, createUser } from 'e2e/api/helpers';

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

test.only('Azure SCIM connection', async ({ dsyncPage, request, page }) => {
  await dsyncPage.addDSyncConnection('azure-scim-v2');
  //  Send API requests to user/groups endpoint
  const [directory] = await getDirectory(request, { tenant: dsyncPage.tenant, product: dsyncPage.product });
  const user = await createUser(request, directory, {
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
  const group = await createGroup(request, directory, {
    schemas: [
      'urn:ietf:params:scim:schemas:core:2.0:Group',
      'http://schemas.microsoft.com/2006/11/ResourceManagement/ADSCIM/2.0/Group',
    ],
    externalId: '8aa1a0c0-c4c3-4bc0-b4a5-2ef676900159',
    displayName: 'BoxyHQ',
    meta: {
      resourceType: 'Group',
    },
  });
  await addGroupMember(request, directory, group, user.id);
  await dsyncPage.switchToUsersView();
  expect(await page.getByRole('cell', { name: 'givenName' })).toBeVisible();
  expect(await page.getByRole('cell', { name: 'familyName' })).toBeVisible();
  expect(await page.getByRole('cell', { name: 'jackson@example.com' })).toBeVisible();
});
