import { test as base, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { devices } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

// Import browser settings from the main config
// We're extracting the key browser settings that should be consistent
const browserSettings = {
  // Use non-headless mode for extension testing (xvfb handles this in CI)
  headless: false,
  // Standard args needed for extension testing
  args: [
    `--disable-extensions-except=${projectRoot}`,
    `--load-extension=${projectRoot}`,
    '--no-sandbox',
  ],
  // Use the same device settings as in the config
  ...devices['Desktop Chrome']
};

/**
 * Extension test fixture that loads the Chrome extension
 */
export const test = base.extend({
  // Define a fixture for a context with the extension loaded
  context: async ({}, use) => {
    // Launch a browser with the extension loaded
    const context = await chromium.launchPersistentContext('', browserSettings);
    
    // Use the context in the test
    await use(context);
    
    // Clean up after the test
    await context.close();
  },
  
  // Define a fixture for a page with the extension loaded
  extensionPage: async ({ context }, use) => {
    // Get the background page of the extension
    const backgroundPages = context.backgroundPages();
    const backgroundPage = backgroundPages.length ? backgroundPages[0] : await context.waitForEvent('backgroundpage');
    
    // Create a new page
    const page = await context.newPage();
    
    // Add helper methods to the page
    page.getBackgroundPage = () => backgroundPage;
    
    // Open the extension popup
    page.openPopup = async () => {
      // Get the extension ID
      const extensionId = backgroundPage.url().split('/')[2];
      
      // Navigate to the popup page
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      return page;
    };
    
    // Use the page in the test
    await use(page);
  },
  
  // Define a fixture for a second browser instance to test P2P functionality
  secondContext: async ({}, use) => {
    // Launch a second browser with the extension loaded
    // Use a different user data directory to ensure separate instances
    const context = await chromium.launchPersistentContext('user-data-dir-2', browserSettings);
    
    // Use the context in the test
    await use(context);
    
    // Clean up after the test
    await context.close();
  },
  
  // Define a fixture for a page in the second browser instance
  secondExtensionPage: async ({ secondContext }, use) => {
    // Get the background page of the extension
    const backgroundPages = secondContext.backgroundPages();
    const backgroundPage = backgroundPages.length ? backgroundPages[0] : await secondContext.waitForEvent('backgroundpage');
    
    // Create a new page
    const page = await secondContext.newPage();
    
    // Add helper methods to the page
    page.getBackgroundPage = () => backgroundPage;
    
    // Open the extension popup
    page.openPopup = async () => {
      // Get the extension ID
      const extensionId = backgroundPage.url().split('/')[2];
      
      // Navigate to the popup page
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      return page;
    };
    
    // Use the page in the test
    await use(page);
  },
});