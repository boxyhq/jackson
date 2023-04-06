import { incrementCounter } from '@boxyhq/metrics';

export const METER = 'jackson';

export const counters = {
  createConnection: {
    increment: () =>
      incrementCounter({
        meter: METER,
        name: 'jackson.connection.create',
        counterOptions: { description: 'Number of IdP connection create requests' },
      }),
  },
  getConnections: {
    increment: () =>
      incrementCounter({
        meter: METER,
        name: 'jackson.connection.get',
        counterOptions: { description: 'Number of IdP connections get requests' },
      }),
  },
  deleteConnections: {
    increment: () =>
      incrementCounter({
        meter: METER,
        name: 'jackson.connection.delete',
        counterOptions: { description: 'Number of IdP connections delete requests' },
      }),
  },
  oauthAuthorize: {
    increment: () =>
      incrementCounter({
        meter: METER,
        name: 'jackson.oauth.authorize',
        counterOptions: { description: 'Number of oauth authorize requests' },
      }),
  },
  oauthToken: {
    increment: () =>
      incrementCounter({
        meter: METER,
        name: 'jackson.oauth.token',
        counterOptions: { description: 'Number of oauth token requests' },
      }),
  },
  oauthUserInfo: {
    increment: () =>
      incrementCounter({
        meter: METER,
        name: 'jackson.oauth.userinfo',
        counterOptions: { description: 'Number of oauth user info requests' },
      }),
  },
};
