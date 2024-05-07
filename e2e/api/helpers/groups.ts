import { expect, type APIRequestContext } from '@playwright/test';
import type { Directory, Group } from '@boxyhq/saml-jackson';

export const createGroup = async (request: APIRequestContext, directory: Directory, group: any) => {
  const response = await request.post(`${directory.scim.path}/Groups`, {
    data: group,
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(201);

  return await response.json();
};

export const addGroupMember = async (
  request: APIRequestContext,
  directory: Directory,
  group: Group,
  member: string
) => {
  const response = await request.patch(`${directory.scim.path}/Groups/${group.id}`, {
    data: {
      Operations: [
        {
          action: 'addGroupMember',
          op: 'add',
          path: 'members',
          value: [
            {
              value: member,
            },
          ],
        },
      ],
    },
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(200);

  return await response.json();
};

export const getGroupByDisplayName = async (
  request: APIRequestContext,
  directory: Directory,
  displayName: string
) => {
  const response = await request.get(`${directory.scim.path}/Groups`, {
    params: {
      filter: `displayName eq "${displayName}"`,
    },
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(200);

  return await response.json();
};

export const getGroupById = async (request: APIRequestContext, directory: Directory, groupId: string) => {
  const response = await request.get(`${directory.scim.path}/Groups/${groupId}`, {
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(200);

  return await response.json();
};

export const getGroupsByDirectoryId = async (request: APIRequestContext, directory: Directory) => {
  const response = await request.get(`${directory.scim.path}/Groups`, {
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(200);

  const data = await response.json();
  return data.Resources;
};
