// Create SAML connection
// Initate OAuth 2.0 flow
// Login with SAML
// Verify profile page
// Delete SAML connection

import { expect, test } from '@playwright/test';

import jackson from '@lib/jackson';

test.describe('Single connection', () => {
  test('OAuth2 wrapper + SAML provider', async ({ page }) => {
    const { connectionAPIController } = await jackson();

    await connectionAPIController.createSAMLConnection({
      defaultRedirectUrl: 'http://localhost:5225/api/oauth/saml',
      redirectUrl: '["http://localhost:5225"]',
      tenant: 'boxyhq',
      product: 'jackson',
      metadataUrl: 'https://mocksaml.com/api/saml/metadata',
      rawMetadata: '',
    });

    await page.goto('/admin/auth/login');
    await page.getByTestId('sso-login-button').click();
  });
});
