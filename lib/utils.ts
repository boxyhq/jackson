import type { NextApiRequest, NextApiResponse } from 'next';
import micromatch from 'micromatch';

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

const IsJsonString = (body: any): boolean => {
  try {
    const json = JSON.parse(body);

    return typeof json === 'object';
  } catch (e) {
    return false;
  }
};

export const bodyParser = (req: NextApiRequest): any => {
  return IsJsonString(req.body) ? JSON.parse(req.body) : req.body;
};
