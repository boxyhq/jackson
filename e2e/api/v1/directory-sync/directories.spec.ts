import { test, expect } from '@playwright/test';
import {
  createDirectory,
  deleteDirectory,
  directoryExpected,
  directoryPayload,
  getDirectory,
} from '../../helpers/directories';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

const { tenant, product } = directoryPayload;

test.beforeAll(async ({ request }) => {
  const directory = await createDirectory(request, directoryPayload);

  expect(directory).toMatchObject(directoryExpected);
});

test.afterAll(async ({ request }) => {
  const [directory] = await getDirectory(request, { tenant, product });

  await deleteDirectory(request, directory.id);
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
      const response = await request.post('/api/v1/dsync', {
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
  test('should be able to get a directory by tenant and product', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });

    expect(directory).toMatchObject([directoryExpected]);
  });

  test('should be able to get a directory by ID', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });

    const response = await request.get(`/api/v1/dsync/${directory[0].id}`);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ data: directoryExpected });
  });
});
