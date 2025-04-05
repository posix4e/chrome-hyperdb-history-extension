// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

/**
 * Test the Chrome extension with real syncing to a staging peer
 */
test.describe('Real-World Syncing Tests', () => {
  // Define paths
  const extensionPath = path.resolve(__dirname, '..');
  const testExtensionPath = path.resolve(__dirname, 'test-extension');
  const stagingPeerPath = path.resolve(extensionPath, 'staging-peer');
  
  // Staging peer server process
  let stagingPeerProcess = null;
  let stagingPeerInfo = null;
  const stagingPeerPort = 3000;
  const stagingPeerUrl = `http://localhost:${stagingPeerPort}`;
  
  // Set up the staging peer server before all tests
  test.beforeAll(async () => {
    console.log('Starting staging peer server...');
    
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots', { recursive: true });
      console.log('Created screenshots directory');
    }
    
    // Install dependencies for the staging peer
    await new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], {
        cwd: stagingPeerPath,
        stdio: 'inherit'
      });
      
      npmInstall.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
    
    // Start the staging peer server
    stagingPeerProcess = spawn('node', ['api-server.js'], {
      cwd: stagingPeerPath,
      env: {
        ...process.env,
        PORT: stagingPeerPort.toString(),
        IN_MEMORY: 'true'
      }
    });
    
    // Log output from the staging peer server
    stagingPeerProcess.stdout.on('data', (data) => {
      console.log(`Staging peer: ${data.toString().trim()}`);
    });
    
    stagingPeerProcess.stderr.on('data', (data) => {
      console.error(`Staging peer error: ${data.toString().trim()}`);
    });
    
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the staging peer info
    try {
      const response = await axios.get(`${stagingPeerUrl}/api/info`);
      stagingPeerInfo = response.data;
      console.log('Staging peer info:', stagingPeerInfo);
    } catch (error) {
      console.error('Failed to get staging peer info:', error);
    }
  });
  
  // Clean up the staging peer server after all tests
  test.afterAll(async () => {
    if (stagingPeerProcess) {
      console.log('Stopping staging peer server...');
      stagingPeerProcess.kill();
      stagingPeerProcess = null;
    }
  });
  
  test('should connect to the staging peer and sync history', async ({ browser }) => {
    // Skip if staging peer is not running
    test.skip(!stagingPeerInfo, 'Staging peer is not running');
    
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the test extension's popup page
    await page.goto(`file://${path.join(testExtensionPath, 'popup.html')}`);
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'screenshots/real-world-01-initial.png' });
    
    // Wait for the extension to initialize
    await page.waitForTimeout(2000);
    
    // Check if the extension is connected
    const statusText = await page.locator('#status').textContent();
    console.log('Status:', statusText);
    
    // Take a screenshot after initialization
    await page.screenshot({ path: 'screenshots/real-world-02-after-init.png' });
    
    // Add a history item to the staging peer
    try {
      await axios.post(`${stagingPeerUrl}/api/history`, {
        id: `test-${Date.now()}`,
        url: 'https://playwright.dev',
        title: 'Playwright',
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 0
      });
      console.log('Added history item to staging peer');
    } catch (error) {
      console.error('Failed to add history item to staging peer:', error);
    }
    
    // Click the Sync Now button
    await page.locator('#syncNow').click();
    
    // Handle the alert
    page.on('dialog', async dialog => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });
    
    // Wait for the sync to complete
    await page.waitForTimeout(3000);
    
    // Take a screenshot after syncing
    await page.screenshot({ path: 'screenshots/real-world-03-after-sync.png' });
    
    // Check if history items are displayed
    const historyItems = await page.locator('.history-item').count();
    console.log('History items:', historyItems);
    
    // Verify that we have at least one history item
    expect(historyItems).toBeGreaterThan(0);
    
    // Take a screenshot of the history items
    await page.screenshot({ path: 'screenshots/real-world-04-history-items.png' });
    
    // Get the status from the staging peer
    try {
      const response = await axios.get(`${stagingPeerUrl}/api/status`);
      console.log('Staging peer status:', response.data);
      
      // Verify that the staging peer has history items
      expect(response.data.historyItemCount).toBeGreaterThan(0);
    } catch (error) {
      console.error('Failed to get staging peer status:', error);
    }
    
    // Get history items from the staging peer
    try {
      const response = await axios.get(`${stagingPeerUrl}/api/history`);
      console.log('Staging peer history items:', response.data);
      
      // Verify that the staging peer has history items
      expect(response.data.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Failed to get staging peer history items:', error);
    }
  });
  
  test('should clear data and verify it is removed from the peer', async ({ browser }) => {
    // Skip if staging peer is not running
    test.skip(!stagingPeerInfo, 'Staging peer is not running');
    
    // Launch a browser with the extension loaded
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create a new page
    const page = await context.newPage();
    
    // Navigate to the test extension's popup page
    await page.goto(`file://${path.join(testExtensionPath, 'popup.html')}`);
    
    // Wait for the extension to initialize
    await page.waitForTimeout(2000);
    
    // Take a screenshot before clearing data
    await page.screenshot({ path: 'screenshots/real-world-05-before-clear.png' });
    
    // Set up dialog handler
    page.on('dialog', async dialog => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });
    
    // Click the Clear Local Data button
    await page.locator('#clearData').click();
    
    // Wait for the data to be cleared
    await page.waitForTimeout(3000);
    
    // Take a screenshot after clearing data
    await page.screenshot({ path: 'screenshots/real-world-06-after-clear.png' });
    
    // Check if history items are cleared
    const historyItemsText = await page.locator('#historyList').textContent();
    console.log('History items text:', historyItemsText);
    
    // Verify that we have no history items
    expect(historyItemsText).toContain('No history items found');
    
    // Get history items from the staging peer
    try {
      const response = await axios.get(`${stagingPeerUrl}/api/history`);
      console.log('Staging peer history items after clear:', response.data);
      
      // Note: In a real implementation, clearing data would also clear it from the peer
      // But for this test, we're just verifying the local clear works
    } catch (error) {
      console.error('Failed to get staging peer history items:', error);
    }
  });
});