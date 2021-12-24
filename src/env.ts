const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = +(process.env.HOST_PORT || '5000');
const externalUrl =
  process.env.EXTERNAL_URL || 'http://' + hostUrl + ':' + hostPort;
const samlPath = process.env.SAML_PATH || '/oauth/saml';

const internalHostUrl = process.env.INTERNAL_HOST_URL || 'localhost';
const internalHostPort = +(process.env.INTERNAL_HOST_PORT || '6000');

const apiKeys = (process.env.JACKSON_API_KEYS || '').split(',');

const samlAudience = process.env.SAML_AUDIENCE;
const preLoadedConfig = process.env.PRE_LOADED_CONFIG;

const idpEnabled = process.env.IDP_ENABLED;
const db = {
  engine: process.env.DB_ENGINE,
  url: process.env.DB_URL,
  type: process.env.DB_TYPE,
  ttl: process.env.DB_TTL,
  encryptionKey: process.env.DB_ENCRYPTION_KEY,
};

const env = {
  hostUrl,
  hostPort,
  externalUrl,
  samlPath,
  samlAudience,
  preLoadedConfig,
  internalHostUrl,
  internalHostPort,
  apiKeys,
  idpEnabled,
  db,
  useInternalServer: !(
    hostUrl === internalHostUrl && hostPort === internalHostPort
  ),
};

export default env;
