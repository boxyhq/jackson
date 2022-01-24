const package = require('../package.json');

module.exports = {
  info: {
    title: 'SAML Jackson API',
    version: package.version,
    description: 'This is the API documentation for SAML Jackson service.',
    termsOfService: 'https://boxyhq.com/terms.html',
    contact: {
      name: 'Boxy HQ',
      url: 'https://boxyhq.com/',
      email: 'support@boxyhq.com',
    },
    license: {
      name: 'Apache-2.0 License',
      url: 'https://github.com/boxyhq/jackson/blob/main/LICENSE',
    },
  },
  host: 'localhost:5000',
  basePath: '/',
  schemes: ['http', 'https'],
  securityDefinitions: {
    apiKey: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
    },
  },
  security: [
    {
      apiKey: [],
    },
  ],
};
