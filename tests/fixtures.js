import { test as base, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extension test fixture that loads the Chrome extension
 */
export const test = base.extend({
  // Define a fixture for a context with the extension loaded
  context: async ({ _browser }, use) => {
    // Get the absolute path to the extension
    const extensionPath = path.resolve(__dirname, '..');
    
    // Launch a browser with the extension loaded
    const context = await chromium.launchPersistentContext('', {
      headless: process.env.CI ? true : false, // Use headless mode in CI environment
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });
    
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
  secondContext: async ({ _browser }, use) => {
    // Get the absolute path to the extension
    const extensionPath = path.resolve(__dirname, '..');
    
    // Launch a second browser with the extension loaded
    const context = await chromium.launchPersistentContext('user-data-dir-2', {
      headless: process.env.CI ? true : false, // Use headless mode in CI environment
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
    });
    
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