import { IDirectorySyncController, DirectoryType } from '../../src/typings';
import tap from 'tap';
import { jacksonOptions } from '../utils';

let directorySync: IDirectorySyncController;

export const directoryPayload = {
  tenant: 'boxyhq',
  product: 'saml-jackson',
  name: 'Directory 1',
  type: 'okta-scim-v2' as DirectoryType,
  webhook_url: 'https://example.com',
  webhook_secret: 'secret',
};

const { tenant, product } = directoryPayload;

tap.before(async () => {
  const { directorySyncController } = await (await import('../../src/index')).default(jacksonOptions);

  directorySync = directorySyncController;

  const { data: directory } = await directorySync.directories.create(directoryPayload);

  if (directory === null) {
    tap.fail("Couldn't create a directory");
  }

  tap.ok(directory);
  tap.strictSame(directory?.tenant, tenant);
  tap.strictSame(directory?.product, product);
  tap.strictSame(directory?.name, directoryPayload.name);
  tap.strictSame(directory?.type, directoryPayload.type);
  tap.strictSame(directory?.webhook.endpoint, directoryPayload.webhook_url);
  tap.strictSame(directory?.webhook.secret, directoryPayload.webhook_secret);
  tap.strictSame(directory?.log_webhook_events, false);
  tap.match(directory?.id, /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
});

tap.teardown(async () => {
  const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(tenant, product);

  if (directoriesFetched === null) {
    return;
  }

  // Delete the directory
  await directorySync.directories.delete(directoriesFetched[0].id);
  await directorySync.directories.delete(directoriesFetched[1].id);

  process.exit(0);
});

tap.test('Directories / ', async (t) => {
  const { data: directories } = await directorySync.directories.getByTenantAndProduct(tenant, product);

  if (directories === null) {
    t.fail("Couldn't get a directory");
    return;
  }

  const directory = directories[0];

  t.test('should not be able to create a directory without required params', async (t) => {
    const { data, error } = await directorySync.directories.create({
      name: '',
      tenant: '',
      product: '',
      type: 'azure-scim-v2',
    });

    t.ok(error);
    t.notOk(data);
    t.equal(error?.code, 400);
    t.equal(error?.message, 'Missing required parameters.');

    t.end();
  });

  t.test('should be able to get a directory by ID', async (t) => {
    const { data: directoryFetched } = await directorySync.directories.get(directory.id);

    t.ok(directoryFetched);
    t.strictSame(directoryFetched, directory);
    t.match(directoryFetched?.id, directory.id);

    t.end();
  });

  t.test("should not be able to get a directory that doesn't exist", async (t) => {
    const { data, error } = await directorySync.directories.get('invalid-id');

    t.ok(error);
    t.notOk(data);
    t.equal(error?.code, 404);
    t.equal(error?.message, 'Directory configuration not found.');
  });

  t.test('should not be able to get a directory without an id', async (t) => {
    const { data, error } = await directorySync.directories.get('');

    t.ok(error);
    t.notOk(data);
    t.equal(error?.code, 400);
    t.equal(error?.message, 'Missing required parameters.');
  });

  t.test('should not be able to update a directory without an id', async (t) => {
    const { data, error } = await directorySync.directories.update('', {
      log_webhook_events: false,
    });

    t.ok(error);
    t.notOk(data);
    t.equal(error?.code, 400);
    t.equal(error?.message, 'Missing required parameters.');
  });

  t.test('should be able to get a directory by tenant and product', async (t) => {
    const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(
      tenant,
      product
    );

    t.ok(directoriesFetched);
    t.strictSame(directoriesFetched, [directory]);
    t.match(directoriesFetched?.length, 1);

    t.end();
  });

  t.test('should be able to get all directories', async (t) => {
    const { data: directoriesFetched } = await directorySync.directories.list({});

    t.ok(directoriesFetched);
    t.strictSame(directoriesFetched, [directory]);
    t.match(directoriesFetched?.length, 1);

    t.end();
  });

  t.test('should be able to update a directory', async (t) => {
    const toUpdate = {
      name: 'BoxyHQ 1',
      webhook: {
        endpoint: 'https://my-cool-app.com/webhook',
        secret: 'secret',
      },
      log_webhook_events: true,
      type: 'jumpcloud-scim-v2' as DirectoryType,
    };

    const { data: updatedDirectory } = await directorySync.directories.update(directory.id, toUpdate);

    t.ok(updatedDirectory);
    t.match(directory.id, updatedDirectory?.id);
    t.match(updatedDirectory?.name, toUpdate.name);
    t.match(updatedDirectory?.webhook.endpoint, toUpdate.webhook.endpoint);
    t.match(updatedDirectory?.webhook.secret, toUpdate.webhook.secret);
    t.match(updatedDirectory?.log_webhook_events, toUpdate.log_webhook_events);

    // Partial update
    const { data: anotherDirectory } = await directorySync.directories.update(directory.id, {
      name: 'BoxyHQ 2',
      log_webhook_events: false,
    });

    t.ok(anotherDirectory);
    t.match(anotherDirectory?.name, 'BoxyHQ 2');
    t.match(anotherDirectory?.log_webhook_events, false);

    t.end();
  });

  t.test(
    'should not be able to get a directory by tenant and product without tenant and product',
    async (t) => {
      const { data, error } = await directorySync.directories.getByTenantAndProduct('', '');

      t.ok(error);
      t.notOk(data);
      t.equal(error?.code, 400);
      t.equal(error?.message, 'Missing required parameters.');
    }
  );

  t.test('should be able to create more than one directory for a tenant and product', async (t) => {
    // Create another directory
    await directorySync.directories.create({
      ...directoryPayload,
      name: 'Directory 2',
    });

    const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(
      tenant,
      product
    );

    t.ok(directoriesFetched);
    t.match(directoriesFetched?.length, 2);

    t.end();
  });

  t.test('should be able to delete a directory', async (t) => {
    const tenant = 'tenant-2';
    const product = 'product-2';

    const { data: directory } = await directorySync.directories.create({
      ...directoryPayload,
      name: 'Directory 3',
      tenant,
      product,
    });

    if (!directory) {
      t.fail('Directory not created');
      return t.end();
    }

    await directorySync.directories.delete(directory.id);

    const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(
      tenant,
      product
    );

    t.match(directoriesFetched?.length, 0);

    t.end();
  });

  t.end();
});
