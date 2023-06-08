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

const fakeGoogleDirectory = {
  users: [
    {
      id: 'user123',
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
      etag: 'abcd1234',
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
      id: 'user456',
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
      etag: 'efgh5678',
      emails: [
        {
          address: 'john@example.com',
          type: 'home',
          customType: '',
          primary: true,
        },
      ],
    },
  ],

  groups: [
    {
      id: 'group123',
      email: 'group@example.com',
      name: 'Engineering Team',
      description: 'A group for the engineering department',
      adminCreated: true,
      directMembersCount: '10',
      kind: 'admin#directory#group',
      etag: 'abcd1234',
      aliases: ['eng-team@example.com', 'engineering@example.com'],
      nonEditableAliases: ['group123@example.com'],
    },
    {
      id: 'group456',
      email: 'sales-group@example.com',
      name: 'Sales Team',
      description: 'A group for the sales department',
      adminCreated: true,
      directMembersCount: '5',
      kind: 'admin#directory#group',
      etag: 'efgh5678',
      aliases: ['sales@example.com'],
      nonEditableAliases: ['sales-group456@example.com'],
    },
  ],
};

// Mock /admin/directory/v1/users
const mockUsersAPI = (users: any[]) => {
  const server = nock('https://admin.googleapis.com')
    .get('/admin/directory/v1/users')
    .query({
      maxResults: 200,
      domain: 'boxyhq.com',
    })
    .reply(200, { users });

  return server;
};

// Mock /admin/directory/v1/groups
const mockGroupsAPI = (groups: any[]) => {
  const server = nock('https://admin.googleapis.com')
    .get('/admin/directory/v1/groups')
    .query({
      maxResults: 200,
      domain: 'boxyhq.com',
    })
    .reply(200, { groups });

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

tap.test('Should be able to sync users and groups', async (t) => {
  const events: DirectorySyncEvent[] = [];

  // Create 2 users and 2 groups
  const serverUser = mockUsersAPI(fakeGoogleDirectory.users);
  const serverGroup = mockGroupsAPI(fakeGoogleDirectory.groups);

  await directorySyncController.sync(async (event: DirectorySyncEvent) => {
    events.push(event);
  });

  serverUser.done();
  serverGroup.done();

  t.strictSame(events.length, 4);

  t.strictSame(events[0].event, 'user.created');
  t.strictSame(events[0].data.raw, fakeGoogleDirectory.users[0]);

  t.strictSame(events[1].event, 'user.created');
  t.strictSame(events[1].data.raw, fakeGoogleDirectory.users[1]);

  t.strictSame(events[2].event, 'group.created');
  t.strictSame(events[2].data.raw, fakeGoogleDirectory.groups[0]);

  t.strictSame(events[3].event, 'group.created');
  t.strictSame(events[3].data.raw, fakeGoogleDirectory.groups[1]);

  t.end();
});

tap.test('Should be able to sync users and groups', async (t) => {
  const events: DirectorySyncEvent[] = [];

  // Update user
  fakeGoogleDirectory.users[0].name.givenName = 'Liz';

  // Delete user
  const deletedUser = fakeGoogleDirectory.users.splice(1, 1)[0];

  // Update group
  fakeGoogleDirectory.groups[0].name = 'Engineering';

  // Delete group
  const deletedGroup = fakeGoogleDirectory.groups.splice(1, 1)[0];

  const serverUser = mockUsersAPI(fakeGoogleDirectory.users);
  const serverGroup = mockGroupsAPI(fakeGoogleDirectory.groups);

  await directorySyncController.sync(async (event: DirectorySyncEvent) => {
    events.push(event);
  });

  serverUser.done();
  serverGroup.done();

  t.strictSame(events.length, 4);

  t.strictSame(events[0].event, 'user.updated');
  t.strictSame(events[0].data.raw, fakeGoogleDirectory.users[0]);

  t.strictSame(events[1].event, 'user.deleted');
  t.strictSame(events[1].data.raw, deletedUser);

  t.strictSame(events[2].event, 'group.updated');
  t.strictSame(events[2].data.raw, fakeGoogleDirectory.groups[0]);

  t.strictSame(events[3].event, 'group.deleted');
  t.strictSame(events[3].data.raw, deletedGroup);

  t.end();
});

// Add new user and group
tap.test('Should be able to sync users and groups', async (t) => {
  const events: DirectorySyncEvent[] = [];

  // Add new user
  const newUser = {
    ...fakeGoogleDirectory.users[0],
    id: 'user10000',
    primaryEmail: 'johndoe@example.com',
  };

  fakeGoogleDirectory.users.push(newUser);

  // Add new group
  const newGroup = {
    ...fakeGoogleDirectory.groups[0],
    id: 'group10000',
  };

  fakeGoogleDirectory.groups.push(newGroup);

  const serverUser = mockUsersAPI(fakeGoogleDirectory.users);
  const serverGroup = mockGroupsAPI(fakeGoogleDirectory.groups);

  await directorySyncController.sync(async (event: DirectorySyncEvent) => {
    events.push(event);
  });

  serverUser.done();
  serverGroup.done();

  t.strictSame(events.length, 2);

  t.strictSame(events[0].event, 'user.created');
  t.strictSame(events[0].data.raw, newUser);

  t.strictSame(events[1].event, 'group.created');
  t.strictSame(events[1].data.raw, newGroup);

  t.end();
});
