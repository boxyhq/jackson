export const sessionName = 'next-auth.saml-jackson';

export const identityProviders = [
  {
    name: 'Auth0 SAML SSO',
    id: 'auth0',
    stepCount: 3,
  },
  {
    name: 'Azure SAML SSO',
    id: 'azure',
    stepCount: 4,
  },
  {
    name: 'Google SAML SSO',
    id: 'google',
    stepCount: 4,
  },
  {
    name: 'JumpCloud SAML SSO',
    id: 'jumpcloud',
    stepCount: 4,
  },
  {
    name: 'Microsoft AD FS SAML SSO',
    id: 'microsoft-adfs',
    stepCount: 4,
  },
  {
    name: 'Okta SAML SSO',
    id: 'okta',
    stepCount: 4,
  },
  {
    name: 'OneLogin SAML SSO',
    id: 'onelogin',
    stepCount: 4,
  },
  {
    name: 'PingOne SAML SSO',
    id: 'pingone',
    stepCount: 4,
  },
  {
    name: 'Rippling SAML SSO',
    id: 'rippling',
    stepCount: 3,
  },
  {
    name: 'Generic SAML 2.0',
    id: 'generic-saml',
    stepCount: 3,
  },
  {
    name: 'OIDC Provider',
    id: 'generic-oidc',
    stepCount: 2,
  },
];
