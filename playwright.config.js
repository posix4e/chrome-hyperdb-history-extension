// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  // Shorter timeout in CI environment
  timeout: process.env.CI ? 30000 : 60000,
  expect: {
    timeout: process.env.CI ? 5000 : 10000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  outputDir: 'test-results/',
  use: {
    baseURL: 'http://localhost:12000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // In CI, only run the simple test that doesn't require extension functionality
      testMatch: process.env.CI ? ['**/ci-test.spec.js'] : undefined,
    },
  ],
  webServer: {
    command: 'node server.js',
    port: 12000,
    reuseExistingServer: !process.env.CI,
  },
});