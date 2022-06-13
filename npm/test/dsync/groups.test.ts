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

  t.test('Should be able to update the group name - POST request', async (t) => {
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

  t.test('Should be able to update the group name - PATCH request', async (t) => {
    const { status, data } = await directorySync.groupsRequest.handle(
      requests.updateName(directoryId, createdGroup.id, {
        ...createdGroup,
        displayName: 'Developers Updated',
      })
    );

    t.ok(data);
    t.equal(status, 200);
    t.equal(data.displayName, 'Developers Updated');

    t.end();
  });

  t.test('Should be able to add or remove the group members - PUT request', async (t) => {
    const { data: user1 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[0])
    );

    const { data: user2 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[1])
    );

    const { status, data } = await directorySync.groupsRequest.handle(
      requests.updateById(directoryId, createdGroup.id, {
        ...createdGroup,
        members: [
          {
            value: user1.id,
          },
          {
            value: user2.id,
          },
        ],
      })
    );

    t.ok(data);
    t.equal(status, 200);
    t.equal(data.members.length, 2);
    t.equal(data.members[0].value, user1.id);
    t.equal(data.members[1].value, user2.id);

    // Removing the user1 from the group (Body has the user2 id only)
    const { data: data1 } = await directorySync.groupsRequest.handle(
      requests.updateById(directoryId, createdGroup.id, {
        ...createdGroup,
        members: [
          {
            value: user2.id,
          },
        ],
      })
    );

    t.ok(data1);
    t.equal(data1.members.length, 1);
    t.equal(data1.members[0].value, user2.id);

    t.end();
  });

  t.test('Should be able add a member to an existing group - PATCH request', async (t) => {
    const { data: user1 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[0])
    );

    const response1 = await directorySync.groupsRequest.handle(
      requests.addMembers(directoryId, createdGroup.id, [
        {
          value: user1.id,
        },
      ])
    );

    t.ok(response1.data);
    t.equal(response1.status, 200);
    t.equal(response1.data.members.length, 1);
    t.equal(response1.data.members[0].value, user1.id);

    // Add another member
    const { data: user2 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[1])
    );

    // Fetch the group again
    const group = await directorySync.groupsRequest.handle(requests.getById(directoryId, createdGroup.id));

    // Add the second member
    group.data.members.push({ value: user2.id });

    const response2 = await directorySync.groupsRequest.handle(
      requests.addMembers(directoryId, createdGroup.id, group.data.members)
    );

    t.ok(response2.data);
    t.equal(response2.status, 200);
    t.equal(response2.data.members.length, 2);
    t.equal(response2.data.members[0].value, user1.id);
    t.equal(response2.data.members[1].value, user2.id);

    // Clean up
    await directorySync.users.delete(user1.id);
    await directorySync.users.delete(user2.id);

    t.end();
  });

  t.test('Should be able remove a member from an existing group - PATCH request', async (t) => {
    const { data: user1 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[0])
    );

    const { data: user2 } = await directorySync.usersRequest.handle(
      usersRequest.create(directoryId, users[1])
    );

    // Add 2 members
    const response1 = await directorySync.groupsRequest.handle(
      requests.addMembers(directoryId, createdGroup.id, [
        {
          value: user1.id,
        },
        {
          value: user2.id,
        },
      ])
    );

    t.ok(response1.data);
    t.equal(response1.status, 200);

    // Remove the first member
    const response2 = await directorySync.groupsRequest.handle(
      requests.removeMembers(
        directoryId,
        createdGroup.id,
        [
          {
            value: user1.id,
          },
        ],
        'members'
      )
    );

    t.ok(response2.data);
    t.equal(response2.status, 200);
    t.equal(response2.data.members.length, 1);
    t.equal(response2.data.members[0].value, user2.id);

    // Remove the second member
    const response3 = await directorySync.groupsRequest.handle(
      requests.removeMembers(
        directoryId,
        createdGroup.id,
        [
          {
            value: user2.id,
          },
        ],
        `members[value eq "${user2.id}"]`
      )
    );

    t.ok(response3.data);
    t.equal(response3.status, 200);
    t.equal(response3.data.members.length, 0);

    // Clean up
    await directorySync.users.delete(user1.id);
    await directorySync.users.delete(user2.id);

    t.end();
  });

  t.test('Should be able to delete a group', async (t) => {
    const { status } = await directorySync.groupsRequest.handle(
      requests.deleteById(directoryId, createdGroup.id)
    );

    t.equal(status, 200);

    // Try to get the group
    try {
      await directorySync.groupsRequest.handle(requests.getById(directoryId, createdGroup.id));
    } catch (e: any) {
      t.equal(e.statusCode, 404);
      t.equal(e.message, `Group with id ${createdGroup.id} not found.`);
    }

    t.end();
  });
});
