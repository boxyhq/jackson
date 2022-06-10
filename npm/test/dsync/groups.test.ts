import { JacksonOption, DirectorySync } from '../../src/typings';
import tap from 'tap';
import directories from './data/directories';
import requests from './data/group-requests';
import groups from './data/groups';

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
});
