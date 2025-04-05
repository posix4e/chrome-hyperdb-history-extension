import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { test as extensionTest } from './fixtures.js';
import { 
  waitForExtensionToConnect, 
  addHistoryItem, 
  getAllHistoryItems, 
  clearAllData,
  waitForPeerCount
} from './utils.js';

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'test-results/history-merge-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// This test will run in both CI and local environments
// xvfb in CI will provide the necessary display for extension testing

// Use the extension test fixtures
const mergeTest = extensionTest.extend({});

mergeTest.describe('History Merging Demonstration', () => {
  mergeTest.beforeEach(async ({ extensionPage, secondExtensionPage }) => {
    // Open both extension popups
    await extensionPage.openPopup();
    await secondExtensionPage.openPopup();
    
    // Take screenshots of initial state
    await extensionPage.screenshot({ path: path.join(screenshotsDir, '01-browser1-initial.png') });
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '01-browser2-initial.png') });
    
    // Wait for both extensions to connect
    await waitForExtensionToConnect(extensionPage, 15000);
    await waitForExtensionToConnect(secondExtensionPage, 15000);
    
    // Take screenshots after connection
    await extensionPage.screenshot({ path: path.join(screenshotsDir, '02-browser1-connected.png') });
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '02-browser2-connected.png') });
    
    // Clear data in both instances
    await clearAllData(extensionPage);
    await clearAllData(secondExtensionPage);
    
    // Take screenshots after clearing data
    await extensionPage.screenshot({ path: path.join(screenshotsDir, '03-browser1-cleared.png') });
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '03-browser2-cleared.png') });
  });
  
  mergeTest('should demonstrate history merging between two browsers', async ({ extensionPage, secondExtensionPage }) => {
    // Wait for the peers to discover each other
    // Using test.info().annotations instead of console.log for logging
    test.info().annotations.push({ type: 'info', description: 'Waiting for peers to discover each other...' });
    await waitForPeerCount(extensionPage, 1, 30000);
    
    // Take screenshots after peer discovery
    await extensionPage.screenshot({ path: path.join(screenshotsDir, '04-browser1-peer-connected.png') });
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '04-browser2-peer-connected.png') });
    
    // Add a history item in the first browser
    test.info().annotations.push({ type: 'info', description: 'Adding history item in first browser...' });
    const testUrl1 = 'https://example.com/test-browser1-' + Date.now();
    const testTitle1 = 'Test Page from Browser 1';
    await addHistoryItem(extensionPage, testUrl1, testTitle1);
    
    // Take screenshot after adding item in first browser
    await extensionPage.screenshot({ path: path.join(screenshotsDir, '05-browser1-item-added.png') });
    
    // Wait for synchronization (give it some time)
    test.info().annotations.push({ type: 'info', description: 'Waiting for synchronization...' });
    await extensionPage.waitForTimeout(5000);
    
    // Take screenshot of second browser after sync should have happened
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '06-browser2-after-sync1.png') });
    
    // Add a history item in the second browser
    test.info().annotations.push({ type: 'info', description: 'Adding history item in second browser...' });
    const testUrl2 = 'https://example.com/test-browser2-' + Date.now();
    const testTitle2 = 'Test Page from Browser 2';
    await addHistoryItem(secondExtensionPage, testUrl2, testTitle2);
    
    // Take screenshot after adding item in second browser
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '07-browser2-item-added.png') });
    
    // Wait for synchronization again
    test.info().annotations.push({ type: 'info', description: 'Waiting for second synchronization...' });
    await extensionPage.waitForTimeout(5000);
    
    // Take screenshots after second sync
    await extensionPage.screenshot({ path: path.join(screenshotsDir, '08-browser1-after-sync2.png') });
    await secondExtensionPage.screenshot({ path: path.join(screenshotsDir, '08-browser2-after-sync2.png') });
    
    // Get history items from both instances
    const items1 = await getAllHistoryItems(extensionPage);
    const items2 = await getAllHistoryItems(secondExtensionPage);
    
    // Save the history items as JSON for inspection
    fs.writeFileSync(
      path.join(screenshotsDir, 'browser1-history-items.json'), 
      JSON.stringify(items1, null, 2)
    );
    fs.writeFileSync(
      path.join(screenshotsDir, 'browser2-history-items.json'), 
      JSON.stringify(items2, null, 2)
    );
    
    // Find our test items in both instances
    const browser1Item1 = items1.find(item => item.value.url === testUrl1);
    const browser1Item2 = items1.find(item => item.value.url === testUrl2);
    const browser2Item1 = items2.find(item => item.value.url === testUrl1);
    const browser2Item2 = items2.find(item => item.value.url === testUrl2);
    
    // Create a visual report showing the merged history
    const reportHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>History Merge Demonstration</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .container { display: flex; margin-bottom: 20px; }
        .browser { flex: 1; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .browser h2 { color: #0066cc; }
        .item { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 3px; }
        .item h3 { margin: 0 0 5px 0; }
        .item p { margin: 5px 0; }
        .success { color: green; font-weight: bold; }
        .device-info { color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <h1>History Merge Demonstration</h1>
      
      <div class="container">
        <div class="browser">
          <h2>Browser 1</h2>
          <div class="item">
            <h3>${browser1Item1?.value?.title || 'Not found'}</h3>
            <p>URL: ${browser1Item1?.value?.url || 'N/A'}</p>
            <p class="device-info">Created on device: ${browser1Item1?.value?.deviceName || 'Unknown'} (${browser1Item1?.value?.deviceId || 'Unknown'})</p>
          </div>
          <div class="item">
            <h3>${browser1Item2?.value?.title || 'Not found'}</h3>
            <p>URL: ${browser1Item2?.value?.url || 'N/A'}</p>
            <p class="device-info">Created on device: ${browser1Item2?.value?.deviceName || 'Unknown'} (${browser1Item2?.value?.deviceId || 'Unknown'})</p>
          </div>
        </div>
        
        <div class="browser">
          <h2>Browser 2</h2>
          <div class="item">
            <h3>${browser2Item1?.value?.title || 'Not found'}</h3>
            <p>URL: ${browser2Item1?.value?.url || 'N/A'}</p>
            <p class="device-info">Created on device: ${browser2Item1?.value?.deviceName || 'Unknown'} (${browser2Item1?.value?.deviceId || 'Unknown'})</p>
          </div>
          <div class="item">
            <h3>${browser2Item2?.value?.title || 'Not found'}</h3>
            <p>URL: ${browser2Item2?.value?.url || 'N/A'}</p>
            <p class="device-info">Created on device: ${browser2Item2?.value?.deviceName || 'Unknown'} (${browser2Item2?.value?.deviceId || 'Unknown'})</p>
          </div>
        </div>
      </div>
      
      <div class="success">
        ${(browser1Item1 && browser1Item2 && browser2Item1 && browser2Item2) 
    ? 'SUCCESS: History items were successfully synchronized between both browsers!' 
    : 'FAILURE: Some history items were not synchronized correctly.'}
      </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync(path.join(screenshotsDir, 'history-merge-report.html'), reportHtml);
    
    // Verify that both items exist in both instances
    expect(browser1Item1).toBeTruthy();
    expect(browser1Item2).toBeTruthy();
    expect(browser2Item1).toBeTruthy();
    expect(browser2Item2).toBeTruthy();
    
    // Verify that the items have the same data in both instances
    expect(browser1Item1.value.title).toBe(testTitle1);
    expect(browser2Item1.value.title).toBe(testTitle1);
    expect(browser1Item2.value.title).toBe(testTitle2);
    expect(browser2Item2.value.title).toBe(testTitle2);
    
    test.info().annotations.push({ type: 'info', description: 'History merge demonstration completed successfully!' });
  });
});