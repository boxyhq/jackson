import test, { expect } from '@playwright/test';

test('Create SAML Federated app', async ({ page }) => {
  await page.goto('/admin/settings');
  await page.getByRole('link', { name: 'Apps' }).click();
  await page.waitForURL(/.*admin\/identity-federation/);
  await page.getByRole('button', { name: 'New App' }).click();
  await page.waitForURL(/.*admin\/identity-federation\/new/);
  await page.getByPlaceholder('Your app').and(page.getByLabel('Name')).fill('SF-1');
  await page.getByPlaceholder('example.com').and(page.getByLabel('Tenant')).fill('acme.com');
  await page.getByLabel('Product').fill('_jackson_admin_portal');
  await page.getByLabel('ACS URL').fill('http://localhost:5225/api/oauth/saml');
  await page.getByLabel('Entity ID / Audience URI / Audience Restriction').fill('http://saml.boxyhq.com');
  await page.getByRole('button', { name: 'Create App' }).click();
  await page.getByRole('link', { name: 'Back' }).click();
  // await page.waitForURL(/.*admin\/identity-federation/);
  await expect(page.getByRole('cell', { name: 'SF-1' })).toBeVisible();

  // Add SAML connection for Admin portal
  await page.getByRole('link', { name: 'Single Sign-On' }).click();
  await page.getByTestId('create-connection').click();
  await page.getByLabel('Connection name (Optional)').fill('SSO-via-SAML-Fed');
  await page
    .getByPlaceholder('Paste the Metadata URL here')
    .fill('http://localhost:5225/.well-known/idp-metadata');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('cell', { name: 'SSO-via-SAML-Fed' })).toBeVisible();

  // Add SSO connection for tenants
});
