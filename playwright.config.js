// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60 * 1000, // Longer timeout for extension tests
  expect: {
    timeout: 10000 // Longer timeout for assertions
  },
  fullyParallel: false, // Run tests sequentially for extension testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use a single worker for extension tests
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure', // Only take screenshots on failure
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific flags for extension testing
        launchOptions: {
          args: [
            '--disable-extensions-except=.',
            '--load-extension=.',
            '--disable-features=TranslateUI',
            '--disable-component-extensions-with-background-pages',
            '--no-sandbox'
          ]
        }
      },
    },
  ],
  outputDir: 'test-results/',
  preserveOutput: 'failures-only',
});