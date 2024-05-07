import test, { expect } from '@playwright/test';

test('Create SAML Federated app', async ({ page }) => {
  await page.goto('/admin/settings');
  await page.getByRole('link', { name: 'Apps' }).click();
  await expect(page).toHaveURL(/.*admin\/identity-federation/);
  await page.getByRole('button', { name: 'New App' }).click();
  await page.getByPlaceholder('Your app').fill('SF-1');
  await page.getByPlaceholder('example.com').fill('boxyhq.com');
  await page.getByPlaceholder('MyApp').fill('demo');
  await page.getByPlaceholder('https://your-sp.com/saml/acs').fill('http://localhost:5225/api/oauth/saml');
  await page.getByPlaceholder('https://your-sp.com/saml/entityId').fill('http://saml.boxyhq.com');
  await page.getByRole('button', { name: 'Create App' }).click();
  await page.getByRole('link', { name: 'Back' }).click();
  await expect(page.getByRole('cell', { name: 'SF-1' })).toBeVisible();
});
