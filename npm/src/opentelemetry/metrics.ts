import { metrics } from '@opentelemetry/api-metrics';

const counters = {
  createConfig: {
    name: 'saml.config.create',
    description: 'Number of SAML config create requests',
  },

  getConfig: {
    name: 'saml.config.get',
    description: 'Number of SAML config get requests',
  },

  deleteConfig: {
    name: 'saml.config.delete',
    description: 'Number of SAML config delete requests',
  },

  oauthAuthorize: {
    name: 'saml.oauth.authorize',
    description: 'Number of SAML oauth authorize requests',
  },

  oauthToken: {
    name: 'saml.oauth.token',
    description: 'Number of SAML oauth token requests',
  },

  oauthUserInfo: {
    name: 'saml.oauth.userinfo',
    description: 'Number of SAML oauth user info requests',
  }
}

const createCounter = (action: string) => {
  const meter = metrics.getMeterProvider().getMeter('saml-jackson');
  const counter = counters[action];

  return meter.createCounter(counter.name, {
    description: counter.description,
  })
}

const increment = (action: string) => {
  const counter = createCounter(action);

  counter.add(1);
};

export { increment };
