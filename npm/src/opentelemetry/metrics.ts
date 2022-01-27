import { metrics } from '@opentelemetry/api-metrics';

const meter = metrics.getMeter('saml-jackson');

const counters = {
  createConfig: meter.createCounter('config_create', {
    description: 'Number of SAML config create requests',
  }),

  getConfig: meter.createCounter('config_get', {
    description: 'Number of SAML config get requests',
  }),

  deleteConfig: meter.createCounter('config_delete', {
    description: 'Number of SAML config delete requests',
  }),

  oauthAuthorize: meter.createCounter('oauth_authorize', {
    description: 'Number of SAML oauth authorize requests',
  }),

  oauthToken: meter.createCounter('oauth_token', {
    description: 'Number of SAML oauth token requests',
  }),

  oauthUserInfo: meter.createCounter('oauth_user_info', {
    description: 'Number of SAML oauth user info requests',
  }),
};

const increment = (action: string) => {
  counters[action].add(1);
};

export { increment };
