import { metrics } from '@opentelemetry/api-metrics';

const meter = metrics.getMeter('saml-jackson');

const counters = {
  createConfig: meter.createCounter('saml.config.create', {
    description: 'Number of SAML config create requests',
  }),

  getConfig: meter.createCounter('saml.config.get', {
    description: 'Number of SAML config get requests',
  }),

  deleteConfig: meter.createCounter('saml.config.delete', {
    description: 'Number of SAML config delete requests',
  }),

  oauthAuthorize: meter.createCounter('saml.oauth.authorize', {
    description: 'Number of SAML oauth authorize requests',
  }),

  oauthToken: meter.createCounter('saml.oauth.token', {
    description: 'Number of SAML oauth token requests',
  }),

  oauthUserInfo: meter.createCounter('saml.oauth.userinfo', {
    description: 'Number of SAML oauth user info requests',
  }),
};

const increment = (action: string) => {
  counters[action].add(1);
};

export { increment };
