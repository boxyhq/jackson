import type { DatabaseEngine, DatabaseOption, DatabaseType } from '@boxyhq/saml-jackson';

const samlPath = '/api/oauth/saml';
const oidcPath = '/api/oauth/oidc';
const idpDiscoveryPath = '/idp/select';

const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = Number(process.env.PORT || '5225');
const externalUrl = process.env.EXTERNAL_URL || 'http://' + hostUrl + ':' + hostPort;
const apiKeys = (process.env.JACKSON_API_KEYS || '').split(',');
const samlAudience = process.env.SAML_AUDIENCE;
const preLoadedConnection = process.env.PRE_LOADED_CONNECTION || process.env.PRE_LOADED_CONFIG;
const idpEnabled = process.env.IDP_ENABLED === 'true';
const clientSecretVerifier = process.env.CLIENT_SECRET_VERIFIER;
const jwsAlg = process.env.OPENID_JWS_ALG;
const boxyhqLicenseKey = process.env.BOXYHQ_LICENSE_KEY || undefined;

let ssl;
if (process.env.DB_SSL === 'true') {
  ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

const db: DatabaseOption = {
  engine: process.env.DB_ENGINE ? <DatabaseEngine>process.env.DB_ENGINE : undefined,
  url: process.env.DB_URL || process.env.DATABASE_URL,
  type: process.env.DB_TYPE ? <DatabaseType>process.env.DB_TYPE : undefined,
  ttl: process.env.DB_TTL ? Number(process.env.DB_TTL) : undefined,
  cleanupLimit: process.env.DB_CLEANUP_LIMIT ? Number(process.env.DB_CLEANUP_LIMIT) : undefined,
  encryptionKey: process.env.DB_ENCRYPTION_KEY,
  pageLimit: process.env.DB_PAGE_LIMIT ? Number(process.env.DB_PAGE_LIMIT) : undefined,
  ssl,
};

const env = {
  hostUrl,
  hostPort,
  externalUrl,
  samlPath,
  oidcPath,
  idpDiscoveryPath,
  samlAudience,
  preLoadedConnection,
  apiKeys,
  idpEnabled,
  db,
  clientSecretVerifier,
  openid: {
    jwsAlg,
    jwtSigningKeys: {
      private: process.env.OPENID_RSA_PRIVATE_KEY || '',
      public: process.env.OPENID_RSA_PUBLIC_KEY || '',
    },
  },
  boxyhqLicenseKey,
};

export default env;
