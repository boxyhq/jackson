import { test, expect } from '@playwright/test';
import { createDirectory, directoryExpected, directoryPayload } from './utils';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

test.describe('Directory Sync / Directories', () => {
  test.beforeAll(async ({ request }) => {
    const response = await createDirectory(request, directoryPayload);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({ data: directoryExpected });
  });

  test('should be able to get a Directory Connection by tenant and product', async ({ request }) => {
    const response = await request.get('/api/v1/directory-sync', {
      params: {
        tenant: directoryPayload.tenant,
        product: directoryPayload.product,
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ data: directoryExpected });
  });

  test('should be able to get a Directory Connection by ID', async ({ request }) => {
    let response = await request.get('/api/v1/directory-sync', {
      params: {
        tenant: directoryPayload.tenant,
        product: directoryPayload.product,
      },
    });

    const directory = await response.json();

    response = await request.get(`/api/v1/directory-sync/${directory.data.id}`);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ data: directoryExpected });
  });

  test('should not be able to create a Directory Connection if params are invalid', async ({ request }) => {
    const testCases = [
      {
        data: {
          ...directoryPayload,
          tenant: '',
        },
        expectedError: 'Missing required parameters.',
      },
      {
        data: {
          ...directoryPayload,
          product: '',
        },
        expectedError: 'Missing required parameters.',
      },
    ];

    for (const testCase of testCases) {
      const response = await createDirectory(request, testCase.data);

      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { message: testCase.expectedError },
      });
    }
  });
});
