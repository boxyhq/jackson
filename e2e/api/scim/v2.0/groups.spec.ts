import { test } from '@playwright/test';
import { createDirectory, directoryPayload, getDirectory } from '../../v1/directory-sync/request';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const newDirectoryPayload = {
  ...directoryPayload,
  tenant: 'api-boxyhq-4',
};

const { tenant, product } = newDirectoryPayload;

test.beforeAll(async ({ request }) => {
  await createDirectory(request, newDirectoryPayload);
});
