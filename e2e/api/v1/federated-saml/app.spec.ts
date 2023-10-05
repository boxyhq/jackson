import { test, expect } from '@playwright/test';
import { SAMLFederationApp } from '@boxyhq/saml-jackson';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const expectedApp = {
  name: 'Test App',
  tenant: 'api-boxyhq',
  product: 'api-saml-jackson',
  id: expect.any(String),
  entityId: 'https://boxyhq.com/entity-id',
  acsUrl: 'https://boxyhq.com/acs',
};

let app = {} as SAMLFederationApp;

test.beforeAll(async ({ request }) => {
  const response = await request.post('/api/v1/federated-saml', {
    data: {
      ...expectedApp,
    },
  });

  app = (await response.json()).data;

  expect(response.ok()).toBe(true);
  expect(response.status()).toBe(201);
});

test.describe('GET /api/v1/federated-saml', () => {
  test('Fetch app by id', async ({ request }) => {
    const response = await request.get(`/api/v1/federated-saml?id=${app?.id}`);

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject(app);
  });

  test('Fetch app by tenant and product', async ({ request }) => {
    const response = await request.get(
      `/api/v1/federated-saml?tenant=${app?.tenant}&product=${app?.product}`
    );

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject(app);
  });

  test('Fetch app by product', async ({ request }) => {
    const response = await request.get(`/api/v1/federated-saml/product?product=${app?.product}`);

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject([app]);
  });
});

test.describe('PATCH /api/v1/federated-saml', () => {
  test('Update app by id', async ({ request }) => {
    const response = await request.patch(`/api/v1/federated-saml`, {
      data: {
        id: app?.id,
        name: 'Updated App',
      },
    });

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject({
      ...app,
      name: 'Updated App',
    });
  });

  test('Update app by tenant and product', async ({ request }) => {
    const response = await request.patch(`/api/v1/federated-saml`, {
      data: {
        id: app?.id,
        name: 'Updated App 2',
      },
    });

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject({
      ...app,
      name: 'Updated App 2',
    });
  });
});

test.describe('DELETE /api/v1/federated-saml', () => {
  test('Delete app by id', async ({ request }) => {
    const response = await request.delete(`/api/v1/federated-saml?id=${app?.id}`);

    const { data } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(data).toMatchObject({});

    // Confirm app is deleted
    const response2 = await request.get(`/api/v1/federated-saml?id=${app?.id}`);

    expect(response2.ok()).toBe(false);
    expect(response2.status()).toBe(404);
  });
});
