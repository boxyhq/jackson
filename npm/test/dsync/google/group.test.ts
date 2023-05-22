import tap from 'tap';

import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, DirectoryType, Directory } from '../../../src/typings';

let directorySyncController: IDirectorySyncController;

const directoryPayload = {
  tenant: 'boxyhq-1',
  product: 'saml-jackson-google',
  name: 'Directory 1',
  type: 'google-api' as DirectoryType,
  domain: 'boxyhq.com',
  webhook_url: 'https://webhook.site/55e98582-e92b-4e1b-a661-4e88a2b23d95',
  webhook_secret: '123',
  deactivated: false,
};

tap.before(async () => {
  const jacksonOptionsWithGoogle = {
    ...jacksonOptions,
    dsync: {
      google: {
        clientId: `${process.env.GOOGLE_CLIENT_ID}`,
        clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
        callbackUrl: `${process.env.GOOGLE_REDIRECT_URI}`,
      },
    },
  };

  const jackson = await (await import('../../../src/index')).default(jacksonOptionsWithGoogle);

  directorySyncController = jackson.directorySyncController;

  const { data } = await directorySyncController.directories.create(directoryPayload);

  if (!data) {
    throw new Error('Failed to create directory');
  }

  await directorySyncController.google.auth.setToken({
    directoryId: data.id,
    accessToken: `${process.env.ACCESS_TOKEN}`,
    refreshToken: `${process.env.REFRESH_TOKEN}`,
  });

  // directory = data;
});

tap.test('Google Groups', async (t) => {
  t.test('fetch groups', async (t) => {
    await directorySyncController.sync();

    t.end();
  });
});

tap.teardown(async () => {
  process.exit(0);
});
