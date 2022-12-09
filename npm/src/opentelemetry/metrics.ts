import { metrics } from '@opentelemetry/api';

let meter = metrics.getMeterProvider().getMeter('jackson');
let counters;

const increment = (action: string) => {
  const counter = counters[action];
  if (counter) {
    counter.add(1);
  }
};

const init = () => {
  meter = metrics.getMeterProvider().getMeter('jackson');

  counters = {
    createConnection: meter.createCounter('jackson.connection.create', {
      description: 'Number of IdP connection create requests',
    }),

    getConnections: meter.createCounter('jackson.connection.get', {
      description: 'Number of IdP connections get requests',
    }),

    deleteConnections: meter.createCounter('jackson.connection.delete', {
      description: 'Number of IdP connections delete requests',
    }),

    oauthAuthorize: meter.createCounter('jackson.oauth.authorize', {
      description: 'Number of oauth authorize requests',
    }),

    oauthToken: meter.createCounter('jackson.oauth.token', {
      description: 'Number of oauth token requests',
    }),

    oauthUserInfo: meter.createCounter('jackson.oauth.userinfo', {
      description: 'Number of oauth user info requests',
    }),
  };
};

export { increment, init };
