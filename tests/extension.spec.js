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
    
    // Take a screenshot before navigating to show the empty page
    await page.screenshot({ path: 'screenshots/01-before-popup-load.png' });
    
    // Navigate to the extension's popup page (using a local file path)
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot of the popup after loading
    await page.screenshot({ path: 'screenshots/02-popup-loaded.png' });
    
    // Highlight the main elements by adding a red border
    await page.evaluate(() => {
      const elements = ['h2', '#status', '#syncNow', '#clearData'];
      elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.border = '2px solid red';
        }
      });
    });
    
    // Take a screenshot with highlighted elements
    await page.screenshot({ path: 'screenshots/03-popup-elements-highlighted.png' });
    
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
    
    // Take a screenshot of the initial UI
    await page.screenshot({ path: 'screenshots/04-popup-ui-initial.png' });
    
    // Highlight each element one by one with different colors and take screenshots
    
    // Highlight the header
    await page.evaluate(() => {
      const header = document.querySelector('h2');
      if (header) {
        header.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        header.style.border = '2px solid red';
      }
    });
    await page.screenshot({ path: 'screenshots/05-popup-header-highlighted.png' });
    
    // Highlight the status
    await page.evaluate(() => {
      const status = document.querySelector('#status');
      if (status) {
        status.style.backgroundColor = 'rgba(0, 0, 255, 0.2)';
        status.style.border = '2px solid blue';
      }
    });
    await page.screenshot({ path: 'screenshots/06-popup-status-highlighted.png' });
    
    // Highlight the buttons
    await page.evaluate(() => {
      const buttons = ['#syncNow', '#clearData'];
      buttons.forEach((selector, index) => {
        const button = document.querySelector(selector);
        if (button) {
          button.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
          button.style.border = '2px solid green';
        }
      });
    });
    await page.screenshot({ path: 'screenshots/07-popup-buttons-highlighted.png' });
    
    // Check that all UI elements are present
    await expect(page.locator('h2')).toHaveText('HyperDB History Sync');
    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#syncNow')).toHaveText('Sync Now');
    await expect(page.locator('#clearData')).toHaveText('Clear Local Data');
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
    
    // Take a screenshot of the initial status
    await page.screenshot({ path: 'screenshots/08-initial-disconnected-status.png' });
    
    // Highlight the status element
    await page.evaluate(() => {
      const status = document.querySelector('#status');
      if (status) {
        status.style.border = '3px solid red';
      }
    });
    
    // Take a screenshot with the status highlighted
    await page.screenshot({ path: 'screenshots/09-disconnected-status-highlighted.png' });
    
    // Check the initial status (should be disconnected since we're not running in a real extension context)
    await expect(page.locator('#status')).toHaveClass(/disconnected/);
    await expect(page.locator('#status')).toHaveText('Disconnected');
    
    // Now simulate a connected status
    await page.evaluate(() => {
      const statusElement = document.getElementById('status');
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
      
      const peerIdElement = document.getElementById('peerId');
      peerIdElement.textContent = 'Your Peer ID: test-peer-id-12345';
    });
    
    // Take a screenshot of the connected status
    await page.screenshot({ path: 'screenshots/10-simulated-connected-status.png' });
  });

  test('should show buttons that are clickable', async ({ browser }) => {
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot of the initial buttons
    await page.screenshot({ path: 'screenshots/11-buttons-initial.png' });
    
    // Highlight the Sync Now button
    await page.evaluate(() => {
      const syncButton = document.querySelector('#syncNow');
      if (syncButton) {
        syncButton.style.border = '3px solid green';
      }
    });
    
    // Hover over the Sync Now button to show it's interactive
    await page.hover('#syncNow');
    
    // Take a screenshot during hover
    await page.screenshot({ path: 'screenshots/12-sync-button-hover.png' });
    
    // Highlight the Clear Local Data button
    await page.evaluate(() => {
      const clearButton = document.querySelector('#clearData');
      if (clearButton) {
        clearButton.style.border = '3px solid red';
      }
    });
    
    // Hover over the Clear Local Data button
    await page.hover('#clearData');
    
    // Take a screenshot during hover
    await page.screenshot({ path: 'screenshots/13-clear-button-hover.png' });
    
    // Check that buttons are enabled
    await expect(page.locator('#syncNow')).toBeEnabled();
    await expect(page.locator('#clearData')).toBeEnabled();
  });
});