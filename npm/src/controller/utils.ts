import type { connectionType, IdPConfig, OAuthErrorHandlerParams } from '../typings';
import { JacksonError } from './error';
import * as redirect from './oauth/redirect';
import * as jose from 'jose';

export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct',
  OIDCProviderClientID = 'OIDCProviderClientID',
}

export const relayStatePrefix = 'boxyhq_jackson_';

export const validateAbsoluteUrl = (url, message) => {
  try {
    new URL(url);
  } catch (err) {
    throw new JacksonError(message ? message : 'Invalid url', 400);
  }
};

export const OAuthErrorResponse = ({
  error,
  error_description,
  redirect_uri,
  state,
}: OAuthErrorHandlerParams) => {
  return redirect.success(redirect_uri, { error, error_description, state });
};

// https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function loadJWSPrivateKey(key: string, alg: string): Promise<jose.KeyLike> {
  const pkcs8 = Buffer.from(key, 'base64').toString('ascii');
  const privateKey = await jose.importPKCS8(pkcs8, alg);
  return privateKey;
}

export function isJWSKeyPairLoaded(jwsKeyPair: { private: string; public: string }) {
  if (!jwsKeyPair.private || !jwsKeyPair.public) {
    return false;
  }
  return true;
}

export const importJWTPublicKey = async (key: string, jwsAlg: string): Promise<jose.KeyLike> => {
  const spki = Buffer.from(key, 'base64').toString('ascii');
  const publicKey = await jose.importSPKI(spki, jwsAlg);
  return publicKey;
};

export const exportPublicKeyJWK = async (key: jose.KeyLike): Promise<jose.JWK> => {
  const publicJWK = await jose.exportJWK(key);
  return publicJWK;
};

export const generateJwkThumbprint = async (jwk: jose.JWK): Promise<string> => {
  const thumbprint = await jose.calculateJwkThumbprint(jwk);
  return thumbprint;
};

export const validateIdPConfig = (body: IdPConfig, strategy: connectionType): void => {
  const {
    encodedRawMetadata,
    rawMetadata,
    defaultRedirectUrl,
    redirectUrl,
    tenant,
    product,
    description,
    oidcDiscoveryUrl,
    oidcClientId,
    oidcClientSecret,
  } = body;

  if (strategy !== 'saml' && strategy !== 'oidc') {
    throw new JacksonError(`Strategy: ${strategy} not supported`, 400);
  }

  if (strategy === 'saml') {
    if (!rawMetadata && !encodedRawMetadata) {
      throw new JacksonError('Please provide rawMetadata or encodedRawMetadata', 400);
    }
  }
  if (strategy === 'oidc') {
    if (!oidcClientId) {
      throw new JacksonError('Please provide the clientId from OpenID Provider', 400);
    }
    if (!oidcClientSecret) {
      throw new JacksonError('Please provide the clientSecret from OpenID Provider', 400);
    }
    if (!oidcDiscoveryUrl) {
      throw new JacksonError('Please provide the discoveryUrl for the OpenID Provider', 400);
    }
  }

  if (!defaultRedirectUrl) {
    throw new JacksonError('Please provide a defaultRedirectUrl', 400);
  }

  if (!redirectUrl) {
    throw new JacksonError('Please provide redirectUrl', 400);
  }

  if (!tenant) {
    throw new JacksonError('Please provide tenant', 400);
  }

  if (!product) {
    throw new JacksonError('Please provide product', 400);
  }

  if (description && description.length > 100) {
    throw new JacksonError('Description should not exceed 100 characters', 400);
  }
};

export const validateRedirectUrl = ({ redirectUrlList, defaultRedirectUrl }) => {
  if (redirectUrlList) {
    if (redirectUrlList.length > 100) {
      throw new JacksonError('Exceeded maximum number of allowed redirect urls', 400);
    }
    for (const url of redirectUrlList) {
      validateAbsoluteUrl(url, 'redirectUrl is invalid');
    }
  }
  if (defaultRedirectUrl) {
    validateAbsoluteUrl(defaultRedirectUrl, 'defaultRedirectUrl is invalid');
  }
};

export const extractRedirectUrls = (urls: string[] | string): string[] => {
  if (!urls) {
    return [];
  }

  if (typeof urls === 'string') {
    if (urls.startsWith('[')) {
      // redirectUrl is a stringified array
      return JSON.parse(urls);
    }
    // redirectUrl is a single URL
    return [urls];
  }

  // redirectUrl is an array of URLs
  return urls;
};

export const extractHostName = (url: string): string | null => {
  try {
    const pUrl = new URL(url);

    if (pUrl.hostname.startsWith('www.')) {
      return pUrl.hostname.substring(4);
    }

    return pUrl.hostname;
  } catch (err) {
    return null;
  }
};
