// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { IDENTIFIER, TOKEN } from './nextAuth.constants';

async function globalSetup(config: FullConfig) {
  // Env init
  process.env.MOCKSAML_ORIGIN = process.env.CI ? 'http://localhost:4000' : 'https://mocksaml.com';
  // Magic Link Login
  const { baseURL, storageState } = config.projects[0].use;
  // Generate a link with email, unhashed token and callback url
  const params = new URLSearchParams({ callbackURL: baseURL || '', token: TOKEN, email: IDENTIFIER });
  const providerId = 'email';
  const MAGIC_LINK = `${baseURL}/api/auth/callback/${providerId}?${params}`;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(MAGIC_LINK);
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
