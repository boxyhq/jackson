import { test } from '@playwright/test';

test('MAGIC_LINK in globalSetup should log me in', async ({ page }) => {
  await page.goto('/admin/saml/config');

  await page.waitForSelector('text=/SAML Connections/', {
    state: 'visible',
  });

  console.log('done');

  await page.close();

  // await expect(page.locator('text=modal title')).toBeVisible();

  // Find an element with the text 'SAML Connections' and click on it
  //await page.waitForSelector('text=SAML Connections');
});
