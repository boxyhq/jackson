import { type APIRequestContext } from '@playwright/test';

// Get a connection
export const getConnection = async (request: APIRequestContext, tenant: string, product: string) => {
  return await request.get('/api/v1/connections', {
    headers: {
      Authorization: `Api-Key secret`,
      'Content-Type': 'application/json',
    },
    params: {
      tenant,
      product,
    },
  });
};

// Create a connection
export const createConnection = async (request: APIRequestContext, data: any) => {
  return await request.post('/api/v1/connections', {
    headers: {
      Authorization: `Api-Key secret`,
      'Content-Type': 'application/json',
    },
    data,
  });
};
