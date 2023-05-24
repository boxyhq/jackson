import tap from 'tap';
import lodash from 'lodash';

import { jacksonOptions } from '../../utils';
import { IDirectorySyncController, DirectoryType, Directory } from '../../../src/typings';

let directorySyncController: IDirectorySyncController;

const directoryPayload = {
  tenant: 'boxyhq-1',
  product: 'saml-jackson-google',
  name: 'Directory 1',
  type: 'google' as DirectoryType,
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

  await directorySyncController.directoryProviders.google.auth.setToken({
    directoryId: data.id,
    accessToken: `${process.env.ACCESS_TOKEN}`,
    refreshToken: `${process.env.REFRESH_TOKEN}`,
  });

  // directory = data;
});

tap.test('Google Groups', async (t) => {
  t.test('fetch groups', async (t) => {
    const existingUser = {
      kind: 'admin#directory#user',
      id: '107130779649255553459',
      etag: '"ULjLpRt-rFHjv0_nmsRibIgYdlOnAOLNVsyKVeTSiyU/tuWLOjaN6j8n7IQc9-SbODitN80"',
      primaryEmail: 'utkarsh@boxyhq.com',
      name: {
        givenName: 'Utkarsh',
        familyName: 'Mehta',
        fullName: 'Utkarsh Mehta',
      },
      isAdmin: false,
      isDelegatedAdmin: false,
      lastLoginTime: '2023-05-18T09:41:16.000Z',
      creationTime: '2022-01-31T10:51:08.000Z',
      agreedToTerms: true,
      suspended: false,
      archived: false,
      changePasswordAtNextLogin: false,
      ipWhitelisted: false,
      emails: [
        {
          address: 'utkarsh.mehta2612@gmail.com',
          type: 'work',
        },
        {
          address: 'utkarsh@boxyhq.com',
          primary: true,
        },
        {
          address: 'utkarsh@boxyhq.com.test-google-a.com',
        },
      ],
      languages: [
        {
          languageCode: 'en-GB',
          preference: 'preferred',
        },
      ],
      nonEditableAliases: ['utkarsh@boxyhq.com.test-google-a.com'],
      customerId: 'C00ok5q7m',
      orgUnitPath: '/',
      isMailboxSetup: true,
      isEnrolledIn2Sv: true,
      isEnforcedIn2Sv: false,
      includeInGlobalAddressList: true,
      thumbnailPhotoUrl:
        'https://lh3.googleusercontent.com/a-/ACB-R5SQxSXGs6n7h6o2su3Gbyx34SIARdkAmI3FH497=s96-c',
      thumbnailPhotoEtag: '"ULjLpRt-rFHjv0_nmsRibIgYdlOnAOLNVsyKVeTSiyU/lg1koWn3aD--fQ6_RC2OHXs1P-c"',
      recoveryEmail: 'ukrocks.mehta@gmail.com',
      recoveryPhone: '+919168054254',
    };

    const userFromProvider = {
      kind: 'admin#directory#user',
      id: '107130779649255553459',
      etag: '"ULjLpRt-rFHjv0_nmsRibIgYdlOnAOLNVsyKVeTSiyU/tuWLOjaN6j8n7IQc9-SbODitN80"',
      primaryEmail: 'utkarsh@boxyhq.com',
      name: {
        givenName: 'Utkarsh',
        familyName: 'Mehta',
        fullName: 'Utkarsh Mehta',
      },
      isAdmin: false,
      isDelegatedAdmin: false,
      lastLoginTime: '2023-05-18T09:41:16.000Z',
      creationTime: '2022-01-31T10:51:08.000Z',
      agreedToTerms: true,
      suspended: false,
      archived: false,
      changePasswordAtNextLogin: false,
      ipWhitelisted: false,
      emails: [
        { address: 'utkarsh.mehta2612@gmail.com', type: 'work' },
        { address: 'utkarsh@boxyhq.com', primary: true },
        { address: 'utkarsh@boxyhq.com.test-google-a.com' },
      ],
      languages: [{ languageCode: 'en-GB', preference: 'preferred' }],
      nonEditableAliases: ['utkarsh@boxyhq.com.test-google-a.com'],
      customerId: 'C00ok5q7m',
      orgUnitPath: '/',
      isMailboxSetup: true,
      isEnrolledIn2Sv: true,
      isEnforcedIn2Sv: false,
      includeInGlobalAddressList: true,
      thumbnailPhotoUrl:
        'https://lh3.googleusercontent.com/a-/ACB-R5SQxSXGs6n7h6o2su3Gbyx34SIARdkAmI3FH497=s96-c',
      thumbnailPhotoEtag: '"ULjLpRt-rFHjv0_nmsRibIgYdlOnAOLNVsyKVeTSiyU/lg1koWn3aD--fQ6_RC2OHXs1P-c"',
      recoveryEmail: 'ukrocks.mehta@gmail.com',
      recoveryPhone: '+919168054254',
    };

    const isEq = lodash.isEqual(existingUser, userFromProvider);

    console.log({ isEq });

    t.end();
  });
});

tap.teardown(async () => {
  process.exit(0);
});
