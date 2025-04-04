// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const { MockChromeAPI } = require('./mock-chrome-api');

/**
 * Test the extension with a mocked Chrome API
 */
test.describe('Chrome API Integration', () => {
  const extensionPath = path.resolve(__dirname, '..');

  test('should handle Chrome API interactions correctly', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Create a mock Chrome API
    const mockChromeAPI = new MockChromeAPI();
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Inject the mock Chrome API before the page's scripts run
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage: (message, callback) => {
            if (message.action === 'getStatus') {
              callback({
                connected: true,
                peerId: 'mock-peer-id-12345',
                peerCount: 3
              });
            } else if (message.action === 'syncNow') {
              callback({ success: true });
            } else if (message.action === 'clearData') {
              callback({ success: true });
            }
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          }
        }
      };
    });
    
    // Reload the page to apply the mock
    await page.reload();
    
    // Wait for the page to stabilize
    await page.waitForTimeout(1000);
    
    // Take a screenshot with the mock API
    await page.screenshot({ path: 'test-results/mock-chrome-api.png' });
    
    // Check if the status shows as connected (which should happen with our mock)
    await expect(page.locator('#status')).toHaveText('Connected');
    await expect(page.locator('#status')).toHaveClass(/connected/);
    
    // Check if the peer ID is displayed
    await expect(page.locator('#peerId')).toContainText('mock-peer-id-12345');
  });

  test('should handle sync button click with mock API', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Set up dialog handler to capture alerts
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });
    
    // Inject the mock Chrome API
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage: (message, callback) => {
            if (message.action === 'getStatus') {
              callback({
                connected: true,
                peerId: 'mock-peer-id-12345',
                peerCount: 3
              });
            } else if (message.action === 'syncNow') {
              callback({ success: true });
            } else if (message.action === 'clearData') {
              callback({ success: true });
            }
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          }
        }
      };
    });
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before clicking
    await page.screenshot({ path: 'test-results/before-sync-click.png' });
    
    // Click the Sync Now button
    await page.locator('#syncNow').click();
    
    // Wait for the alert to appear
    await page.waitForTimeout(1000);
    
    // Take a screenshot after clicking
    await page.screenshot({ path: 'test-results/after-sync-click.png' });
    
    // Verify the alert message
    expect(alertMessage).toBe('Sync started successfully!');
  });

  test('should handle clear data button click with mock API', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Set up dialog handler to capture confirms and alerts
    const dialogs = [];
    page.on('dialog', async dialog => {
      dialogs.push({
        type: dialog.type(),
        message: dialog.message()
      });
      
      // Accept all dialogs (confirm and alert)
      await dialog.accept();
    });
    
    // Inject the mock Chrome API
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          sendMessage: (message, callback) => {
            if (message.action === 'getStatus') {
              callback({
                connected: true,
                peerId: 'mock-peer-id-12345',
                peerCount: 3
              });
            } else if (message.action === 'syncNow') {
              callback({ success: true });
            } else if (message.action === 'clearData') {
              callback({ success: true });
            }
          },
          onMessage: {
            addListener: () => {},
            removeListener: () => {}
          }
        }
      };
    });
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before clicking
    await page.screenshot({ path: 'test-results/before-clear-data-click-mock.png' });
    
    // Click the Clear Local Data button
    await page.locator('#clearData').click();
    
    // Wait for the dialogs to appear
    await page.waitForTimeout(1000);
    
    // Take a screenshot after clicking
    await page.screenshot({ path: 'test-results/after-clear-data-click-mock.png' });
    
    // Verify the dialog messages
    expect(dialogs.length).toBe(2);
    expect(dialogs[0].type).toBe('confirm');
    expect(dialogs[0].message).toContain('Are you sure you want to clear all locally stored history data?');
    expect(dialogs[1].type).toBe('alert');
    expect(dialogs[1].message).toBe('Data cleared successfully!');
  });
});