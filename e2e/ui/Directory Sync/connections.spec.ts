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
  //   Send API requests to user/groups endpoint
  console.log(scimUrl, scimToken);
});
