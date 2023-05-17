import tap from 'tap';

import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, DirectoryType, Directory } from '../../../src/typings';

let directory: Directory;
let directorySyncController: IDirectorySyncController;

const directoryPayload = {
  tenant: 'boxyhq-1',
  product: 'saml-jackson-google',
  name: 'Google Directory',
  type: 'google-scim-v2' as DirectoryType,
  webhook_url: 'https://example.com',
  webhook_secret: 'secret',
  domain: 'boxyhq.com',
};

tap.before(async () => {
  directorySyncController = (await (await import('../../../src/index')).default(jacksonOptions))
    .directorySyncController;

  const { data } = await directorySyncController.directories.create(directoryPayload);

  if (!data) {
    throw new Error('Failed to create directory');
  }

  await directorySyncController.google.auth.setToken({
    directoryId: data.id,
    accessToken: '',
    refreshToken: '',
  });

  directory = data;
});

tap.test('Google Groups', async (t) => {
  t.test('fetch groups', async (t) => {
    // const response = await directorySyncController.sync();

    // const { data: updatedDirectory } = await directorySyncController.google.oauth.setToken({
    //   directoryId: directory.id,
    //   accessToken: 'ACCESS_TOKEN',
    //   refreshToken: 'REFRESH_TOKEN',
    // });

    // t.ok(updatedDirectory);
    // t.strictSame(updatedDirectory?.googleAuth?.access_token, 'ACCESS_TOKEN');
    // t.strictSame(updatedDirectory?.googleAuth?.refresh_token, 'REFRESH_TOKEN');

    // const { data: directoryFetched } = await directorySyncController.directories.get(directory.id);

    // t.ok(directoryFetched);
    // t.strictSame(directoryFetched?.googleAuth?.access_token, 'ACCESS_TOKEN');
    // t.strictSame(directoryFetched?.googleAuth?.refresh_token, 'REFRESH_TOKEN');

    t.end();
  });
});

tap.teardown(async () => {
  process.exit(0);
});
