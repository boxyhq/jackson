import { test, expect } from '@playwright/test';
import {
  createDirectory,
  directoryPayload,
  getDirectory,
  deleteUser,
  getUser,
  createUser,
} from '../../v1/directory-sync/request';
import users from '@boxyhq/saml-jackson/test/dsync/data/users';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const newDirectoryPayload = {
  ...directoryPayload,
  tenant: 'api-boxyhq-3',
};

const { tenant, product } = newDirectoryPayload;

test.beforeAll(async ({ request }) => {
  await createDirectory(request, newDirectoryPayload);
});

test.afterAll(async ({ request }) => {
  const directory = await getDirectory(request, { tenant, product });
  const user = await getUser(request, directory, users[0].userName);
  await deleteUser(request, directory, user.Resources[0].id);
});

test.describe('SCIM /api/scim/v2.0', () => {
  // POST /api/scim/v2.0/[directoryId]/Users
  test('should be able to create a user', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const response = await createUser(request, directory, users[0]);

    expect(response).toMatchObject({
      ...users[0],
      id: expect.any(String),
    });
  });

  //  GET /api/scim/v2.0/[directoryId]/Users
  test('should be able to get a user by userName', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const user = await getUser(request, directory, users[0].userName);

    expect(user).toMatchObject({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      startIndex: 1,
      totalResults: 1,
      itemsPerPage: 0,
      Resources: [
        {
          ...users[0],
          id: expect.any(String),
        },
      ],
    });
  });

  // GET /api/scim/v2.0/[directoryId]/Users
  test('should not be able to get a user if userName does not exist', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const user = await getUser(request, directory, 'kiran@boxyhq.com`');

    expect(user).toMatchObject({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      startIndex: 1,
      totalResults: 0,
      itemsPerPage: 0,
      Resources: [],
    });
  });

  // GET /api/scim/v2.0/[directoryId]/Users/[userId]
  test('should be able to get a user by userId', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const user = await getUser(request, directory, users[0].userName);

    const response = await request.get(`${directory.scim.path}/Users/${user.Resources[0].id}`, {
      headers: {
        Authorization: `Bearer ${directory.scim.secret}`,
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      ...users[0],
      id: user.Resources[0].id,
    });
  });

  // PATCH /api/scim/v2.0/[directoryId]/Users/[userId]
  test('should be able to update a user using PATCH operation', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const user = await getUser(request, directory, users[0].userName);

    const response = await request.patch(`${directory.scim.path}/Users/${user.Resources[0].id}`, {
      headers: {
        Authorization: `Bearer ${directory.scim.secret}`,
      },
      data: {
        Operations: [
          {
            op: 'replace',
            value: {
              active: false,
              name: { givenName: 'Jackson1', familyName: 'M1' },
            },
          },
        ],
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      ...users[0],
      id: user.Resources[0].id,
      active: false,
      name: { givenName: 'Jackson1', familyName: 'M1' },
    });
  });

  // PUT /api/scim/v2.0/[directoryId]/Users/[userId]
  test('should be able to update a user using PUT operation', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const user = await getUser(request, directory, users[0].userName);

    const response = await request.put(`${directory.scim.path}/Users/${user.Resources[0].id}`, {
      headers: {
        Authorization: `Bearer ${directory.scim.secret}`,
      },
      data: {
        ...users[0],
        name: { givenName: 'Jackson2', familyName: 'M2' },
        active: true,
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      ...users[0],
      id: user.Resources[0].id,
      active: true,
      name: { givenName: 'Jackson2', familyName: 'M2' },
    });
  });
});
