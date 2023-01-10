import { test, expect } from '@playwright/test';
import { createDirectory, directoryPayload, getDirectory, createGroup } from './request';
import groups from '@boxyhq/saml-jackson/test/dsync/data/groups';

test.use({
  extraHTTPHeaders: {
    Authorization: `Api-Key secret`,
    'Content-Type': 'application/json',
  },
});

test.describe('Directory Sync / Groups', () => {
  const { tenant, product } = { ...directoryPayload, tenant: 'api-boxyhq-2' };

  test.beforeAll(async ({ request }) => {
    // Setup a directory
    await createDirectory(request, {
      ...directoryPayload,
      tenant,
    });
  });

  test('should be able to get groups from a directory', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });

    await createGroup(request, directory, groups[0]);

    // Get groups by making API requests
    const response = await request.get('/api/v1/directory-sync/groups', {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryGroups } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(directoryGroups[0]).toMatchObject({
      id: expect.any(String),
      name: groups[0].displayName,
      raw: groups[0],
    });
  });

  test('should be able to get a group from a directory', async ({ request }) => {
    const directory = await getDirectory(request, { tenant, product });
    const createdGroup = await createGroup(request, directory, groups[1]);

    const response = await request.get(`/api/v1/directory-sync/groups/${createdGroup.id}`, {
      params: {
        tenant,
        product,
      },
    });

    const { data: directoryGroup } = await response.json();

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(directoryGroup).toMatchObject({
      id: expect.any(String),
      name: groups[1].displayName,
      raw: groups[1],
    });
  });
});
