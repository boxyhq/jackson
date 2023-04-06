export const METER = 'jackson';

export const COUNTERS = {
  createConnection: {
    metricName: 'jackson.connection.create',
    metricDescription: 'Number of IdP connection create requests',
  },
  getConnections: {
    metricName: 'jackson.connection.get',
    metricDescription: 'Number of IdP connection get requests',
  },
  deleteConnections: {
    metricName: 'jackson.connection.delete',
    metricDescription: 'Number of IdP connections delete requests',
  },
  oauthAuthorize: {
    metricName: 'jackson.oauth.authorize',
    metricDescription: 'Number of oauth authorize requests',
  },
  oauthToken: {
    metricName: 'jackson.oauth.token',
    metricDescription: 'Number of oauth token requests',
  },
  oauthUserInfo: {
    metricName: 'jackson.oauth.userinfo',
    metricDescription: 'Number of oauth user info requests',
  },
};
