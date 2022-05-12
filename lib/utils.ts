import type { NextApiRequest, NextApiResponse } from 'next';
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

// Print the API request
export const printRequest = (req: NextApiRequest) => {
  const { body, query, method, url } = req;

  console.log({
    url,
    method,
    query,
    body: body,
  });
};
