import crypto from 'crypto';
import * as jose from 'jose';
import { Client, TokenSet } from 'openid-client';
import saml from '@boxyhq/saml20';

import type {
  ConnectionType,
  OAuthErrorHandlerParams,
  OIDCSSOConnection,
  SAMLSSOConnectionWithEncodedMetadata,
  SAMLSSOConnectionWithRawMetadata,
  Profile,
} from '../typings';
import { JacksonError } from './error';
import * as redirect from './oauth/redirect';
import claims from '../saml/claims';

export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct',
  OIDCProviderClientID = 'OIDCProviderClientID',
}

// The namespace prefix for the database store
export const storeNamespacePrefix = {
  dsync: {
    config: 'dsync:config',
    logs: 'dsync:logs',
    users: 'dsync:users',
    groups: 'dsync:groups',
    members: 'dsync:members',
  },
  saml: {
    config: 'saml:config',
  },
};

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

export const createRandomSecret = async (length: number) => {
  return crypto
    .randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

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

export const validateSSOConnection = (
  body: SAMLSSOConnectionWithRawMetadata | SAMLSSOConnectionWithEncodedMetadata | OIDCSSOConnection,
  strategy: ConnectionType
): void => {
  const { defaultRedirectUrl, redirectUrl, tenant, product, description } = body;
  const encodedRawMetadata = 'encodedRawMetadata' in body ? body.encodedRawMetadata : undefined;
  const rawMetadata = 'rawMetadata' in body ? body.rawMetadata : undefined;
  const oidcDiscoveryUrl = 'oidcDiscoveryUrl' in body ? body.oidcDiscoveryUrl : undefined;
  const oidcClientId = 'oidcClientId' in body ? body.oidcClientId : undefined;
  const oidcClientSecret = 'oidcClientSecret' in body ? body.oidcClientSecret : undefined;
  const metadataUrl = 'metadataUrl' in body ? body.metadataUrl : undefined;

  if (strategy !== 'saml' && strategy !== 'oidc') {
    throw new JacksonError(`Strategy: ${strategy} not supported`, 400);
  }

  if (strategy === 'saml') {
    if (!rawMetadata && !encodedRawMetadata && !metadataUrl) {
      throw new JacksonError('Please provide rawMetadata or encodedRawMetadata or metadataUrl', 400);
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

export const extractOIDCUserProfile = async (tokenSet: TokenSet, oidcClient: Client) => {
  const idTokenClaims = tokenSet.claims();
  const userinfo = await oidcClient.userinfo(tokenSet);

  const profile: { claims: Partial<Profile & { raw: Record<string, unknown> }> } = { claims: {} };

  profile.claims.id = idTokenClaims.sub;
  profile.claims.email = idTokenClaims.email ?? userinfo.email;
  profile.claims.firstName = idTokenClaims.given_name ?? userinfo.given_name;
  profile.claims.lastName = idTokenClaims.family_name ?? userinfo.family_name;
  profile.claims.roles = idTokenClaims.roles ?? (userinfo.roles as any);
  profile.claims.groups = idTokenClaims.groups ?? (userinfo.groups as any);
  profile.claims.raw = userinfo;

  return profile;
};

export const getScopeValues = (scope?: string): string[] => {
  return typeof scope === 'string' ? scope.split(' ').filter((s) => s.length > 0) : [];
};

export const validateSAMLResponse = async (rawResponse: string, validateOpts) => {
  const profile = await saml.validate(rawResponse, validateOpts);
  if (profile && profile.claims) {
    // we map claims to our attributes id, email, firstName, lastName where possible. We also map original claims to raw
    profile.claims = claims.map(profile.claims);

    // some providers don't return the id in the assertion, we set it to a sha256 hash of the email
    if (!profile.claims.id && profile.claims.email) {
      profile.claims.id = crypto.createHash('sha256').update(profile.claims.email).digest('hex');
    }
  }
  return profile;
};

export const getEncodedTenantProduct = (
  param: string
): { tenant: string | null; product: string | null } | null => {
  try {
    const sp = new URLSearchParams(param);
    const tenant = sp.get('tenant');
    const product = sp.get('product');
    if (tenant && product) {
      return {
        tenant: sp.get('tenant'),
        product: sp.get('product'),
      };
    }

    return null;
  } catch (err) {
    return null;
  }
};
