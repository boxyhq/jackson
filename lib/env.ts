import type { DatabaseEngine, DatabaseOption, DatabaseType, JacksonOption } from '@boxyhq/saml-jackson';

const samlPath = '/api/oauth/saml';
const oidcPath = '/api/oauth/oidc';
const idpDiscoveryPath = '/idp/select';

const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = Number(process.env.PORT || '5225');
const externalUrl = process.env.EXTERNAL_URL || 'http://' + hostUrl + ':' + hostPort;
const apiKeys = (process.env.JACKSON_API_KEYS || '').split(',');

let ssl;
if (process.env.DB_SSL === 'true') {
  ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

// Retraced
const retraced = {
  hostUrl: process.env.RETRACED_HOST_URL,
  externalUrl: process.env.RETRACED_EXTERNAL_URL || process.env.RETRACED_HOST_URL,
  adminToken: process.env.RETRACED_ADMIN_ROOT_TOKEN,
};

// Terminus
const terminus = {
  hostUrl: process.env.TERMINUS_PROXY_HOST_URL,
  adminToken: process.env.TERMINUS_ADMIN_ROOT_TOKEN,
};

const db: DatabaseOption = {
  engine: process.env.DB_ENGINE ? <DatabaseEngine>process.env.DB_ENGINE : undefined,
  url: process.env.DB_URL || process.env.DATABASE_URL,
  type: process.env.DB_TYPE ? <DatabaseType>process.env.DB_TYPE : undefined,
  ttl: process.env.DB_TTL ? Number(process.env.DB_TTL) : undefined,
  cleanupLimit: process.env.DB_CLEANUP_LIMIT ? Number(process.env.DB_CLEANUP_LIMIT) : undefined,
  encryptionKey: process.env.DB_ENCRYPTION_KEY,
  pageLimit: process.env.DB_PAGE_LIMIT ? Number(process.env.DB_PAGE_LIMIT) : undefined,
  ssl,
  region: process.env.DB_REGION,
  },
};

const jacksonOptions: JacksonOption = {
  externalUrl,
  samlPath,
  oidcPath,
  idpDiscoveryPath,
  samlAudience: process.env.SAML_AUDIENCE,
  preLoadedConnection: process.env.PRE_LOADED_CONNECTION || process.env.PRE_LOADED_CONFIG,
  idpEnabled: process.env.IDP_ENABLED === 'true',
  db,
  clientSecretVerifier: process.env.CLIENT_SECRET_VERIFIER,
  openid: {
    jwsAlg: process.env.OPENID_JWS_ALG,
    jwtSigningKeys: {
      private: process.env.OPENID_RSA_PRIVATE_KEY || '',
      public: process.env.OPENID_RSA_PUBLIC_KEY || '',
    },
  },
  certs: {
    publicKey: process.env.PUBLIC_KEY || '',
    privateKey: process.env.PRIVATE_KEY || '',
  },
  boxyhqLicenseKey: process.env.BOXYHQ_LICENSE_KEY,
  retraced,
  noAnalytics:
    process.env.DO_NOT_TRACK === '1' ||
    process.env.DO_NOT_TRACK === 'true' ||
    process.env.BOXYHQ_NO_ANALYTICS === '1' ||
    process.env.BOXYHQ_NO_ANALYTICS === 'true',
  terminus,
};

const adminPortalSSODefaults = {
  tenant: process.env.ADMIN_PORTAL_SSO_TENANT || '_jackson_boxyhq',
  product: process.env.ADMIN_PORTAL_SSO_PRODUCT || '_jackson_admin_portal',
  redirectUrl: externalUrl,
  defaultRedirectUrl: `${externalUrl}/admin/auth/idp-login`,
};

export { adminPortalSSODefaults };
export { retraced as retracedOptions };
export { terminus as terminusOptions };
export { apiKeys };
export { jacksonOptions };
