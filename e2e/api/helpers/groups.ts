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
