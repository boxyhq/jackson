import { incrementCounter } from '@boxyhq/metrics';

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
  oauthToken: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.token',
      counterOptions: { description: 'Number of oauth token requests' },
    }),

  oauthUserInfo: () =>
    incrementCounter({
      meter: METER,
      name: 'jackson.oauth.userinfo',
      counterOptions: { description: 'Number of oauth user info requests' },
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

const increment = (action: keyof typeof counters) => {
  const counterIncrement = counters[action];
  if (typeof counterIncrement === 'function') {
    counterIncrement();
  }
};

export { increment };
