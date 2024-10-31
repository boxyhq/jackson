import * as client from 'openid-client';

import { JacksonError } from '../error';

export const oidcClientConfig = async ({
  discoveryUrl,
  metadata,
  clientId,
  clientSecret,
}: {
  discoveryUrl?: string;
  metadata?: client.ServerMetadata;
  clientId: string;
  clientSecret: string;
}): Promise<client.Configuration> => {
  const url = discoveryUrl ? new URL(discoveryUrl) : new URL(metadata!.issuer);
  const isLocalhost = url.hostname === 'localhost';
  if (discoveryUrl) {
    return await client.discovery(
      url,
      clientId,
      clientSecret,
      undefined,
      isLocalhost
        ? {
            execute: [client.allowInsecureRequests],
          }
        : undefined
    );
  }
  if (metadata) {
    const config = new client.Configuration(metadata, clientId, clientSecret);
    if (isLocalhost) {
      client.allowInsecureRequests(config);
    }
    return config;
  }
  throw new JacksonError('Neither "discoveryUrl" nor "metadata" set for the OIDC provider', 500);
};
