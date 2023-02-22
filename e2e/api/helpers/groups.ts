import { expect, type APIRequestContext } from '@playwright/test';
import type { Directory } from '@boxyhq/saml-jackson';

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
