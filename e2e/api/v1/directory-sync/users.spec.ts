import { test, expect } from '@playwright/test';
import users from '../../../../npm/test/dsync/data/users';
import { createDirectory, directoryPayload } from '../../helpers/directories';
import { createUser } from '../../helpers/users';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const { tenant, product } = { ...directoryPayload, tenant: 'api-boxyhq-1' };

test.beforeAll(async ({ request }) => {
  const directory = await createDirectory(request, {
    ...directoryPayload,
    tenant,
  });

  await createUser(request, directory, users[0]);
  await createUser(request, directory, users[1]);
});

test.describe('GET /api/v1/directory-sync/users', () => {
  test('should be able to get all users from a directory', async ({ request }) => {
    const response = await request.get('/api/v1/directory-sync/users', {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryUsers } = await response.json();
    const [firstUser, secondUser] = directoryUsers;

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(directoryUsers.length).toBe(2);

    expect(firstUser).toMatchObject({
      id: expect.any(String),
      first_name: users[1].name.givenName,
      last_name: users[1].name.familyName,
      email: users[1].emails[0].value,
      active: users[1].active,
      raw: users[1],
    });

    expect(secondUser).toMatchObject({
      id: expect.any(String),
      first_name: users[0].name.givenName,
      last_name: users[0].name.familyName,
      email: users[0].emails[0].value,
      active: users[0].active,
      raw: users[0],
    });
  });
});

test.describe('GET /api/v1/directory-sync/users/:id', () => {
  test('should be able to get a user from a directory', async ({ request }) => {
    let response = await request.get('/api/v1/directory-sync/users', {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryUsers } = await response.json();
    const [firstUser] = directoryUsers;

    response = await request.get(`/api/v1/directory-sync/users/${firstUser.id}`, {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryUser } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(directoryUser).toMatchObject(firstUser);
  });
});
