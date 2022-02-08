import { PlaywrightTestConfig, devices } from '@playwright/test';
import path from 'path';

// Reference: https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
  globalSetup: require.resolve('./e2e/globalSetup'),
  // Timeout per test
  timeout: 30 * 1000,
  // Test directory
  testDir: path.join(__dirname, 'e2e'),
  // If a test fails, retry it additional 2 times
  retries: 2,
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: 'test-results/',

  // Run your local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run postgres',
    // env: {
    //   SAML_AUDIENCE: 'https://saml.boxyhq.com',
    //   JACKSON_API_KEYS: 'secret',
    //   DB_ENGINE: 'sql',
    //   DB_URL: 'postgres://postgres:postgres@localhost:5432/postgres',
    //   DB_TYPE: 'postgres',
    //   DEBUG: 'pw:webserver',
    //   NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
    //   NEXTAUTH_URL: 'http://localhost:5000',
    // },
    port: 5000,
    timeout: 60 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  use: {
    // Retry a test if its failing with enabled tracing. This allows you to analyse the DOM, console logs, network traffic etc.
    // More information: https://playwright.dev/docs/trace-viewer
    trace: 'retry-with-trace',
    storageState: './e2e/state.json',
    headless: !!process.env.CI,

    // All available context options: https://playwright.dev/docs/api/class-browser#browser-new-context
    // contextOptions: {
    //   ignoreHTTPSErrors: true,
    // },
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5000',
        storageState: './e2e/state.json',
      },
    },
    // {
    //   name: 'Desktop Firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },
    // {
    //   name: 'Desktop Safari',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },
    // Test against mobile viewports.
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: devices['iPhone 12'],
    // },
  ],
};
export default config;
