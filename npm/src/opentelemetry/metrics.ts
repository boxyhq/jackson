import { metrics } from '@opentelemetry/api-metrics';

const counters = {
  createConfig: {
    name: 'jackson.config.create',
    description: 'Number of SAML config create requests',
  },

  getConfig: {
    name: 'jackson.config.get',
    description: 'Number of SAML config get requests',
  },

  deleteConfig: {
    name: 'jackson.config.delete',
    description: 'Number of SAML config delete requests',
  },

  oauthAuthorize: {
    name: 'jackson.oauth.authorize',
    description: 'Number of SAML oauth authorize requests',
  },

  oauthToken: {
    name: 'jackson.oauth.token',
    description: 'Number of SAML oauth token requests',
  },

  oauthUserInfo: {
    name: 'jackson.oauth.userinfo',
    description: 'Number of SAML oauth user info requests',
  },
};

const createCounter = (action: string) => {
  const meter = metrics.getMeterProvider().getMeter('jackson');
  const counter = counters[action];

  return meter.createCounter(counter.name, {
    description: counter.description,
  });
};

const increment = (action: string) => {
  const counter = createCounter(action);

  counter.add(1, { provider: 'saml' });
};

export { increment };
