import { NextApiRequest, NextApiResponse } from 'next';
import env from '@lib/env';
import micromatch from 'micromatch';
import * as jose from 'jose';

export const validateApiKey = (token) => {
  return env.apiKeys.includes(token);
};

export const extractAuthToken = (req: NextApiRequest) => {
  const authHeader = req.headers['authorization'];
  const parts = (authHeader || '').split(' ');
  if (parts.length > 1) {
    return parts[1];
  }

  return null;
};

export const validateEmailWithACL = (email) => {
  const NEXTAUTH_ACL = process.env.NEXTAUTH_ACL || undefined;
  const acl = NEXTAUTH_ACL?.split(',');

  if (acl) {
    if (micromatch.isMatch(email, acl)) {
      return true;
    }
  }
  return false;
};

/**
 * This sets `cookie` using the `res` object
 */
export const setErrorCookie = (res: NextApiResponse, value: unknown, options: { path?: string } = {}) => {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  let cookieContents = 'jackson_error' + '=' + stringValue;
  if (options.path) {
    cookieContents += '; Path=' + options.path;
  }
  res.setHeader('Set-Cookie', cookieContents);
};

export const importJWTPublicKey = async (key: string): Promise<jose.KeyLike> => {
  const spki = Buffer.from(key, 'base64').toString('ascii');
  const publicKey = await jose.importSPKI(spki, env.openid.jwsAlg);
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
