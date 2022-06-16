import type { JacksonError } from '../../src/controller/error';
import { DirectorySync, Directory, DirectoryType } from '../../src/typings';
import tap from 'tap';
import { getFakeDirectory } from './data/directories';
import { getDatabaseOption } from '../utils';

let directorySync: DirectorySync;

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(getDatabaseOption());

  directorySync = jackson.directorySync;
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

    directory = await directorySync.directories.create(fakeDirectory);
  });

  t.test('should be able to create a directory', async (t) => {
    t.ok(directory);
    t.hasStrict(directory, fakeDirectory);
    t.type(directory.scim, 'object');
    t.type(directory.webhook, 'object');

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.test('should be able to get a directory', async (t) => {
    const directoryFetched = await directorySync.directories.get(directory.id);

    t.ok(directoryFetched);
    t.hasStrict(directoryFetched, fakeDirectory);
    t.match(directoryFetched.id, directory.id);

    await directorySync.directories.delete(directory.id);

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
      type: 'okta-saml' as DirectoryType,
    };

    let updatedDirectory = await directorySync.directories.update(directory.id, toUpdate);

    t.ok(updatedDirectory);
    t.match(directory.id, updatedDirectory.id);
    t.match(updatedDirectory.name, toUpdate.name);
    t.match(updatedDirectory.webhook.endpoint, toUpdate.webhook.endpoint);
    t.match(updatedDirectory.webhook.secret, toUpdate.webhook.secret);
    t.match(updatedDirectory.log_webhook_events, toUpdate.log_webhook_events);

    // Partial update
    updatedDirectory = await directorySync.directories.update(directory.id, {
      name: 'BoxyHQ 2',
      log_webhook_events: false,
    });

    t.ok(updatedDirectory);
    t.match(updatedDirectory.name, 'BoxyHQ 2');
    t.match(updatedDirectory.log_webhook_events, false);

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.test('should be able to get a directory by tenant and product', async (t) => {
    const directoryFetched = await directorySync.directories.getByTenantAndProduct(
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

    try {
      await directorySync.directories.get(directory.id);
      t.fail('Should not be able to get a directory that was deleted');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;

      t.equal(message, 'Directory configuration not found.');
      t.equal(statusCode, 404);
    }

    t.end();
  });

  t.test('should be able to validate the SCIM secret', async (t) => {
    const { secret } = directory.scim;

    t.ok(directory);
    t.ok(await directorySync.directories.validateAPISecret(directory.id, secret));
    t.notOk(await directorySync.directories.validateAPISecret(directory.id, 'wrong secret'));

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.test('should be able to get all directories', async (t) => {
    const directoriesList = await directorySync.directories.list({});

    t.ok(directoriesList);

    await directorySync.directories.delete(directory.id);

    t.end();
  });

  t.end();
});
