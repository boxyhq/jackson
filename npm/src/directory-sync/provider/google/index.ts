import type { IDirectoryConfig, IUsers, IGroups, JacksonOption } from '../../../typings';
import { GoogleGroups } from './groups';
import { GoogleAuth } from './oauth';
import { OAuth2Client } from 'google-auth-library';

interface GoogleProviderParams {
  users: IUsers;
  groups: IGroups;
  directories: IDirectoryConfig;
  opts: JacksonOption;
}

// Init Google Directory API
const initGoogleProvider = (params: GoogleProviderParams) => {
  const { users, groups, directories, opts } = params;
  const { dsync } = opts;

  if (!dsync?.google?.clientId) {
    throw new Error('Google Provider: Missing Google Client ID');
  }

  if (!dsync?.google?.clientSecret) {
    throw new Error('Google Provider: Missing Google Client Secret');
  }

  if (!dsync?.google?.callbackUrl) {
    throw new Error('Google Provider: Missing Google Callback URL');
  }

  const auth2Client = new OAuth2Client(
    dsync.google.clientId,
    dsync.google.clientSecret,
    dsync.google.callbackUrl
  );

  // Listen on refresh token event
  // auth2Client.on('tokens', (tokens) => {
  //   console.log('Google Provider: Tokens');
  //   console.log({ tokens });
  // });

  return {
    auth: new GoogleAuth({ directories, auth2Client }),
    groups: new GoogleGroups({ directories, users, groups }),
  };
};

export default initGoogleProvider;
