import { test } from '@playwright/test';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

test.describe('OIDC SSO Connection', () => {
  //
});
