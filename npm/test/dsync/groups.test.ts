import { JacksonOption, DirectorySync } from '../../src/typings';
import tap from 'tap';
import directories from './data/directories';
import requests from './data/group-requests';
import groups from './data/groups';
import users from './data/users';
import { default as usersRequest } from './data/user-requests';

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

tap.teardown(async () => {
  process.exit(0);
});

tap.test('Directory groups / ', async (t) => {
  // Create a directory before starting the tests
  const { id: directoryId } = await directorySync.directories.create(directories[0]);

  let createdGroup: any;

  tap.beforeEach(async () => {
    // Create a group before each test
    const response = await directorySync.groupsRequest.handle(requests.create(directoryId, groups[0]));

    createdGroup = response.data;
  });

  tap.afterEach(async () => {
    // Delete the group after each test
    await directorySync.groups.delete(createdGroup.id);
  });

  t.test('Should be able to create a new group', async (t) => {
    t.ok(createdGroup);
    t.hasStrict(createdGroup, groups[0]);
    t.ok('id' in createdGroup);

    t.end();
  });

  t.test('Should be able to get the group by id', async (t) => {
    const { status, data } = await directorySync.groupsRequest.handle(
      requests.getById(directoryId, createdGroup.id)
    );

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data, createdGroup);
    t.hasStrict(data, groups[0]);

    t.end();
  });

  t.test('Should be able to get all groups', async (t) => {
    const { status, data } = await directorySync.groupsRequest.handle(requests.getAll(directoryId));

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data.Resources[0], createdGroup);
    t.hasStrict(data.Resources[0], groups[0]);
    t.equal(data.totalResults, 1);
    t.equal(data.Resources[0].members.length, 0);

    t.end();
  });

  t.test('Should be able to update the group name', async (t) => {
    const { status, data } = await directorySync.groupsRequest.handle(
      requests.updateById(directoryId, createdGroup.id, {
        displayName: 'Developers Updated',
      })
    );

    t.ok(data);
    t.equal(status, 200);
    t.equal(data.displayName, 'Developers Updated');

    t.end();
  });

  t.test('Should be able add a member to an existing group', async (t) => {
    const { data: user1 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[0])
    );

    const { data: user2 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[1])
    );

    const members = [
      {
        value: user1.id,
      },
      {
        value: user2.id,
      },
    ];

    const { status, data } = await directorySync.groupsRequest.handle(
      requests.addMembers(directoryId, createdGroup.id, {
        ...createdGroup,
        members,
      })
    );

    t.ok(data);
    t.equal(status, 200);

    t.end();
  });

  t.test('Should be able remove a member to an existing group', async (t) => {
    // const { status, data } = await directorySync.groupsRequest.handle(
    //   requests.removeMembers(directoryId, createdGroup.id, {
    //     ...groups[0],
    //     members: [],
    //   })
    // );

    t.end();
  });
});

// Add member
// Remove member
// Get the group, test member array
// Delete
