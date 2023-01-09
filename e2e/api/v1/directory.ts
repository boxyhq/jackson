import { expect, type APIRequestContext } from '@playwright/test';

const directoryBase = {
  tenant: 'api-boxyhq',
  product: 'api-saml-jackson',
  name: 'Directory name',
  type: 'azure-scim-v2',
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

export const createDirectory = async (request: APIRequestContext, payload = directoryPayload) => {
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
