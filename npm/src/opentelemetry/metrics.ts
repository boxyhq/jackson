import { incrementCounter, type CounterOperationParams } from '@boxyhq/metrics';

const METER = 'jackson';

const counters = {
  createConnection: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.connection.create',
      counterOptions: { description: 'Number of IdP connection create requests' },
    }),
  getConnections: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.connection.get',
      counterOptions: { description: 'Number of IdP connections get requests' },
    }),
  deleteConnections: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.connection.delete',
      counterOptions: { description: 'Number of IdP connections delete requests' },
    }),
  oauthAuthorize: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.authorize',
      counterOptions: { description: 'Number of oauth authorize requests' },
    }),
  oauthAuthorizeError: (counterAttributes: CounterOperationParams['counterAttributes']) =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.authorize.error',
      counterOptions: { description: 'Number of errors in oauth authorize requests' },
      counterAttributes,
    }),
  oAuthResponseError: (counterAttributes: CounterOperationParams['counterAttributes']) =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.response.error',
      counterOptions: { description: 'Number of errors in idp response path' },
      counterAttributes,
    }),
  oauthToken: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.token',
      counterOptions: { description: 'Number of oauth token requests' },
    }),
  oauthTokenError: (counterAttributes: CounterOperationParams['counterAttributes']) =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.token.error',
      counterOptions: { description: 'Number of errors in oauth token requests' },
      counterAttributes,
    }),
  oauthUserInfo: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.userinfo',
      counterOptions: { description: 'Number of oauth user info requests' },
    }),
  oauthUserInfoError: (counterAttributes: CounterOperationParams['counterAttributes']) =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.userinfo.error',
      counterOptions: { description: 'Number of errors in oauth user info requests' },
      counterAttributes,
    }),

  createDsyncConnection: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.dsync.connection.create',
      counterOptions: { description: 'Number of DSync connection create requests' },
    }),

  getDsyncConnections: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.dsync.connection.get',
      counterOptions: { description: 'Number of DSync connections get requests' },
    }),

  deleteDsyncConnections: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.dsync.connection.delete',
      counterOptions: { description: 'Number of DSync connections delete requests' },
    }),

  dsyncEventsBatchFailed: () => {
    incrementCounter({
      meter: METER,
      name: 'jackson.dsync.events_batch.failed',
      counterOptions: { description: 'Indicate that a batch of dsync events failed' },
    });
  },
};

const increment = (
  action: keyof typeof counters,
  counterAttributes?: CounterOperationParams['counterAttributes']
) => {
  const counterIncrement = counters[action];
  if (typeof counterIncrement === 'function') {
    counterIncrement(counterAttributes);
  }
};

export { increment };
