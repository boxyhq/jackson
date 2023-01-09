import { test, expect } from '@playwright/test';
import {
  createConnection,
  getConnection,
  deleteConnection,
  expectedConnection,
  getRawMetadata,
} from './helpers';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

test.describe('SAML SSO Connection', () => {
  const { tenant, product } = expectedConnection;

  test.afterEach(async ({ request }) => {
    await deleteConnection(request);
  });

  test('should be able to create a SSO Connection', async ({ request }) => {
    const response = await createConnection(request);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject(expectedConnection);
  });

  test('should be able to get SSO Connections', async ({ request }) => {
    await createConnection(request);

    const response = await getConnection(request);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject([expectedConnection]);
  });

  test('should be able to update a SSO Connection', async ({ request }) => {
    await createConnection(request);

    const connection = await (await getConnection(request)).json();

    // Update the connection
    const response = await request.patch('/api/v1/connections', {
      data: {
        tenant,
        product,
        clientID: connection[0].clientID,
        clientSecret: connection[0].clientSecret,
        name: 'new connection name',
        description: 'new connection description',
        defaultRedirectUrl: 'http://localhost:3366/login/saml-new',
        redirectUrl: 'http://localhost:3366/new/*',
        metadataUrl: 'https://mocksaml.com/api/saml/metadata',
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(204);

    // Fetch the connection again to check if the update was successful
    const updatedConnection = await (await getConnection(request)).json();

    expect(updatedConnection).toMatchObject([
      {
        name: 'new connection name',
        description: 'new connection description',
        defaultRedirectUrl: 'http://localhost:3366/login/saml-new',
        redirectUrl: ['http://localhost:3366/new/*'],
      },
    ]);
  });

  test('should be able to delete a SSO Connection', async ({ request }) => {
    await createConnection(request);

    // Delete the connection
    const response = await deleteConnection(request);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(204);

    // Fetch the connection again to check if the delete was successful
    const connection = await (await getConnection(request)).json();

    expect(connection).toMatchObject([]);
  });

  test('should not be able to create a SSO Connection if params are invalid', async ({ request }) => {
    const testCases = [
      {
        data: {
          tenant: null,
          product: 'saml-jackson',
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide tenant',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: null,
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide product',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: 'saml-jackson',
          defaultRedirectUrl: null,
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide a defaultRedirectUrl',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: 'saml-jackson',
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: null,
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide redirectUrl',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: 'saml-jackson',
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: null,
        },
        expectedError: 'Please provide rawMetadata or encodedRawMetadata or metadataUrl',
      },
    ];

    for (const testCase of testCases) {
      const response = await request.post('/api/v1/connections', {
        data: testCase.data,
      });

      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { message: testCase.expectedError },
      });
    }
  });

  test('should be able to create more than one SSO Connection for same tenant and product', async ({
    request,
  }) => {
    // Create the first connection
    await createConnection(request);

    // Create the second connection
    const { tenant, product, defaultRedirectUrl, redirectUrl, name, description } = expectedConnection;

    await request.post('/api/v1/connections', {
      data: {
        tenant,
        product,
        defaultRedirectUrl,
        redirectUrl,
        name,
        description,
        rawMetadata: getRawMetadata('https://saml.example.com/entityid-1'),
      },
    });

    // Fetch the connections
    const response = await getConnection(request);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toHaveLength(2);
    expect(await response.json()).toMatchObject([
      expectedConnection,
      {
        ...expectedConnection,
        idpMetadata: {
          entityID: 'https://saml.example.com/entityid-1',
        },
      },
    ]);
  });

  test('should be able to check if a connection exists', async ({ request }) => {
    await createConnection(request);

    // Fetch a connection that exists
    let response = await request.get('/api/v1/connections/exists', {
      params: {
        tenant,
        product,
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(204);

    // Fetch a connection that does not exist
    response = await request.get('/api/v1/connections/exists', {
      params: {
        tenant: 'boxyhq',
        product: 'saml-jackson',
      },
    });

    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(404);
  });
});
