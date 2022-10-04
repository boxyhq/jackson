import { metrics } from '@opentelemetry/api-metrics';

const counters = {
  createConnection: {
    name: 'jackson.connection.create',
    description: 'Number of IdP connection create requests',
  },

  getConnections: {
    name: 'jackson.connections.get',
    description: 'Number of IdP connections get requests',
  },

  deleteConnections: {
    name: 'jackson.connections.delete',
    description: 'Number of IdP connections delete requests',
  },

  oauthAuthorize: {
    name: 'jackson.oauth.authorize',
    description: 'Number of oauth authorize requests',
  },

  oauthToken: {
    name: 'jackson.oauth.token',
    description: 'Number of oauth token requests',
  },

  oauthUserInfo: {
    name: 'jackson.oauth.userinfo',
    description: 'Number of oauth user info requests',
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
