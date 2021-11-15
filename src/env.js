const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = (process.env.HOST_PORT || '5000') * 1;
const externalUrl =
  process.env.EXTERNAL_URL || 'http://' + hostUrl + ':' + hostPort;
const samlPath = process.env.SAML_PATH || '/oauth/saml';

const internalHostUrl = process.env.INTERNAL_HOST_URL || 'localhost';
const internalHostPort = (process.env.INTERNAL_HOST_PORT || '6000') * 1;

const samlAudience = process.env.SAML_AUDIENCE;
const preLoadedConfig = process.env.PRE_LOADED_CONFIG;

const idpEnabled = process.env.IDP_ENABLED;
const db = {
  engine: process.env.DB_ENGINE,
  url: process.env.DB_URL,
  type: process.env.DB_TYPE,
};

module.exports = {
  hostUrl,
  hostPort,
  externalUrl,
  samlPath,
  samlAudience,
  preLoadedConfig,
  internalHostUrl,
  internalHostPort,
  idpEnabled,
  db,
  useInternalServer: !(
    hostUrl === internalHostUrl && hostPort === internalHostPort
  ),
};
