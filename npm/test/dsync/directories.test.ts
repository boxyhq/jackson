import { IDirectorySyncController, DirectoryType, Directory } from '../../src/typings';
import tap from 'tap';
import { jacksonOptions } from '../utils';
import { isConnectionActive } from '../../src/controller/utils';

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
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('directories.', async (t) => {
  t.afterEach(async () => {
    const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(
      tenant,
      product
    );

    if (!directoriesFetched) {
      return;
    }

    // Delete all directories
    for (const directory of directoriesFetched) {
      await directorySync.directories.delete(directory.id);
    }
  });

  t.test('create()', async (t) => {
    t.test('create a directory with all required params', async (t) => {
      const { data: directory } = await directorySync.directories.create(directoryPayload);

      tap.ok(directory);
      tap.strictSame(directory?.tenant, tenant);
      tap.strictSame(directory?.product, product);
      tap.strictSame(directory?.name, directoryPayload.name);
      tap.strictSame(directory?.type, directoryPayload.type);
      tap.strictSame(directory?.webhook.endpoint, directoryPayload.webhook_url);
      tap.strictSame(directory?.webhook.secret, directoryPayload.webhook_secret);
      tap.strictSame(directory?.log_webhook_events, false);

      t.end();
    });

    t.test('generate a name using tenant and product if name is not provided', async (t) => {
      const { data: directory } = await directorySync.directories.create({
        ...directoryPayload,
        name: undefined,
      });

      tap.ok(directory);
      tap.strictSame(directory?.name, `scim-${tenant}-${product}`);

      t.end();
    });

    t.test('use generic-scim-v2 type if type is not provided', async (t) => {
      const { data: directory } = await directorySync.directories.create({
        ...directoryPayload,
        type: undefined,
      });

      tap.ok(directory);
      tap.strictSame(directory?.type, 'generic-scim-v2');

      t.end();
    });

    t.test('should not be able to create a directory without tenant or product', async (t) => {
      const { data: directory, error } = await directorySync.directories.create({
        ...directoryPayload,
        tenant: '',
        product: '',
      });

      tap.notOk(directory);
      tap.ok(error);
      tap.strictSame(error?.code, 400);
      tap.strictSame(error?.message, 'Missing required parameters.');

      t.end();
    });

    t.test('should not be able to create a directory with invalid type', async (t) => {
      const { data: directory, error } = await directorySync.directories.create({
        ...directoryPayload,
        type: 'invalid-type' as DirectoryType,
      });

      tap.notOk(directory);
      tap.ok(error);
      tap.strictSame(error?.code, 400);
      tap.strictSame(error?.message, 'Invalid directory type.');

      t.end();
    });

    t.test('create multiple directories for same tenant and product', async (t) => {
      const { data: directory1 } = await directorySync.directories.create({
        ...directoryPayload,
        name: 'Directory 1',
      });

      const { data: directory2 } = await directorySync.directories.create({
        ...directoryPayload,
        name: 'Directory 2',
      });

      tap.ok(directory1);
      tap.ok(directory2);
      tap.strictSame(directory1?.tenant, tenant);
      tap.strictSame(directory1?.product, product);
      tap.strictSame(directory2?.tenant, tenant);
      tap.strictSame(directory2?.product, product);

      // Fetch the directories
      const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(
        tenant,
        product
      );

      tap.ok(directoriesFetched);
      tap.strictSame(directoriesFetched?.length, 2);

      t.end();
    });

    t.end();
  });

  t.test('get()', async (t) => {
    let directory: Directory;

    t.before(async () => {
      const { data } = await directorySync.directories.create(directoryPayload);

      if (!data) {
        t.fail("Couldn't create a directory");
        return;
      }

      directory = data;
    });

    t.test('get a directory by ID', async (t) => {
      const { data: directoryFetched } = await directorySync.directories.get(directory.id);

      t.ok(directoryFetched);
      t.strictSame(directoryFetched, directory);
      t.match(directoryFetched?.id, directory.id);

      t.end();
    });

    t.test('should not be able to get a directory that does not exist', async (t) => {
      const { data: directoryFetched, error } = await directorySync.directories.get('invalid-id');

      t.notOk(directoryFetched);
      t.ok(error);
      t.strictSame(error?.code, 404);
      t.strictSame(error?.message, 'Directory configuration not found.');

      t.end();
    });

    t.test('should not be able to get a directory without an id', async (t) => {
      const { data: directoryFetched, error } = await directorySync.directories.get('');

      t.notOk(directoryFetched);
      t.ok(error);
      t.strictSame(error?.code, 400);
      t.strictSame(error?.message, 'Missing required parameters.');

      t.end();
    });

    t.end();
  });

  t.test('getByTenantAndProduct()', async (t) => {
    let directory: Directory;

    t.before(async () => {
      const { data } = await directorySync.directories.create(directoryPayload);

      if (!data) {
        t.fail("Couldn't create a directory");
        return;
      }

      directory = data;
    });

    t.test('get a directory by tenant and product', async (t) => {
      const { data: directoriesFetched } = await directorySync.directories.getByTenantAndProduct(
        tenant,
        product
      );

      t.ok(directoriesFetched);
      t.strictSame(directoriesFetched, [directory]);
      t.match(directoriesFetched?.length, 1);

      t.end();
    });

    t.test('should not be able to get a directory that does not exist', async (t) => {
      const { data: directoriesFetched, error } = await directorySync.directories.getByTenantAndProduct(
        'invalid-tenant',
        'invalid-product'
      );

      t.ok(directoriesFetched);
      t.notOk(error);
      t.strictSame(directoriesFetched?.length, 0);

      t.end();
    });

    t.end();
  });

  t.test('update()', async (t) => {
    let directory: Directory;

    t.beforeEach(async () => {
      const { data } = await directorySync.directories.create(directoryPayload);

      if (!data) {
        t.fail("Couldn't create a directory");
        return;
      }

      directory = data;
    });

    t.test('should be able to update a directory', async (t) => {
      const toUpdate = {
        name: 'Directory Updated',
        webhook: {
          endpoint: 'https://my-cool-app.com/webhook',
          secret: 'secret',
        },
        log_webhook_events: true,
        type: 'azure-scim-v2' as DirectoryType,
      };

      const { data: updatedDirectory } = await directorySync.directories.update(directory.id, {
        ...toUpdate,
      });

      t.ok(updatedDirectory);
      t.same(directory.id, updatedDirectory?.id);
      t.same(updatedDirectory?.name, toUpdate.name);
      t.same(updatedDirectory?.log_webhook_events, toUpdate.log_webhook_events);
      t.same(updatedDirectory?.type, toUpdate.type);
      t.match(updatedDirectory?.webhook.endpoint, toUpdate.webhook?.endpoint);
      t.match(updatedDirectory?.webhook.secret, toUpdate.webhook?.secret);

      // Check that the directory was updated
      const { data: directoryFetched } = await directorySync.directories.get(directory.id);

      t.ok(directoryFetched);
      t.same(directoryFetched?.id, updatedDirectory?.id);
      t.same(directoryFetched?.name, toUpdate.name);
      t.same(directoryFetched?.log_webhook_events, toUpdate.log_webhook_events);
      t.same(directoryFetched?.type, toUpdate.type);
      t.match(directoryFetched?.webhook.endpoint, toUpdate.webhook?.endpoint);
      t.match(directoryFetched?.webhook.secret, toUpdate.webhook?.secret);

      t.end();
    });

    t.test('must provide a directory id', async (t) => {
      const { error } = await directorySync.directories.update('', {
        name: 'Directory Updated',
      });

      t.ok(error);
      t.same(error?.code, 400);
      t.same(error?.message, 'Missing required parameters.');

      t.end();
    });

    t.end();
  });

  t.test('delete()', async (t) => {
    let directory: Directory;

    t.beforeEach(async () => {
      const { data } = await directorySync.directories.create(directoryPayload);

      if (!data) {
        t.fail("Couldn't create a directory");
        return;
      }

      directory = data;
    });

    t.test('should be able to delete a directory by ID', async (t) => {
      await directorySync.directories.delete(directory.id);

      const { data: directoryFetched } = await directorySync.directories.get(directory.id);

      t.notOk(directoryFetched);

      t.end();
    });

    t.end();
  });

  t.test('getAll()', async (t) => {
    // Create 2 directories
    await directorySync.directories.create(directoryPayload);
    await directorySync.directories.create({ ...directoryPayload, name: 'Directory 2' });

    const { data: directories } = await directorySync.directories.getAll();

    t.ok(directories);
    t.match(directories?.length, 2);
  });

  t.test('Activate and deactivate the connection', async (t) => {
    const { data: directory } = await directorySync.directories.create(directoryPayload);

    if (!directory) {
      t.fail("Couldn't create a directory");
      return;
    }

    // Deactivate the connection
    await directorySync.directories.update(directory.id, {
      deactivated: true,
    });

    // Get the connection
    const { data: directoryFetched } = await directorySync.directories.get(directory.id);

    t.match(directoryFetched?.deactivated, true);
    t.match(isConnectionActive(directoryFetched!), false);

    // Activate the connection
    await directorySync.directories.update(directory.id, {
      deactivated: false,
    });

    // Get the connection
    const { data: directoryFetched2 } = await directorySync.directories.get(directory.id);

    t.match(directoryFetched2?.deactivated, false);
    t.match(isConnectionActive(directoryFetched2!), true);

    t.end();
  });

  t.end();
});
