import { apiKeys } from '@lib/env';
import { compare, hash } from 'bcryptjs';

import env from './env';
import type { AUTH_PROVIDER } from 'types';

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

function getAuthProviders() {
  return env.authProviders?.split(',') || [];
}

export function isAuthProviderEnabled(provider: AUTH_PROVIDER) {
  return getAuthProviders().includes(provider);
}

export function authProviderEnabled() {
  return {
    email: isAuthProviderEnabled('email'),
    saml: isAuthProviderEnabled('saml'),
    credentials: isAuthProviderEnabled('credentials'),
  };
}

export const validateApiKey = (token: string | null) => {
  if (!token) {
    return false;
  }

  return apiKeys.includes(token);
};

export const extractAuthToken = (req): string | null => {
  let authHeader = '';

  if (typeof req.headers.get === 'function') {
    authHeader = req.headers.get('authorization') || '';
  } else {
    authHeader = req.headers.authorization || '';
  }

  const parts = authHeader.split(' ');

  return parts.length > 1 ? parts[1] : null;
};
