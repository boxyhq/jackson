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
  if (discoveryUrl) {
    return await client.discovery(new URL(discoveryUrl), clientId, clientSecret);
  }
  if (metadata) {
    return new client.Configuration(metadata, clientId, clientSecret);
  }
  throw new JacksonError('Neither "discoveryUrl" nor "metadata" set for the OIDC provider', 500);
};
