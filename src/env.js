const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = (process.env.HOST_PORT || '5000') * 1;
const externalUrl =
  process.env.EXTERNAL_URL || 'http://' + hostUrl + ':' + hostPort;

const internalUrl = process.env.INTERNAL_HOST_URL || 'localhost';
const internalPort = (process.env.INTERNAL_HOST_PORT || '6000') * 1;

const samlAudience = process.env.SAML_AUDIENCE || 'https://saml.boxyhq.com';

const idpEnabled = process.env.IDP_ENABLED === 'true';
const db = {
  engine: process.env.DB_ENGINE || 'sql', // Supported values: redis, sql, mongo, mem. Keep comment in sync with db.js
  url: process.env.DB_URL || 'postgres://postgres:postgres@localhost:5450/jackson',
  type: process.env.DB_TYPE || 'postgres', // Only needed if DB_ENGINE is sql. Supported values: postgres, cockroachdb, mysql, mariadb
};

module.exports = {
  hostUrl,
  hostPort,
  externalUrl,
  samlAudience,
  internalUrl,
  internalPort,
  idpEnabled,
  db,
  useInternalServer: !(hostUrl === internalUrl && hostPort === internalPort),
};
