import { IDirectorySyncController, Directory } from '../../src/typings';
import tap from 'tap';
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
  process.exit(0);
});

tap.test('RequestHandler', async (t) => {
  t.teardown(async () => {
    await directorySync.directories.delete(directory.id);
  });

  t.test('Should return 404, not throw, for a request with no resourceType', async (t) => {
    const { status } = await directorySync.requests.handle({
      method: 'GET',
      body: undefined,
      directoryId: directory.id,
      resourceType: undefined as unknown as string,
      resourceId: undefined,
      apiSecret: directory.scim.secret,
      query: {},
    });

    t.equal(status, 404);
  });
});
