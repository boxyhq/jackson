import { IDirectorySyncController, Directory } from '../../src/typings';
import tap from 'tap';
import groups from './data/groups';
import users from './data/users';
import { default as usersRequest } from './data/user-requests';
import { default as groupsRequest } from './data/group-requests';
import { getFakeDirectory } from './data/directories';
import { jacksonOptions } from '../utils';

let directorySync: IDirectorySyncController;
let directory: Directory;
const fakeDirectory = getFakeDirectory();

tap.before(async () => {
  const jackson = await (await import('../../src/index')).default(jacksonOptions);

  directorySync = jackson.directorySyncController;

  const { data, error } = await directorySync.directories.create(fakeDirectory);

  if (error || !data) {
    tap.fail("Couldn't create a directory");
    return;
  }

  directory = data;
});

tap.teardown(async () => {
  // Delete the directory after test
  await directorySync.directories.delete(directory.id);

  process.exit(0);
});

tap.test('Directory groups / ', async (t) => {
  let createdGroup: any;

  tap.beforeEach(async () => {
    // Create a group before each test
    const { data } = await directorySync.requests.handle(groupsRequest.create(directory, groups[0]));

    createdGroup = data;
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
    const { status, data } = await directorySync.requests.handle(
      groupsRequest.getById(directory, createdGroup.id)
    );

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data, createdGroup);
    t.hasStrict(data, groups[0]);

    t.end();
  });

  t.test('Should be able to get the group by displayName', async (t) => {
    const { status, data } = await directorySync.requests.handle(
      groupsRequest.filterByDisplayName(directory, createdGroup.displayName)
    );

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data.Resources[0], createdGroup);
    t.hasStrict(data.Resources[0], groups[0]);
    t.equal(data.Resources.length, 1);

    t.end();
  });

  t.test('Should be able to get all groups', async (t) => {
    const { status, data } = await directorySync.requests.handle(groupsRequest.getAll(directory));

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data.Resources[0], createdGroup);
    t.hasStrict(data.Resources[0], groups[0]);
    t.equal(data.totalResults, 1);
    t.equal(data.Resources[0].members.length, 0);

    t.end();
  });

  t.test('Should be able to update the group name - POST request', async (t) => {
    const { status, data } = await directorySync.requests.handle(
      groupsRequest.updateById(directory, createdGroup.id, {
        displayName: 'Developers Updated',
      })
    );

    t.ok(data);
    t.equal(status, 200);
    t.equal(data.displayName, 'Developers Updated');

    t.end();
  });

  t.test('Should be able to update the group name - PATCH request', async (t) => {
    const { status, data } = await directorySync.requests.handle(
      groupsRequest.updateName(directory, createdGroup.id, {
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
    const { data: user1 } = await directorySync.requests.handle(usersRequest.create(directory, users[0]));

    const { data: user2 } = await directorySync.requests.handle(usersRequest.create(directory, users[1]));

    const { status, data } = await directorySync.requests.handle(
      groupsRequest.updateById(directory, createdGroup.id, {
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

    // Removing the user1 from the group (Body has the user2 id only)
    const { data: data1 } = await directorySync.requests.handle(
      groupsRequest.updateById(directory, createdGroup.id, {
        ...createdGroup,
        members: [
          {
            value: user2.id,
          },
        ],
      })
    );

    t.ok(data1);

    t.end();
  });

  t.test('Should be able add a member to an existing group - PATCH request', async (t) => {
    const { data: user1 } = await directorySync.requests.handle(usersRequest.create(directory, users[0]));

    const response1 = await directorySync.requests.handle(
      groupsRequest.addMembers(directory, createdGroup.id, [
        {
          value: user1.id,
        },
      ])
    );

    t.ok(response1.data);
    t.equal(response1.status, 200);

    // Add another member
    const { data: user2 } = await directorySync.requests.handle(usersRequest.create(directory, users[1]));

    // Fetch the group again
    const group = await directorySync.requests.handle(groupsRequest.getById(directory, createdGroup.id));

    // Add the second member
    group.data.members.push({ value: user2.id });

    const response2 = await directorySync.requests.handle(
      groupsRequest.addMembers(directory, createdGroup.id, group.data.members)
    );

    t.ok(response2.data);
    t.equal(response2.status, 200);

    // Clean up
    await directorySync.users.delete(user1.id);
    await directorySync.users.delete(user2.id);

    t.end();
  });

  t.test('Should be able remove a member from an existing group - PATCH request', async (t) => {
    const { data: user1 } = await directorySync.requests.handle(usersRequest.create(directory, users[0]));

    const { data: user2 } = await directorySync.requests.handle(usersRequest.create(directory, users[1]));

    // Add 2 members
    const response1 = await directorySync.requests.handle(
      groupsRequest.addMembers(directory, createdGroup.id, [
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
    const response2 = await directorySync.requests.handle(
      groupsRequest.removeMembers(
        directory,
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

    // Remove the second member
    const response3 = await directorySync.requests.handle(
      groupsRequest.removeMembers(
        directory,
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
    const { status } = await directorySync.requests.handle(
      groupsRequest.deleteById(directory, createdGroup.id)
    );

    t.equal(status, 200);

    // Try to get the group
    try {
      await directorySync.requests.handle(groupsRequest.getById(directory, createdGroup.id));
    } catch (e: any) {
      t.equal(e.statusCode, 404);
      t.equal(e.message, `Group with id ${createdGroup.id} not found.`);
    }

    t.end();
  });

  t.end();
});
