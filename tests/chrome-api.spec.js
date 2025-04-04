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
    
    // Take a screenshot of the empty page
    await page.screenshot({ path: 'screenshots/14-before-mock-api-injection.png' });
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before mock API injection (should show disconnected)
    await page.screenshot({ path: 'screenshots/15-popup-before-mock-api.png' });
    
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
    
    // Take a screenshot with the mock API (should show connected)
    await page.screenshot({ path: 'screenshots/16-popup-with-mock-api.png' });
    
    // Highlight the connected status and peer ID
    await page.evaluate(() => {
      const elements = ['#status', '#peerId'];
      elements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.border = '3px solid green';
          element.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        }
      });
    });
    
    // Take a screenshot with highlighted elements
    await page.screenshot({ path: 'screenshots/17-mock-api-connected-highlighted.png' });
    
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
    
    // Inject the mock Chrome API and override alert to avoid dialog
    await page.addInitScript(() => {
      // Mock Chrome API
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
      
      // Override alert to avoid dialog issues
      window.originalAlert = window.alert;
      window.alertMessage = '';
      window.alert = function(message) {
        window.alertMessage = message;
        console.log('Alert message:', message);
      };
    });
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before clicking
    await page.screenshot({ path: 'screenshots/18-before-sync-click.png' });
    
    // Highlight the Sync Now button
    await page.evaluate(() => {
      const syncButton = document.querySelector('#syncNow');
      if (syncButton) {
        syncButton.style.border = '3px solid blue';
        syncButton.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
      }
    });
    
    // Take a screenshot with the button highlighted
    await page.screenshot({ path: 'screenshots/19-sync-button-highlighted.png' });
    
    // Click the Sync Now button
    await page.locator('#syncNow').click();
    
    // Wait for the alert to be processed
    await page.waitForTimeout(1000);
    
    // Create a visual representation of the alert
    await page.evaluate(() => {
      const alertBox = document.createElement('div');
      alertBox.style.position = 'fixed';
      alertBox.style.top = '50%';
      alertBox.style.left = '50%';
      alertBox.style.transform = 'translate(-50%, -50%)';
      alertBox.style.padding = '20px';
      alertBox.style.backgroundColor = 'white';
      alertBox.style.border = '2px solid #333';
      alertBox.style.borderRadius = '5px';
      alertBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      alertBox.style.zIndex = '9999';
      
      alertBox.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">Alert</div>
        <div>${window.alertMessage}</div>
        <div style="text-align: right; margin-top: 15px;">
          <button style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">OK</button>
        </div>
      `;
      
      document.body.appendChild(alertBox);
    });
    
    // Take a screenshot with the simulated alert
    await page.screenshot({ path: 'screenshots/20-sync-alert-dialog.png' });
    
    // Remove the simulated alert
    await page.evaluate(() => {
      const alertBox = document.body.querySelector('div[style*="position: fixed"]');
      if (alertBox) {
        alertBox.remove();
      }
    });
    
    // Take a screenshot after clicking and alert is dismissed
    await page.screenshot({ path: 'screenshots/21-after-sync-click.png' });
    
    // Get the alert message from the page
    const alertMessage = await page.evaluate(() => window.alertMessage);
    
    // Verify the alert message
    expect(alertMessage).toBe('Sync started successfully!');
  });

  test('should handle clear data button click with mock API', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Inject the mock Chrome API and override dialogs
    await page.addInitScript(() => {
      // Mock Chrome API
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
      
      // Override confirm and alert to avoid dialog issues
      window.originalConfirm = window.confirm;
      window.originalAlert = window.alert;
      window.confirmMessage = '';
      window.alertMessage = '';
      
      window.confirm = function(message) {
        window.confirmMessage = message;
        console.log('Confirm message:', message);
        return true; // Always return true in tests
      };
      
      window.alert = function(message) {
        window.alertMessage = message;
        console.log('Alert message:', message);
      };
    });
    
    // Navigate to the extension's popup page
    await page.goto(`file://${path.join(extensionPath, 'popup.html')}`);
    
    // Take a screenshot before clicking
    await page.screenshot({ path: 'screenshots/22-before-clear-data-click.png' });
    
    // Highlight the Clear Local Data button
    await page.evaluate(() => {
      const clearButton = document.querySelector('#clearData');
      if (clearButton) {
        clearButton.style.border = '3px solid red';
        clearButton.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      }
    });
    
    // Take a screenshot with the button highlighted
    await page.screenshot({ path: 'screenshots/23-clear-button-highlighted.png' });
    
    // Click the Clear Local Data button
    await page.locator('#clearData').click();
    
    // Wait for the dialogs to be processed
    await page.waitForTimeout(1000);
    
    // Create a visual representation of the confirm dialog
    await page.evaluate(() => {
      const confirmBox = document.createElement('div');
      confirmBox.style.position = 'fixed';
      confirmBox.style.top = '50%';
      confirmBox.style.left = '50%';
      confirmBox.style.transform = 'translate(-50%, -50%)';
      confirmBox.style.padding = '20px';
      confirmBox.style.backgroundColor = 'white';
      confirmBox.style.border = '2px solid #333';
      confirmBox.style.borderRadius = '5px';
      confirmBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      confirmBox.style.zIndex = '9999';
      
      confirmBox.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">Confirm</div>
        <div>${window.confirmMessage}</div>
        <div style="text-align: right; margin-top: 15px;">
          <button style="padding: 5px 10px; margin-right: 5px; background: #6c757d; color: white; border: none; border-radius: 3px;">Cancel</button>
          <button style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">OK</button>
        </div>
      `;
      
      document.body.appendChild(confirmBox);
    });
    
    // Take a screenshot with the simulated confirm dialog
    await page.screenshot({ path: 'screenshots/24-confirm-dialog-1.png' });
    
    // Remove the simulated confirm dialog
    await page.evaluate(() => {
      const confirmBox = document.body.querySelector('div[style*="position: fixed"]');
      if (confirmBox) {
        confirmBox.remove();
      }
    });
    
    // Create a visual representation of the alert dialog
    await page.evaluate(() => {
      const alertBox = document.createElement('div');
      alertBox.style.position = 'fixed';
      alertBox.style.top = '50%';
      alertBox.style.left = '50%';
      alertBox.style.transform = 'translate(-50%, -50%)';
      alertBox.style.padding = '20px';
      alertBox.style.backgroundColor = 'white';
      alertBox.style.border = '2px solid #333';
      alertBox.style.borderRadius = '5px';
      alertBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      alertBox.style.zIndex = '9999';
      
      alertBox.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px;">Alert</div>
        <div>${window.alertMessage}</div>
        <div style="text-align: right; margin-top: 15px;">
          <button style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">OK</button>
        </div>
      `;
      
      document.body.appendChild(alertBox);
    });
    
    // Take a screenshot with the simulated alert dialog
    await page.screenshot({ path: 'screenshots/24-alert-dialog-2.png' });
    
    // Remove the simulated alert dialog
    await page.evaluate(() => {
      const alertBox = document.body.querySelector('div[style*="position: fixed"]');
      if (alertBox) {
        alertBox.remove();
      }
    });
    
    // Take a screenshot after clicking and dialogs are dismissed
    await page.screenshot({ path: 'screenshots/25-after-clear-data-click.png' });
    
    // Add annotations to show what happened
    await page.evaluate(() => {
      // Create an overlay to show the sequence of events
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.right = '10px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.zIndex = '9999';
      overlay.style.maxWidth = '250px';
      
      overlay.innerHTML = `
        <h3>Test Sequence:</h3>
        <ol>
          <li>Clicked "Clear Local Data"</li>
          <li>Confirmation dialog appeared</li>
          <li>Clicked "OK" on confirmation</li>
          <li>Success alert appeared</li>
          <li>Clicked "OK" on alert</li>
        </ol>
      `;
      
      document.body.appendChild(overlay);
    });
    
    // Take a final screenshot with annotations
    await page.screenshot({ path: 'screenshots/26-clear-data-test-summary.png' });
    
    // Get the dialog messages from the page
    const confirmMessage = await page.evaluate(() => window.confirmMessage);
    const alertMessage = await page.evaluate(() => window.alertMessage);
    
    // Verify the dialog messages
    expect(confirmMessage).toContain('Are you sure you want to clear all locally stored history data?');
    expect(alertMessage).toBe('Data cleared successfully!');
  });
});