import * as client from 'openid-client';
import * as http from 'http';
import * as https from 'https';
import { JacksonError } from '../error';
import { URL } from 'url';

const customFetch = (url: RequestInfo | URL, options: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers as http.OutgoingHttpHeaders,
    };
    const request = parsedUrl.protocol === 'https:' ? https.request : http.request;

    const req = request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = new Response(data, {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: new Headers(res.headers as HeadersInit),
        });

        resolve(response);
      });
    });

    req.on('error', (error) => {
      console.error(`error`, error, error.stack);
      reject(error);
    });

    if (options.body) {
      let body;
      let contentType: string | undefined;

      if (options.body instanceof URLSearchParams) {
        body = options.body.toString();
        contentType = 'application/x-www-form-urlencoded';
      } else {
        body = options.body;
      }

      if (contentType) {
        req.setHeader('content-type', contentType);
      }
      req.write(body);
    }

    req.end();
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
