const packageInfo = require('../package.json');

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Enterprise SSO & Directory Sync',
    version: packageInfo.version,
    description: 'This is the API documentation for Polis.',
    termsOfService: '/tos',
    contact: {
      email: 'support@ory.sh',
      name: 'Polis API Support',
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
  },
  security: [
    {
      apiKey: [],
    },
  ],
  servers: [
    {
      url: 'https://api.eu.boxyhq.com',
      description: 'Cloud',
    },
    {
      url: 'http://localhost:5225',
      description: 'Local',
    },
  ],
};
