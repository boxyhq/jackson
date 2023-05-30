import { OAuth2Client } from 'google-auth-library';

import { GoogleAuth } from './oauth';
import { GoogleProvider } from './api';
import type { IDirectoryConfig, JacksonOption } from '../../../typings';

interface NewGoogleProviderParams {
  directories: IDirectoryConfig;
  opts: JacksonOption;
}

export const newGoogleProvider = (params: NewGoogleProviderParams) => {
  const { directories, opts } = params;

  const googleProvider = opts.dsync?.providers.google;

  const authClient = new OAuth2Client(
    googleProvider?.clientId,
    googleProvider?.clientSecret,
    googleProvider?.callbackUrl
  );

  return {
    directory: new GoogleProvider({ authClient, directories }),
    oauth: new GoogleAuth({ authClient, directories }),
  };
};
