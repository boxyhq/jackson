const hostUrl = process.env.HOST_URL || 'localhost';
const hostPort = (process.env.HOST_PORT || '5000') * 1;
const samlAudience = process.env.SAML_AUDIENCE || 'https://saml.boxyhq.com';

module.exports = {
  hostUrl,
  hostPort,
  samlAudience,
};
