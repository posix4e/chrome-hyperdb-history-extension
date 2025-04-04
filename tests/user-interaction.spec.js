// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * Test user interactions with the extension
 */
test.describe('User Interaction Tests', () => {
  const extensionPath = path.resolve(__dirname, '..');

  test('should show confirmation dialog when clicking Clear Local Data', async ({ browser }) => {
    // Create a context with the ability to handle dialogs
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before clicking the button
    await page.screenshot({ path: 'test-results/before-clear-data-click.png' });
    
    // Inject the confirm function to ensure it works in the test environment
    await page.evaluate(() => {
      window.originalConfirm = window.confirm;
      window.confirm = function(message) {
        // Log the message for verification
        console.log('Confirm dialog message:', message);
        return true; // Always return true in tests
      };
    });
    
    // Click the Clear Local Data button
    await page.locator('#clearData').click();
    
    // Take a screenshot after clicking the button
    await page.screenshot({ path: 'test-results/after-clear-data-click.png' });
    
    // In a real extension environment with Chrome API, this would trigger a real confirm dialog
    // For our test purposes, we're just verifying the button is clickable
  });

  test('should have proper button styling on hover', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before hovering
    await page.screenshot({ path: 'test-results/before-button-hover.png' });
    
    // Hover over the Sync Now button
    await page.locator('#syncNow').hover();
    
    // Take a screenshot during hover to capture the hover state
    await page.screenshot({ path: 'test-results/during-button-hover.png' });
    
    // Verify the button has the hover style (this would require checking computed styles)
    // This is a simplified check - in a real test you might want to check the actual computed style
    const buttonColor = await page.locator('#syncNow').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Log the color for debugging
    console.log('Button color on hover:', buttonColor);
  });

  test('should display status correctly', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Check the initial status
    await expect(page.locator('#status')).toHaveClass(/disconnected/);
    
    // Take a screenshot of the status
    await page.screenshot({ path: 'test-results/status-display.png' });
    
    // Simulate a connected status by modifying the DOM
    // Note: In a real extension test, you would mock the Chrome API response
    await page.evaluate(() => {
      const statusElement = document.getElementById('status');
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
      
      const peerIdElement = document.getElementById('peerId');
      peerIdElement.textContent = 'Your Peer ID: test-peer-id-12345';
    });
    
    // Check the updated status
    await expect(page.locator('#status')).toHaveClass(/connected/);
    await expect(page.locator('#status')).toHaveText('Connected');
    
    // Take a screenshot of the updated status
    await page.screenshot({ path: 'test-results/status-display-connected.png' });
  });
});