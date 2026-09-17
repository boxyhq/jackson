// With an HTTP-POST SingleLogoutService URL that is not an HTTP(S) or localhost URL
module.exports = {
  defaultRedirectUrl: 'http://localhost:3366/sso/oauth/completed',
  redirectUrl: '["http://localhost:3366"]',
  tenant: 'boxyhqinvalidslopost.com',
  product: 'crm',
  name: 'testConfig',
  description: 'Just a test configuration',
};
