import type { OAuthErrorHandlerParams } from '../typings';
import { JacksonError } from './error';
import * as redirect from './oauth/redirect';
import * as jose from 'jose';

export enum IndexNames {
  EntityID = 'entityID',
  TenantProduct = 'tenantProduct',
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
  if (error instanceof Error) return error.message;
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
