import { expect, type APIRequestContext } from '@playwright/test';
import type { Directory, User } from '@boxyhq/saml-jackson';

const directoryBase = {
  tenant: 'api-boxyhq',
  product: 'api-saml-jackson',
  name: 'Directory name',
  type: 'okta-scim-v2',
};

export const directoryPayload = {
  ...directoryBase,
  webhook_url: 'https://example.com',
  webhook_secret: 'secret',
};

export const directoryExpected = {
  ...directoryBase,
  id: expect.any(String),
  log_webhook_events: false,
  scim: {
    path: expect.any(String),
    secret: expect.any(String),
    endpoint: expect.any(String),
  },
  webhook: { endpoint: 'https://example.com', secret: 'secret' },
};

export const createDirectory = async (request: APIRequestContext, payload: typeof directoryPayload) => {
  return await request.post('/api/v1/directory-sync', {
    data: {
      ...payload,
    },
  });
};

export const deleteDirectory = async (request: APIRequestContext) => {
  const { tenant, product } = directoryPayload;

  return await request.delete('/api/v1/directory-sync', {
    params: {
      tenant,
      product,
    },
  });
};

export const getDirectory = async (
  request: APIRequestContext,
  { tenant, product, id }: { tenant?: string; product?: string; id?: string }
) => {
  if (tenant && product) {
    const response = await request.get('/api/v1/directory-sync', {
      params: {
        tenant,
        product,
      },
    });

    const { data } = await response.json();

    return data;
  }

  if (id) {
    const response = await request.get(`/api/v1/directory-sync/${id}`);

    const { data } = await response.json();

    return data;
  }
};

export const createUser = async (request: APIRequestContext, directory: Directory, user: any) => {
  const response = await request.post(`${directory.scim.path}/Users`, {
    data: user,
    headers: {
      Authorization: `Bearer ${directory.scim.secret}`,
    },
  });

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(201);

  return await response.json();
};
