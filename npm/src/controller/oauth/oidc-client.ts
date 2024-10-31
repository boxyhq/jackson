// import { Issuer, type IssuerMetadata } from 'openid-client';
import * as client from 'openid-client';

import { JacksonError } from '../error';

// export const oidcIssuerInstance = async (discoveryUrl?: string, metadata?: IssuerMetadata) => {
//   if (discoveryUrl) {
//     return await Issuer.discover(discoveryUrl);
//   }
//   if (metadata) {
//     return new Issuer(metadata);
//   }
//   throw new JacksonError('Neither "discoveryUrl" nor "metadata" set for the OIDC issuer', 500);
// };

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
