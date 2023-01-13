import { test, expect } from '@playwright/test';
import { createDirectory, directoryPayload, getDirectory } from '../../helpers/directories';
import { createUser, getUser } from '../../helpers/users';
import { createGroup, getGroupByDisplayName } from '../../helpers/groups';
import groups from '../../../../npm/test/dsync/data/groups';
import users from '../../../../npm/test/dsync/data/users';

// Create a group with no members (Done)
// Get a group by displayName (Done)
// Get a group by id (Done)
// Add a member to a group (Done)
// Create a group with members
// Remove a member from a group (Done)
// Delete a group
// Get all groups

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const { tenant, product } = { ...directoryPayload, tenant: 'api-boxyhq-13' };

test.beforeAll(async ({ request }) => {
  await createDirectory(request, {
    ...directoryPayload,
    tenant,
  });
});

test.describe('SCIM /api/scim/v2.0/:directoryId/Groups', () => {
  // POST /api/scim/v2.0/[directoryId]/Groups
  test('should be able to push a group with no members', async ({ request }) => {
    const [directory] = await getDirectory(request, { tenant, product });
    const response = await createGroup(request, directory, groups[0]);

    expect(response).toMatchObject({
      ...groups[0],
      id: expect.any(String),
    });
  });

  // GET /api/scim/v2.0/[directoryId]/Groups
  test('should be able to get a group by displayName', async ({ request }) => {
    const [directory] = await getDirectory(request, { tenant, product });
    const group = await getGroupByDisplayName(request, directory, groups[0].displayName);

    expect(group).toMatchObject({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      startIndex: 1,
      totalResults: 1,
      itemsPerPage: 1,
      Resources: [
        {
          ...groups[0],
          id: expect.any(String),
        },
      ],
    });
  });

  // GET /api/scim/v2.0/[directoryId]/Groups/[groupId]
  test('should be able to get a group by groupId', async ({ request }) => {
    const [directory] = await getDirectory(request, { tenant, product });
    const group = await getGroupByDisplayName(request, directory, groups[0].displayName);

    const response = await request.get(`${directory.scim.path}/Groups/${group.Resources[0].id}`, {
      headers: {
        Authorization: `Bearer ${directory.scim.secret}`,
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      ...groups[0],
      id: expect.any(String),
    });
  });

  // PATCH /api/scim/v2.0/[directoryId]/Groups/[groupId]
  test('should be able to add a member to a group', async ({ request }) => {
    const [directory] = await getDirectory(request, { tenant, product });
    const user = await createUser(request, directory, users[0]);
    const group = await getGroupByDisplayName(request, directory, groups[0].displayName);

    const response = await request.patch(`${directory.scim.path}/Groups/${group.Resources[0].id}`, {
      headers: {
        Authorization: `Bearer ${directory.scim.secret}`,
      },
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'add',
            path: 'members',
            value: [
              {
                value: user.id,
                display: user.userName,
              },
            ],
          },
        ],
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      ...groups[0],
      id: expect.any(String),
      members: [
        {
          value: user.id,
        },
      ],
    });
  });

  // PATCH /api/scim/v2.0/[directoryId]/Groups/[groupId]
  test('should be able to remove a member from a group', async ({ request }) => {
    const [directory] = await getDirectory(request, { tenant, product });
    const user = await getUser(request, directory, users[0].userName);
    const group = await getGroupByDisplayName(request, directory, groups[0].displayName);

    const response = await request.patch(`${directory.scim.path}/Groups/${group.Resources[0].id}`, {
      headers: {
        Authorization: `Bearer ${directory.scim.secret}`,
      },
      data: {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
        Operations: [
          {
            op: 'remove',
            path: `members[value eq "${user.Resources[0].id}"]`,
          },
        ],
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      ...groups[0],
      id: expect.any(String),
      members: [],
    });
  });

  // // GET /api/scim/v2.0/[directoryId]/Users
  // test('should not be able to get a user if userName does not exist', async ({ request }) => {
  //   const [directory] = await getDirectory(request, { tenant, product });
  //   const user = await getUser(request, directory, 'kiran@boxyhq.com`');

  //   expect(user).toMatchObject({
  //     schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
  //     startIndex: 1,
  //     totalResults: 0,
  //     itemsPerPage: 0,
  //     Resources: [],
  //   });
  // });

  // // GET /api/scim/v2.0/[directoryId]/Users
  // test('should be able to get all users', async ({ request }) => {
  //   const [directory] = await getDirectory(request, { tenant, product });

  //   // Create a second user
  //   await createUser(request, directory, users[1]);

  //   const response = await request.get(`${directory.scim.path}/Users`, {
  //     headers: {
  //       Authorization: `Bearer ${directory.scim.secret}`,
  //     },
  //   });

  //   const directoryUsers = await response.json();

  //   expect(response.ok()).toBe(true);
  //   expect(response.status()).toBe(200);
  //   expect(directoryUsers.totalResults).toBe(2);
  //   expect(directoryUsers.Resources).toHaveLength(2);
  //   expect(directoryUsers.Resources[0]).toMatchObject({
  //     ...users[1],
  //     id: expect.any(String),
  //   });
  //   expect(directoryUsers.Resources[1]).toMatchObject({
  //     ...users[0],
  //     id: expect.any(String),
  //   });
  // });

  // // PATCH /api/scim/v2.0/[directoryId]/Users/[userId]
  // test('should be able to update a user using PATCH operation', async ({ request }) => {
  //   const [directory] = await getDirectory(request, { tenant, product });
  //   const user = await getUser(request, directory, users[0].userName);

  //   const response = await request.patch(`${directory.scim.path}/Users/${user.Resources[0].id}`, {
  //     headers: {
  //       Authorization: `Bearer ${directory.scim.secret}`,
  //     },
  //     data: {
  //       Operations: [
  //         {
  //           op: 'replace',
  //           value: {
  //             active: false,
  //             name: { givenName: 'Jackson1', familyName: 'M1' },
  //           },
  //         },
  //       ],
  //     },
  //   });

  //   expect(response.ok()).toBe(true);
  //   expect(response.status()).toBe(200);
  //   expect(await response.json()).toMatchObject({
  //     ...users[0],
  //     id: user.Resources[0].id,
  //     active: false,
  //     name: { givenName: 'Jackson1', familyName: 'M1' },
  //   });
  // });

  // // PUT /api/scim/v2.0/[directoryId]/Users/[userId]
  // test('should be able to update a user using PUT operation', async ({ request }) => {
  //   const [directory] = await getDirectory(request, { tenant, product });
  //   const user = await getUser(request, directory, users[0].userName);

  //   const response = await request.put(`${directory.scim.path}/Users/${user.Resources[0].id}`, {
  //     headers: {
  //       Authorization: `Bearer ${directory.scim.secret}`,
  //     },
  //     data: {
  //       ...users[0],
  //       name: { givenName: 'Jackson2', familyName: 'M2' },
  //       active: true,
  //     },
  //   });

  //   expect(response.ok()).toBe(true);
  //   expect(response.status()).toBe(200);
  //   expect(await response.json()).toMatchObject({
  //     ...users[0],
  //     id: user.Resources[0].id,
  //     active: true,
  //     name: { givenName: 'Jackson2', familyName: 'M2' },
  //   });
  // });

  // // DELETE /api/scim/v2.0/[directoryId]/Users/[userId]
  // test('should be able to delete a user', async ({ request }) => {
  //   const [directory] = await getDirectory(request, { tenant, product });
  //   const firstUser = await getUser(request, directory, users[0].userName);
  //   const secondUser = await getUser(request, directory, users[1].userName);

  //   let response = await request.delete(`${directory.scim.path}/Users/${firstUser.Resources[0].id}`, {
  //     headers: {
  //       Authorization: `Bearer ${directory.scim.secret}`,
  //     },
  //   });

  //   expect(response.ok()).toBe(true);
  //   expect(response.status()).toBe(200);

  //   response = await request.delete(`${directory.scim.path}/Users/${secondUser.Resources[0].id}`, {
  //     headers: {
  //       Authorization: `Bearer ${directory.scim.secret}`,
  //     },
  //   });

  //   expect(response.ok()).toBe(true);
  //   expect(response.status()).toBe(200);

  //   response = await request.get(`${directory.scim.path}/Users`, {
  //     headers: {
  //       Authorization: `Bearer ${directory.scim.secret}`,
  //     },
  //   });

  //   const directoryUsers = await response.json();

  //   expect(directoryUsers.totalResults).toBe(0);
  //   expect(directoryUsers.Resources).toHaveLength(0);
  // });
});
