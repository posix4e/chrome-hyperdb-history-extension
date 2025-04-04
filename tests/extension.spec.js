// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Test the Chrome extension functionality
 */
test.describe('HyperDB History Extension', () => {
  // Define the extension path
  const extensionPath = path.resolve(__dirname, '..');

  test.beforeEach(async ({ context }) => {
    // Create a clean context for each test
    await context.clearCookies();
  });

  test('should load the extension popup correctly', async ({ browser }) => {
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the extension's popup page (using a local file path)
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot of the popup
    await page.screenshot({ path: 'test-results/popup-screenshot.png' });
    
    // Verify the popup elements are present
    await expect(page.locator('h2')).toHaveText('HyperDB History Sync');
    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#syncNow')).toBeVisible();
    await expect(page.locator('#clearData')).toBeVisible();
  });

  test('should display the correct UI elements in the popup', async ({ browser }) => {
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Check that all UI elements are present
    await expect(page.locator('h2')).toHaveText('HyperDB History Sync');
    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#syncNow')).toHaveText('Sync Now');
    await expect(page.locator('#clearData')).toHaveText('Clear Local Data');
    
    // Take a screenshot of the UI elements
    await page.screenshot({ path: 'test-results/popup-ui-elements.png' });
  });

  test('should have the correct initial status', async ({ browser }) => {
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Check the initial status (should be disconnected since we're not running in a real extension context)
    await expect(page.locator('#status')).toHaveClass(/disconnected/);
    await expect(page.locator('#status')).toHaveText('Disconnected');
    
    // Take a screenshot of the initial status
    await page.screenshot({ path: 'test-results/popup-initial-status.png' });
  });

  // This test would require mocking the Chrome extension API
  test('should show buttons that are clickable', async ({ browser }) => {
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Check that buttons are enabled
    await expect(page.locator('#syncNow')).toBeEnabled();
    await expect(page.locator('#clearData')).toBeEnabled();
    
    // Take a screenshot of the buttons
    await page.screenshot({ path: 'test-results/popup-buttons.png' });
  });
});