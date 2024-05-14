import { expect, type APIRequestContext } from '@playwright/test';
import type { Directory } from '@boxyhq/saml-jackson';
import users from '../../../npm/test/dsync/data/users';

type User = Partial<(typeof users)[0]>;

export const createUser = async (request: APIRequestContext, directory: Directory, user: User) => {
  let endpoint = `${directory.scim.endpoint}/Users`;
  if (directory.type === 'azure-scim-v2') {
    const [_main, aadOpts] = directory.scim.endpoint!.split('?');
    endpoint = `${_main}Users/?${aadOpts}`;
  }

  const response = await request.post(endpoint, {
    data: user,
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(201);

  return await response.json();
};

export const getUser = async (request: APIRequestContext, directory: Directory, userName: string) => {
  const response = await request.get(`${directory.scim.path}/Users`, {
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
    params: {
      filter: `userName eq "${userName}"`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(200);

  return await response.json();
};

export const deleteUser = async (request: APIRequestContext, directory: Directory, userId: string) => {
  const response = await request.delete(`${directory.scim.path}/Users/${userId}`, {
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(200);

  return await response.json();
};
