import tap from 'tap';

import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, DirectoryType, Directory } from '../../../src/typings';

let directory: Directory;
let directorySyncController: IDirectorySyncController;

const directoryPayload = {
  tenant: 'boxyhq',
  product: 'saml-jackson-google',
  name: 'Google Directory',
  type: 'google-api' as DirectoryType,
  webhook_url: 'https://example.com',
  webhook_secret: 'secret',
};

tap.before(async () => {
  directorySyncController = (await (await import('../../../src/index')).default(jacksonOptions))
    .directorySyncController;

  const { data } = await directorySyncController.directories.create(directoryPayload);

  if (!data) {
    throw new Error('Failed to create directory');
  }

  directory = data;
});

tap.test('Google Directory', async (t) => {
  t.test('generate the Google API authorization URL', async (t) => {
    const result = await directorySyncController.google.auth.generateAuthorizationUrl({
      directoryId: directory.id,
    });

    t.ok(result);
    t.strictSame(result.error, null);

    const parsedUrl = new URL(result.data?.authorizationUrl || '');

    t.strictSame(parsedUrl.origin, 'https://accounts.google.com');
    t.strictSame(parsedUrl.pathname, '/o/oauth2/v2/auth');
    t.strictSame(
      {
        access_type: parsedUrl.searchParams.get('access_type'),
        prompt: parsedUrl.searchParams.get('prompt'),
        response_type: parsedUrl.searchParams.get('response_type'),
        client_id: parsedUrl.searchParams.get('client_id'),
        redirect_uri: parsedUrl.searchParams.get('redirect_uri'),
        scope: parsedUrl.searchParams.get('scope'),
        state: parsedUrl.searchParams.get('state'),
      },
      {
        access_type: 'offline',
        prompt: 'consent',
        response_type: 'code',
        client_id: 'GOOGLE_CLIENT_ID',
        redirect_uri: `GOOGLE_REDIRECT_URI`,
        state: JSON.stringify({ directoryId: directory.id }),
        scope:
          'https://www.googleapis.com/auth/admin.directory.group.readonly https://www.googleapis.com/auth/admin.directory.group.member.readonly',
      }
    );

    t.end();
  });

  t.test('set access token and refresh token', async (t) => {
    const { data: updatedDirectory } = await directorySyncController.google.auth.setToken({
      directoryId: directory.id,
      accessToken: 'ACCESS_TOKEN',
      refreshToken: 'REFRESH_TOKEN',
    });

    t.ok(updatedDirectory);
    t.strictSame(updatedDirectory?.googleAuth?.access_token, 'ACCESS_TOKEN');
    t.strictSame(updatedDirectory?.googleAuth?.refresh_token, 'REFRESH_TOKEN');

    const { data: directoryFetched } = await directorySyncController.directories.get(directory.id);

    t.ok(directoryFetched);
    t.strictSame(directoryFetched?.googleAuth?.access_token, 'ACCESS_TOKEN');
    t.strictSame(directoryFetched?.googleAuth?.refresh_token, 'REFRESH_TOKEN');

    t.end();
  });
});

tap.teardown(async () => {
  process.exit(0);
});
