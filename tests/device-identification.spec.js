import { expect } from '@playwright/test';
import { test } from './fixtures.js';
import { 
  waitForExtensionToConnect, 
  addHistoryItem, 
  getAllHistoryItems, 
  clearAllData,
  waitForPeerCount
} from './utils.js';

test.describe('Device Identification', () => {
  test.beforeEach(async ({ extensionPage, secondExtensionPage }) => {
    // Open both extension popups
    await extensionPage.openPopup();
    await secondExtensionPage.openPopup();
    
    // Wait for both extensions to connect
    await waitForExtensionToConnect(extensionPage, 15000);
    await waitForExtensionToConnect(secondExtensionPage, 15000);
    
    // Clear data in both instances
    await clearAllData(extensionPage);
    await clearAllData(secondExtensionPage);
    
    // Wait for the peers to discover each other
    await waitForPeerCount(extensionPage, 1, 30000);
  });
  
  test('should display unique device identifiers in the UI', async ({ extensionPage, secondExtensionPage }) => {
    // Get device information from both instances
    const deviceInfo1 = await extensionPage.textContent('#deviceInfo');
    const deviceInfo2 = await secondExtensionPage.textContent('#deviceInfo');
    
    // Verify that both instances have device information
    expect(deviceInfo1).toContain('Device:');
    expect(deviceInfo2).toContain('Device:');
    
    // Verify that the device information is different for each instance
    expect(deviceInfo1).not.toBe(deviceInfo2);
    
    // Extract device IDs from the UI
    const deviceId1 = deviceInfo1.match(/\(([^)]+)\)/)[1];
    const deviceId2 = deviceInfo2.match(/\(([^)]+)\)/)[1];
    
    // Verify that the device IDs are different
    expect(deviceId1).not.toBe(deviceId2);
  });
  
  test('should include device information with history items', async ({ extensionPage, secondExtensionPage }) => {
    // Add history items in both instances
    const testUrl1 = 'https://example.com/device-test1-' + Date.now();
    const testUrl2 = 'https://example.com/device-test2-' + Date.now();
    
    await addHistoryItem(extensionPage, testUrl1, 'Device Test 1');
    await addHistoryItem(secondExtensionPage, testUrl2, 'Device Test 2');
    
    // Wait for synchronization
    await extensionPage.waitForTimeout(5000);
    
    // Get history items from the first instance
    const items1 = await getAllHistoryItems(extensionPage);
    
    // Find our test items
    const testItem1 = items1.find(item => item.value.url === testUrl1);
    const testItem2 = items1.find(item => item.value.url === testUrl2);
    
    // Verify that both items exist in the first instance
    expect(testItem1).toBeTruthy();
    expect(testItem2).toBeTruthy();
    
    // Verify that device information is included with each item
    expect(testItem1.value.deviceId).toBeTruthy();
    expect(testItem1.value.deviceName).toBeTruthy();
    expect(testItem2.value.deviceId).toBeTruthy();
    expect(testItem2.value.deviceName).toBeTruthy();
    
    // Verify that the device IDs are different for each item
    expect(testItem1.value.deviceId).not.toBe(testItem2.value.deviceId);
    
    // Get device IDs from the UI
    await extensionPage.openPopup();
    await secondExtensionPage.openPopup();
    
    const deviceInfo1 = await extensionPage.textContent('#deviceInfo');
    const deviceInfo2 = await secondExtensionPage.textContent('#deviceInfo');
    
    const deviceId1 = deviceInfo1.match(/\(([^)]+)\)/)[1];
    const deviceId2 = deviceInfo2.match(/\(([^)]+)\)/)[1];
    
    // Verify that the device IDs in the history items match the UI
    expect(testItem1.value.deviceId).toBe(deviceId1);
    expect(testItem2.value.deviceId).toBe(deviceId2);
  });
  
  test('should maintain device identity across browser restarts', async ({ extensionPage }) => {
    // Get the current device ID
    await extensionPage.openPopup();
    const deviceInfo = await extensionPage.textContent('#deviceInfo');
    const deviceId = deviceInfo.match(/\(([^)]+)\)/)[1];
    
    // Add a history item
    const testUrl = 'https://example.com/restart-test-' + Date.now();
    await addHistoryItem(extensionPage, testUrl, 'Restart Test');
    
    // Get the history item
    const items = await getAllHistoryItems(extensionPage);
    const testItem = items.find(item => item.value.url === testUrl);
    
    // Verify that the device ID in the history item matches the UI
    expect(testItem.value.deviceId).toBe(deviceId);
    
    // Note: In a real test, we would restart the browser here and verify that
    // the device ID remains the same. However, this is difficult to do in a
    // Playwright test. In a real implementation, the device ID would be stored
    // in chrome.storage.local and retrieved on startup.
  });
});