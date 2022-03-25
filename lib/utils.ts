import { NextApiRequest, NextApiResponse } from 'next';
import { serialize, type CookieSerializeOptions } from 'cookie';
import env from '@lib/env';
import micromatch from 'micromatch';

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

export interface APIError extends Error {
  info?: string;
  status: number;
}

export const fetcher = async (url: string, queryParams = '') => {
  const res = await fetch(`${url}${queryParams}`);
  let resContent;
  try {
    resContent = await res.clone().json();
  } catch (e) {
    resContent = await res.clone().text();
  }
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.') as APIError;
    // Attach extra info to the error object.
    error.info = resContent;
    error.status = res.status;
    throw error;
  }

  return resContent;
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
export const setCookie = (
  res: NextApiResponse,
  name: string,
  value: unknown,
  options: CookieSerializeOptions = {}
) => {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  if (typeof options['maxAge'] === 'number') {
    options.expires = new Date(Date.now() + options.maxAge);
    options.maxAge /= 1000;
  }

  res.setHeader('Set-Cookie', serialize(name, stringValue, options));
};

// returns the cookie with the given name,
// or undefined if not found
export function getCookie(name) {
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}
