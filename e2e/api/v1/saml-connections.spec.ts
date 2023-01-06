import { test, expect } from '@playwright/test';
import { createConnection, getConnection, deleteConnection, updateConnection } from './helpers';

const rawMetadata = `<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://saml.example.com/entityid" validUntil="2033-01-05T12:15:32.426Z"><md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIC4jCCAcoCCQC33wnybT5QZDANBgkqhkiG9w0BAQsFADAyMQswCQYDVQQGEwJV SzEPMA0GA1UECgwGQm94eUhRMRIwEAYDVQQDDAlNb2NrIFNBTUwwIBcNMjIwMjI4 MjE0NjM4WhgPMzAyMTA3MDEyMTQ2MzhaMDIxCzAJBgNVBAYTAlVLMQ8wDQYDVQQK DAZCb3h5SFExEjAQBgNVBAMMCU1vY2sgU0FNTDCCASIwDQYJKoZIhvcNAQEBBQAD ggEPADCCAQoCggEBALGfYettMsct1T6tVUwTudNJH5Pnb9GGnkXi9Zw/e6x45DD0 RuRONbFlJ2T4RjAE/uG+AjXxXQ8o2SZfb9+GgmCHuTJFNgHoZ1nFVXCmb/Hg8Hpd 4vOAGXndixaReOiq3EH5XvpMjMkJ3+8+9VYMzMZOjkgQtAqO36eAFFfNKX7dTj3V pwLkvz6/KFCq8OAwY+AUi4eZm5J57D31GzjHwfjH9WTeX0MyndmnNB1qV75qQR3b 2/W5sGHRv+9AarggJkF+ptUkXoLtVA51wcfYm6hILptpde5FQC8RWY1YrswBWAEZ NfyrR4JeSweElNHg4NVOs4TwGjOPwWGqzTfgTlECAwEAATANBgkqhkiG9w0BAQsF AAOCAQEAAYRlYflSXAWoZpFfwNiCQVE5d9zZ0DPzNdWhAybXcTyMf0z5mDf6FWBW 5Gyoi9u3EMEDnzLcJNkwJAAc39Apa4I2/tml+Jy29dk8bTyX6m93ngmCgdLh5Za4 khuU3AM3L63g7VexCuO7kwkjh/+LqdcIXsVGO6XDfu2QOs1Xpe9zIzLpwm/RNYeX UjbSj5ce/jekpAw7qyVVL4xOyh8AtUW1ek3wIw1MJvEgEPt0d16oshWJpoS1OT8L r/22SvYEo3EmSGdTVGgk3x3s+A0qWAqTcyjr7Q4s/GKYRFfomGwz0TZ4Iw1ZN99M m0eo2USlSRTVl7QHRTuiuSThHpLKQQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://mocksaml.com/api/saml/sso" /><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://mocksaml.com/api/saml/sso" /></md:IDPSSODescriptor></md:EntityDescriptor>`;

const expectedConnection = {
  tenant: 'api-boxyhq',
  product: 'api-saml-jackson',
  defaultRedirectUrl: 'http://localhost:3366/login/saml',
  redirectUrl: ['http://localhost:3366/*'],
  name: 'connection name',
  description: 'connection description',
  forceAuthn: false,
  idpMetadata: {
    sso: {
      postUrl: 'https://mocksaml.com/api/saml/sso',
      redirectUrl: 'https://mocksaml.com/api/saml/sso',
    },
    slo: {},
    entityID: 'https://saml.example.com/entityid',
    loginType: 'idp',
    provider: 'saml.example.com',
  },
};

test.describe('SAML SSO Connection', () => {
  const { tenant, product, defaultRedirectUrl, redirectUrl, name, description } = expectedConnection;

  test.afterAll(async ({ request }) => {
    await deleteConnection(request, {
      tenant,
      product,
    });
  });

  test('should be able to create a SSO Connection', async ({ request }) => {
    const response = await createConnection(request, {
      tenant,
      product,
      name,
      description,
      defaultRedirectUrl,
      redirectUrl,
      rawMetadata,
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject(expectedConnection);
  });

  test('should be able to get SSO Connections', async ({ request }) => {
    const response = await getConnection(request, tenant, product);

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject([expectedConnection]);
  });

  test('should be able to update a SSO Connection', async ({ request }) => {
    // Fetch the connection to get the clientID and clientSecret
    let response = await getConnection(request, tenant, product);
    const { clientID, clientSecret } = (await response.json())[0];

    // Update the connection
    response = await updateConnection(request, {
      tenant,
      product,
      clientID,
      clientSecret,
      name: 'new connection name',
      description: 'new connection description',
      defaultRedirectUrl: 'http://localhost:3366/login/saml-new',
      redirectUrl: 'http://localhost:3366/new/*',
      metadataUrl: 'https://mocksaml.com/api/saml/metadata',
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(204);

    // Fetch the connection again to check if the update was successful
    response = await getConnection(request, tenant, product);

    expect(await response.json()).toMatchObject([
      {
        name: 'new connection name',
        description: 'new connection description',
        defaultRedirectUrl: 'http://localhost:3366/login/saml-new',
        redirectUrl: ['http://localhost:3366/new/*'],
      },
    ]);
  });

  test('should be able to delete a SSO Connection', async ({ request }) => {
    // Delete the connection
    let response = await deleteConnection(request, {
      tenant,
      product,
    });

    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(204);

    // Fetch the connection again to check if the delete was successful
    response = await getConnection(request, tenant, product);

    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject([]);
  });

  test('should not be able to create a SSO Connection if params are invalid', async ({ request }) => {
    const testCases = [
      {
        data: {
          tenant: null,
          product: 'saml-jackson',
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide tenant',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: null,
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide product',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: 'saml-jackson',
          defaultRedirectUrl: null,
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide a defaultRedirectUrl',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: 'saml-jackson',
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: null,
          metadataUrl: 'https://mocksaml.com/api/saml/metadata',
        },
        expectedError: 'Please provide redirectUrl',
      },
      {
        data: {
          tenant: 'boxyhq',
          product: 'saml-jackson',
          defaultRedirectUrl: 'http://localhost:3366/login/saml',
          redirectUrl: ['http://localhost:3366/*'],
          metadataUrl: null,
        },
        expectedError: 'Please provide rawMetadata or encodedRawMetadata or metadataUrl',
      },
    ];

    for (const testCase of testCases) {
      const response = await createConnection(request, testCase.data);

      expect(response.ok()).toBe(false);
      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { message: testCase.expectedError },
      });
    }
  });
});
