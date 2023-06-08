import tap from 'tap';
import nock from 'nock';
import type { DirectorySyncEvent } from '@boxyhq/saml-jackson';

import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, DirectoryType, Directory } from '../../../src/typings';

let directory: Directory;
let directorySyncController: IDirectorySyncController;

const directoryPayload = {
  tenant: 'boxyhq',
  product: 'saml-jackson-google',
  name: 'Google Directory',
  type: 'google' as DirectoryType,
  google_domain: 'boxyhq.com',
  google_access_token: 'access_token',
  google_refresh_token: 'refresh_token',
};

const users = [
  {
    id: '100',
    primaryEmail: 'elizabeth@example.com',
    name: {
      givenName: 'Elizabeth',
      familyName: 'Smith',
    },
    suspended: false,
    password: 'password',
    hashFunction: 'SHA-1',
    changePasswordAtNextLogin: false,
    ipWhitelisted: false,
    emails: [
      {
        address: 'liz@example.com',
        type: 'home',
        customType: '',
        primary: true,
      },
    ],
  },
  {
    id: '200',
    primaryEmail: 'john@example.com',
    name: {
      givenName: 'John',
      familyName: 'Doe',
    },
    suspended: false,
    password: 'password',
    hashFunction: 'SHA-1',
    changePasswordAtNextLogin: false,
    ipWhitelisted: false,
    emails: [
      {
        address: 'john@example.com',
        type: 'home',
        customType: '',
        primary: true,
      },
    ],
  },
];

// Mock /admin/directory/v1/users
const mockUsers = (users: any[]) => {
  const server = nock('https://admin.googleapis.com')
    .get('/admin/directory/v1/users')
    .query({
      maxResults: 200,
      domain: 'boxyhq.com',
    })
    .reply(200, { users });

  return server;
};

tap.before(async () => {
  directorySyncController = (await (await import('../../../src/index')).default(jacksonOptions))
    .directorySyncController;

  const { data, error } = await directorySyncController.directories.create(directoryPayload);

  if (error) {
    throw error;
  }

  directory = data;
});

tap.teardown(async () => {
  process.exit(0);
});

// Create 2 new users
tap.test('New user should be created and trigger `user.created` event', async (t) => {
  const events: DirectorySyncEvent[] = [];

  const server = mockUsers(users);

  await directorySyncController.sync(async (event: DirectorySyncEvent) => {
    events.push(event);
  });

  server.done();

  t.strictSame(events.length, 2);

  t.strictSame(events[0].event, 'user.created');
  t.strictSame(events[0].data.raw, users[0]);

  t.strictSame(events[1].event, 'user.created');
  t.strictSame(events[1].data.raw, users[1]);

  // Check that the users were created in the database
  const { data: usersFetched } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .getAll({
      directoryId: directory.id,
    });

  t.strictSame(usersFetched?.length, 2);

  const firstUser = usersFetched?.find((user) => user.id === users[0].id);
  const secondUser = usersFetched?.find((user) => user.id === users[1].id);

  t.ok(firstUser);
  t.strictSame(firstUser?.email, users[0].primaryEmail);

  t.ok(secondUser);
  t.strictSame(secondUser?.email, users[1].primaryEmail);

  t.end();
});

// Update the first user only
tap.test('Existing user should be updated and trigger `user.updated` event', async (t) => {
  const events: DirectorySyncEvent[] = [];

  // Update the user's name
  users[0].name.givenName = 'Liz';

  const server = mockUsers(users);

  await directorySyncController.sync(async (event: DirectorySyncEvent) => {
    events.push(event);
  });

  server.done();

  t.strictSame(events.length, 1);

  t.strictSame(events[0].event, 'user.updated');
  t.strictSame(events[0].data.raw, users[0]);

  // Check that the user was updated in the database
  const { data: userFetched } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .get(users[0].id);

  t.ok(userFetched);
  t.strictSame(userFetched?.first_name, 'Liz');

  t.end();
});

// Delete the second user only
tap.test('Existing user should be deleted and trigger `user.deleted` event', async (t) => {
  const events: DirectorySyncEvent[] = [];

  const server = mockUsers([users[0]]);

  await directorySyncController.sync(async (event: DirectorySyncEvent) => {
    events.push(event);
  });

  server.done();

  t.strictSame(events.length, 1);
  t.strictSame(events[0].event, 'user.deleted');
  t.strictSame(events[0].data.raw, users[1]);

  // Check that the user was deleted from the database
  const { data: userFetched } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .get(users[1].id);

  t.strictSame(userFetched, null);

  t.end();
});
