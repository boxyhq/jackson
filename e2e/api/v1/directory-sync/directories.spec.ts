import { test, expect } from '@playwright/test';
import { createDirectory, directoryExpected, directoryPayload } from './request';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

test.beforeAll(async ({ request }) => {
  const directory = await createDirectory(request, directoryPayload);

  expect(directory).toMatchObject({ data: directoryExpected });
});

test.describe('POST /api/v1/directory-sync', () => {
  test('should not be able to create a directory if params are invalid', async ({ request }) => {
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
      const response = await request.post('/api/v1/directory-sync', {
        data: testCase.data,
      });

      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { message: testCase.expectedError },
      });
    }
  });
});

test.describe('GET /api/v1/directory-sync', () => {
  const { tenant, product } = directoryPayload;

  test('should be able to get a directory by tenant and product', async ({ request }) => {
    const response = await request.get('/api/v1/directory-sync', {
      params: {
        tenant,
        product,
      },
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ data: directoryExpected });
  });

  test('should be able to get a directory by ID', async ({ request }) => {
    let response = await request.get('/api/v1/directory-sync', {
      params: {
        tenant,
        product,
      },
    });

    const { data: directory } = await response.json();

    response = await request.get(`/api/v1/directory-sync/${directory.id}`);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ data: directoryExpected });
  });
});
