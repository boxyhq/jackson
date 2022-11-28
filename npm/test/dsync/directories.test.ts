import { DirectorySync, Directory, DirectoryType } from '../../src/typings';
import tap from 'tap';
import { getFakeDirectory } from './data/directories';
import { databaseOptions } from '../utils';

let directorySync: DirectorySync;

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(databaseOptions);

  directorySync = jackson.directorySyncController;
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Directories / ', async (t) => {
  let directory: Directory;
  let fakeDirectory: Directory;

  t.beforeEach(async () => {
    // Create a directory before each test
    // t.afterEach() is not working for some reason, so we need to manually delete the directory after each test

    fakeDirectory = getFakeDirectory();

    const { data, error } = await directorySync.directories.create(fakeDirectory);

    if (error || !data) {
      t.fail("Couldn't create a directory");
      return;
    }

    directory = data;
  });

  t.test('should be able to create a directory', async (t) => {
    t.ok(directory);
    t.hasStrict(directory, fakeDirectory);
    t.type(directory.scim, 'object');
    t.type(directory.webhook, 'object');

    await directorySync.directories.delete(directory.id);

    t.end();
  });

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

  t.test('should be able to get a directory', async (t) => {
    const { data: directoryFetched } = await directorySync.directories.get(directory.id);

    t.ok(directoryFetched);
    t.hasStrict(directoryFetched, fakeDirectory);
    t.match(directoryFetched?.id, directory.id);

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.test("should not be able to get a directory that doesn't exist", async (t) => {
    const { data, error } = await directorySync.directories.get('fake-id');

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

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.test('should be able to get a directory by tenant and product', async (t) => {
    const { data: directoryFetched } = await directorySync.directories.getByTenantAndProduct(
      directory.tenant,
      directory.product
    );

    t.ok(directoryFetched);
    t.hasStrict(directoryFetched, fakeDirectory);
    t.match(directoryFetched, directory);

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.test('should be able to delete a directory', async (t) => {
    await directorySync.directories.delete(directory.id);

    const { data } = await directorySync.directories.get(directory.id);

    t.notOk(data);

    t.end();
  });

  t.test('should be able to get all directories', async (t) => {
    const directoriesList = await directorySync.directories.list({});

    t.ok(directoriesList);

    await directorySync.directories.delete(directory.id);

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

  t.end();
});
