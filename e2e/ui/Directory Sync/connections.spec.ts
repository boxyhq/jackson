import { test as baseTest } from '@playwright/test';
import { DSyncPage } from 'e2e/support/fixtures/dsync-page';

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

test('Azure SCIM connection', async ({ dsyncPage }) => {
  const { scimUrl, scimToken } = await dsyncPage.addDSyncConnection('azure-scim-v2');
  //   Send API requests to user/groups endpoint
  console.log(scimUrl, scimToken);
});
