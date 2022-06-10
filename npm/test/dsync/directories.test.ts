import type { JacksonError } from '../../src/controller/error';
import { JacksonOption, DirectorySync } from '../../src/typings';
import tap from 'tap';
import * as dbutils from '../../src/db/utils';
import directories from './data/directories';

const options = <JacksonOption>{
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  db: {
    engine: 'mem',
  },
};

let directorySync: DirectorySync;

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(options);

  directorySync = jackson.directorySync;
});

tap.afterEach(async () => {
  // Delete the directories after each test
  await Promise.all(
    directories.map(async (directory) => {
      const directoryId = dbutils.keyDigest(dbutils.keyFromParts(directory.tenant, directory.product));
      await directorySync.directories.delete(directoryId);
    })
  );
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Directories / ', async (t) => {
  t.test('should be able to create a directory', async (t) => {
    const newDirectory = await directorySync.directories.create(directories[0]);

    t.ok(newDirectory);
    t.hasStrict(newDirectory, directories[0]);
    t.type(newDirectory.scim, 'object');
    t.type(newDirectory.webhook, 'object');

    t.end();
  });

  t.test('should be able to get a directory', async (t) => {
    const newDirectory = await directorySync.directories.create(directories[0]);
    const directoryFetched = await directorySync.directories.get(newDirectory.id);

    t.ok(directoryFetched);
    t.hasStrict(directoryFetched, directories[0]);
    t.match(directoryFetched.id, newDirectory.id);

    t.end();
  });

  t.test('should be able to update a directory', async (t) => {
    const newDirectory = await directorySync.directories.create(directories[0]);

    const toUpdate = {
      name: 'BoxyHQ',
      webhook_url: 'https://my-cool-app.com/webhook',
      webhook_secret: 'secret',
      log_webhook_events: true,
    };

    const updatedDirectory = await directorySync.directories.update(newDirectory.id, toUpdate);

    t.ok(updatedDirectory);
    t.match(newDirectory.id, updatedDirectory.id);
    t.match(updatedDirectory.name, toUpdate.name);
    t.match(updatedDirectory.webhook.endpoint, toUpdate.webhook_url);
    t.match(updatedDirectory.webhook.secret, toUpdate.webhook_secret);
    t.match(updatedDirectory.log_webhook_events, toUpdate.log_webhook_events);

    t.end();
  });

  t.test('should be able to get a directory by tenant and product', async (t) => {
    const newDirectory = await directorySync.directories.create(directories[0]);

    const directoryFetched = await directorySync.directories.getByTenantAndProduct(
      newDirectory.tenant,
      newDirectory.product
    );

    t.ok(directoryFetched);
    t.hasStrict(directoryFetched, directories[0]);
    t.match(directoryFetched, newDirectory);

    t.end();
  });

  t.test('should be able to delete a directory', async (t) => {
    const newDirectory = await directorySync.directories.create(directories[0]);

    await directorySync.directories.delete(newDirectory.id);

    try {
      await directorySync.directories.get(newDirectory.id);
      t.fail('Should not be able to get a directory that was deleted');
    } catch (err) {
      const { message, statusCode } = err as JacksonError;

      t.equal(message, 'Directory configuration not found.');
      t.equal(statusCode, 404);
    }

    t.end();
  });

  t.test('should be able to validate the SCIM secret', async (t) => {
    const newDirectory = await directorySync.directories.create(directories[0]);

    const { secret } = newDirectory.scim;

    t.ok(newDirectory);
    t.ok(await directorySync.directories.validateAPISecret(newDirectory.id, secret));
    t.notOk(await directorySync.directories.validateAPISecret(newDirectory.id, 'wrong secret'));

    t.end();
  });

  t.test('should be able to get all directories', async (t) => {
    await directorySync.directories.create(directories[0]);
    await directorySync.directories.create(directories[1]);

    const directoriesList = await directorySync.directories.list({});

    t.ok(directoriesList);
    t.equal(directoriesList.length, 2);
    t.hasStrict(directoriesList[1], directories[0]);
    t.hasStrict(directoriesList[0], directories[1]);

    t.end();
  });

  t.end();
});
