import { JacksonOption, DirectorySync } from '../../src/typings';
import tap from 'tap';
import users from './data/users';
import directories from './data/directories';
import requests from './data/user-requests';

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

tap.test('Directory users / ', async (t) => {
  // Create a directory before starting the tests
  const { id: directoryId } = await directorySync.directories.create(directories[0]);
  let createdUser: any;

  tap.beforeEach(async () => {
    // Create a user before each test
    const response = await directorySync.usersRequest.handle(requests.create(directoryId, users[0]));

    createdUser = response.data;
  });

  tap.afterEach(async () => {
    // Delete the user after each test
    await directorySync.users.delete(createdUser.id);
  });

  t.test('Should be able to get the user by userName', async (t) => {
    const { status, data } = await directorySync.usersRequest.handle(
      requests.filterByUsername(directoryId, createdUser.userName)
    );

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data.Resources[0], createdUser);
    t.hasStrict(data.Resources[0], users[0]);

    t.end();
  });

  t.test('Should be able to get the user by id', async (t) => {
    const { status, data } = await directorySync.usersRequest.handle(
      requests.getById(directoryId, createdUser.id)
    );

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data, users[0]);

    t.end();
  });

  t.test('Should be able to update the user using PUT request', async (t) => {
    const toUpdate = {
      ...users[0],
      name: {
        givenName: 'Jackson Updated',
        familyName: 'M',
      },
      city: 'New York',
    };

    const { status, data: updatedUser } = await directorySync.usersRequest.handle(
      requests.updateById(directoryId, createdUser.id, toUpdate)
    );

    t.ok(updatedUser);
    t.equal(status, 200);
    t.hasStrict(updatedUser, toUpdate);
    t.match(updatedUser.city, toUpdate.city);

    // Make sure the user was updated
    const { data: user } = await directorySync.usersRequest.handle(
      requests.getById(directoryId, createdUser.id)
    );

    t.ok(user);
    t.hasStrict(user, toUpdate);
    t.match(user.city, toUpdate.city);
  });

  t.test('Should be able to delete the user using PATCH request', async (t) => {
    const toUpdate = {
      ...users[0],
      active: false,
    };

    const { status, data } = await directorySync.usersRequest.handle(
      requests.updateOperationById(directoryId, createdUser.id)
    );

    t.ok(data);
    t.equal(status, 200);
    t.hasStrict(data, toUpdate);

    // Make sure the user was deleted
    const { data: user } = await directorySync.usersRequest.handle(
      requests.filterByUsername(directoryId, data.userName)
    );

    t.hasStrict(user.Resources, []);
    t.hasStrict(user.totalResults, 0);
  });

  t.test('Should delete the user if active:false', async (t) => {
    const toUpdate = {
      ...users[0],
      active: false,
    };

    const { status, data: updatedUser } = await directorySync.usersRequest.handle(
      requests.updateById(directoryId, createdUser.id, toUpdate)
    );

    t.ok(updatedUser);
    t.equal(status, 200);
    t.hasStrict(updatedUser, toUpdate);

    // Make sure the user was deleted
    const { data: user } = await directorySync.usersRequest.handle(
      requests.filterByUsername(directoryId, createdUser.userName)
    );

    t.hasStrict(user.Resources, []);
    t.hasStrict(user.totalResults, 0);
  });

  t.test('Should be able to fetch all users', async (t) => {
    const { status, data } = await directorySync.usersRequest.handle(requests.getAll(directoryId));

    t.ok(data);
    t.equal(status, 200);
    t.ok(data.Resources);
    t.equal(data.Resources.length, 1);
    t.hasStrict(data.Resources[0], users[0]);
    t.equal(data.totalResults, 1);

    t.end();
  });

  t.test('Should be able to delete the user', async (t) => {
    const { status, data } = await directorySync.usersRequest.handle(
      requests.deleteById(directoryId, createdUser.id)
    );

    t.equal(status, 200);
    t.ok(data);
    t.strictSame(data, createdUser);

    // Make sure the user was deleted
    const { data: user } = await directorySync.usersRequest.handle(
      requests.filterByUsername(directoryId, createdUser.userName)
    );

    t.hasStrict(user.Resources, []);
    t.hasStrict(user.totalResults, 0);
  });

  t.end();
});
