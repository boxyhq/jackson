import { test, expect } from '@playwright/test';
import { createDirectory, directoryExpected, directoryPayload, getDirectory, createUser } from './utils';
import users from '@boxyhq/saml-jackson/test/dsync/data/users';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

test.describe('Directory Sync / Users', () => {
  const { tenant, product } = { ...directoryPayload, tenant: 'api-boxyhq-1' };

  test.beforeAll(async ({ request }) => {
    await createDirectory(request, {
      ...directoryPayload,
      tenant,
    });
  });

  test('should be able to get users from a directory', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });

    await createUser(request, directory, users[0]);

    // Get users by making API requests
    const response = await request.get('/api/v1/directory-sync/users', {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryUsers } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(directoryUsers[0]).toMatchObject({
      id: expect.any(String),
      first_name: users[0].name.givenName,
      last_name: users[0].name.familyName,
      email: users[0].emails[0].value,
      active: users[0].active,
      raw: users[0],
    });
  });

  test('should be able to get a user from a directory by ID', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const createdUser = await createUser(request, directory, users[1]);

    const response = await request.get(`/api/v1/directory-sync/users/${createdUser.id}`, {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryUser } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(directoryUser).toMatchObject({
      id: expect.any(String),
      first_name: users[1].name.givenName,
      last_name: users[1].name.familyName,
      email: users[1].emails[0].value,
      active: users[1].active,
      raw: users[1],
    });
  });
});
