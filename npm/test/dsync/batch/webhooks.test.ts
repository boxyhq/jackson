import tap from 'tap';

import users from '../data/users';
import requests from '../data/user-requests';
import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, Directory } from '../../../src/typings';

let directorySync: IDirectorySyncController;

const directory1Payload = {
  tenant: 'boxyhq-1',
  product: 'saml-jackson',
  type: 'okta-scim-v2' as Directory['type'],
  webhook_url: 'https://webhook.site/866f8a46-27a9-465e-9703-28732a1f0e28',
  webhook_secret: 'secret',
};

const directory2Payload = {
  tenant: 'boxyhq-2',
  product: 'saml-jackson',
  type: 'okta-scim-v2' as Directory['type'],
  webhook_url: 'https://webhook.site/866f8a46-27a9-465e-9703-28732a1f0e28',
  webhook_secret: 'secret',
};

tap.before(async () => {
  const options = {
    ...jacksonOptions,
    dsync: {
      webhookBatchSize: 2,
    },
  };

  const jackson = await (await import('../../../src/index')).default(options);

  directorySync = jackson.directorySyncController;

  const { data: directory1 } = await directorySync.directories.create({
    ...directory1Payload,
  });

  const { data: directory2 } = await directorySync.directories.create({
    ...directory2Payload,
  });

  if (!directory1 || !directory2) {
    throw new Error('Failed to create directories');
  }

  const eventCallback = directorySync.events.callback;

  // Add some users to generate events
  await directorySync.requests.handle(requests.create(directory1, users[0]), eventCallback);
  await directorySync.requests.handle(requests.create(directory1, users[1]), eventCallback);
  await directorySync.requests.handle(requests.create(directory2, users[1]), eventCallback);
  await directorySync.requests.handle(requests.create(directory2, users[0]), eventCallback);
});

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Batch send dsync events', async (t) => {
  // Retrieve the events
  let response = await directorySync.events.batch.getAll();

  t.equal(response.data.length, 4);

  // Process the events
  await directorySync.events.batch.process();

  // Retrieve the events again
  response = await directorySync.events.batch.getAll();

  t.equal(response.data.length, 0);

  t.end();
});

// Test cases
// 1. Test events are ordered by createdAt in ascending order
// 3. Test events are marked as failed if the directory is not found
// 4. Test events are marked as failed if the webhook is not found
