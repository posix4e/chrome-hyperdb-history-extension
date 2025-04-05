// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Test the Chrome extension with direct P2P syncing between browser instances
 */
test.describe('P2P Syncing Tests', () => {
  // Define paths
  const extensionPath = path.resolve(__dirname, '..');
  const testExtensionPath = path.resolve(__dirname, 'test-extension');
  
  // Set up before all tests
  test.beforeAll(async () => {
    console.log('Setting up test environment...');
    
    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync('screenshots')) {
      fs.mkdirSync('screenshots', { recursive: true });
      console.log('Created screenshots directory');
    }
  });
  
  test('should demonstrate P2P syncing between two extension instances', async ({ browser }) => {
    console.log('Starting P2P sync test between two extension instances...');
    
    // Launch two browser instances with the extension loaded
    console.log('Launching first browser instance...');
    const context1 = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    console.log('Launching second browser instance...');
    const context2 = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Create pages for each browser instance
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Set up dialog handlers for both pages
    page1.on('dialog', async dialog => {
      console.log('Dialog in browser 1:', dialog.message());
      await dialog.accept();
    });
    
    page2.on('dialog', async dialog => {
      console.log('Dialog in browser 2:', dialog.message());
      await dialog.accept();
    });
    
    // Navigate to the test extension's popup page in both browsers
    console.log('Opening extension popup in first browser...');
    await page1.goto(`file://${path.join(testExtensionPath, 'popup.html')}`);
    await page1.screenshot({ path: 'screenshots/p2p-01-browser1-initial.png' });
    
    console.log('Opening extension popup in second browser...');
    await page2.goto(`file://${path.join(testExtensionPath, 'popup.html')}`);
    await page2.screenshot({ path: 'screenshots/p2p-02-browser2-initial.png' });
    
    // Wait for both extensions to initialize
    console.log('Waiting for extensions to initialize...');
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);
    
    // Generate a unique test URL and title
    const testTimestamp = Date.now();
    const testUrl = `https://example.com/test-${testTimestamp}`;
    const testTitle = `Test Page ${testTimestamp}`;
    
    // Add a history item to the first browser by directly evaluating in the page context
    console.log('Adding history item to first browser...');
    await page1.evaluate(({ url, title, timestamp }) => {
      // Create a mock history item
      const historyItem = {
        id: `test-${timestamp}`,
        url: url,
        title: title,
        lastVisitTime: timestamp,
        visitCount: 1,
        typedCount: 0
      };
      
      // Send a message to the background script to store this item
      chrome.runtime.sendMessage({ 
        action: 'storeHistoryItem', 
        historyItem: historyItem 
      });
    }, { url: testUrl, title: testTitle, timestamp: testTimestamp });
    
    // Wait for the item to be stored
    await page1.waitForTimeout(1000);
    
    // Sync the first browser
    console.log('Syncing first browser...');
    await page1.locator('#syncNow').click();
    await page1.waitForTimeout(3000);
    await page1.screenshot({ path: 'screenshots/p2p-03-browser1-after-sync.png' });
    
    // Refresh the history display in the first browser
    await page1.evaluate(() => {
      chrome.runtime.sendMessage({ action: 'getHistory' }, function(historyResponse) {
        if (historyResponse && historyResponse.items && historyResponse.items.length > 0) {
          // Call the displayHistoryItems function that exists in the popup context
          window.displayHistoryItems(historyResponse.items);
        }
      });
    });
    
    await page1.waitForTimeout(1000);
    
    // Verify the history item appears in the first browser
    const historyItems1 = await page1.locator('.history-item').count();
    console.log('History items in browser 1:', historyItems1);
    expect(historyItems1).toBeGreaterThan(0);
    
    // Check if the specific test item is in browser 1
    const browser1Content = await page1.content();
    expect(browser1Content).toContain(testTitle);
    expect(browser1Content).toContain(testUrl);
    
    // Now sync the second browser
    console.log('Syncing second browser...');
    await page2.locator('#syncNow').click();
    await page2.waitForTimeout(5000); // Give more time for P2P sync
    
    // Refresh the history display in the second browser
    await page2.evaluate(() => {
      chrome.runtime.sendMessage({ action: 'getHistory' }, function(historyResponse) {
        if (historyResponse && historyResponse.items && historyResponse.items.length > 0) {
          // Call the displayHistoryItems function that exists in the popup context
          window.displayHistoryItems(historyResponse.items);
        }
      });
    });
    
    await page2.waitForTimeout(1000);
    await page2.screenshot({ path: 'screenshots/p2p-04-browser2-after-sync.png' });
    
    // Verify the history item from browser 1 appears in browser 2
    const historyItems2 = await page2.locator('.history-item').count();
    console.log('History items in browser 2:', historyItems2);
    expect(historyItems2).toBeGreaterThan(0);
    
    // Check if the specific test item from browser 1 is now in browser 2
    const browser2Content = await page2.content();
    
    // Take a screenshot showing both browsers side by side with synced content
    console.log('Taking final comparison screenshots...');
    await page1.screenshot({ path: 'screenshots/p2p-05-browser1-final.png' });
    await page2.screenshot({ path: 'screenshots/p2p-06-browser2-final.png' });
    
    // Final verification that the same content appears in both browsers
    expect(browser2Content).toContain(testTitle);
    expect(browser2Content).toContain(testUrl);
    
    console.log('P2P sync test completed successfully!');
  });
  
  test('should clear data and verify it is removed', async ({ browser }) => {
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
    
    // Add a test history item
    const testTimestamp = Date.now();
    await page.evaluate(({ timestamp }) => {
      // Create a mock history item
      const historyItem = {
        id: `clear-test-${timestamp}`,
        url: `https://example.com/clear-test-${timestamp}`,
        title: `Clear Test ${timestamp}`,
        lastVisitTime: timestamp,
        visitCount: 1,
        typedCount: 0
      };
      
      // Send a message to the background script to store this item
      chrome.runtime.sendMessage({ 
        action: 'storeHistoryItem', 
        historyItem: historyItem 
      });
    }, { timestamp: testTimestamp });
    
    // Wait for the item to be stored and refresh the display
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      chrome.runtime.sendMessage({ action: 'getHistory' }, function(historyResponse) {
        if (historyResponse && historyResponse.items && historyResponse.items.length > 0) {
          window.displayHistoryItems(historyResponse.items);
        }
      });
    });
    
    await page.waitForTimeout(1000);
    
    // Take a screenshot before clearing data
    await page.screenshot({ path: 'screenshots/clear-01-before-clear.png' });
    
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
    await page.screenshot({ path: 'screenshots/clear-02-after-clear.png' });
    
    // Check if history items are cleared
    const historyItemsText = await page.locator('#historyList').textContent();
    console.log('History items text:', historyItemsText);
    
    // Verify that we have no history items
    expect(historyItemsText).toContain('No history items found');
  });
});