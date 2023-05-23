import { OAuth2Client } from 'google-auth-library';

import { GoogleAuth } from './oauth';
import { GoogleProvider } from './provider';
import type { IDirectoryConfig, JacksonOption } from '../../../typings';

interface GetGoogleProviderParams {
  directories: IDirectoryConfig;
  opts: JacksonOption;
}

export const getGogleProvider = (params: GetGoogleProviderParams) => {
  const { directories, opts } = params;
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

  const authClient = new OAuth2Client(
    dsync.google.clientId,
    dsync.google.clientSecret,
    dsync.google.callbackUrl
  );

  return {
    auth: new GoogleAuth({ directories, authClient }),
    provider: new GoogleProvider({ directories, authClient }),
  };
};
