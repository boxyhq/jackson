import type { NextApiRequest, NextApiResponse } from 'next';
import micromatch from 'micromatch';
import type { OIDCSSOConnectionWithDiscoveryUrl, OIDCSSOConnectionWithMetadata } from '@boxyhq/saml-jackson';
import { JacksonError } from 'npm/src/controller/error';

export const validateEmailWithACL = (email: string) => {
  const NEXTAUTH_ACL = process.env.NEXTAUTH_ACL || undefined;

  if (!NEXTAUTH_ACL) {
    return false;
  }

  const acl = NEXTAUTH_ACL.split(',');

  return micromatch.isMatch(email, acl);
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

export const strategyChecker = (req: NextApiRequest): { isSAML: boolean; isOIDC: boolean } => {
  const isSAML = 'rawMetadata' in req.body || 'encodedRawMetadata' in req.body || 'metadataUrl' in req.body;
  const isOIDC = 'oidcDiscoveryUrl' in req.body || 'oidcMetadata' in req.body;
  return { isSAML, isOIDC };
};

// The oidcMetadata JSON will be parsed here
export const oidcMetadataParse = (
  body:
    | (
        | OIDCSSOConnectionWithDiscoveryUrl
        | (Omit<OIDCSSOConnectionWithMetadata, 'oidcMetadata'> & { oidcMetadata: string })
      ) & {
        clientID: string;
        clientSecret: string;
      }
) => {
  if (!body.oidcDiscoveryUrl && typeof body.oidcMetadata === 'string') {
    try {
      const oidcMetadata = JSON.parse(body.oidcMetadata);
      return { ...body, oidcMetadata };
    } catch (err) {
      throw new JacksonError('Could not parse OIDC Provider metadata, expected a valid JSON string', 400);
    }
  }
  return body;
};

// Hex to HSL converter
export const hexToHSL = (H: string) => {
  let r = 0,
    g = 0,
    b = 0;

  if (H.length === 4) {
    r = parseInt('0x' + H[1] + H[1]);
    g = parseInt('0x' + H[2] + H[2]);
    b = parseInt('0x' + H[3] + H[3]);
  } else if (H.length === 7) {
    r = parseInt('0x' + H[1] + H[2]);
    g = parseInt('0x' + H[3] + H[4]);
    b = parseInt('0x' + H[5] + H[6]);
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;

  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return `${h} ${s}% ${l}%`;
};
