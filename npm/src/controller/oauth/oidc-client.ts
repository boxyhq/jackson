import * as client from 'openid-client';

import { JacksonError } from '../error';

const NAME = 'openid-client';
const VERSION = '5.6.5';
const HOMEPAGE = 'https://github.com/panva/node-openid-client';
const USER_AGENT = `${NAME}/${VERSION} (${HOMEPAGE})`;

const customFetch = (...args) => {
  console.log(`args[1]`, args[1]);
  const headers = {
    ...args[1].headers,
    'user-agent': USER_AGENT,
    // 'accept-encoding': 'identity',
    // host: 'gateway.id.tools.bbc.co.uk',
  };
  console.log(`customFetch called with headers`, headers);

  return fetch(args[0], {
    ...args[1],
    headers,
  });
};

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
            [client.customFetch]: customFetch,
          }
        : { [client.customFetch]: customFetch }
    );
  }
  if (metadata) {
    const config = new client.Configuration(metadata, clientId, clientSecret);
    config[client.customFetch] = customFetch;
    if (isLocalhost) {
      client.allowInsecureRequests(config);
    }
    return config;
  }
  throw new JacksonError('Neither "discoveryUrl" nor "metadata" set for the OIDC provider', 500);
};
