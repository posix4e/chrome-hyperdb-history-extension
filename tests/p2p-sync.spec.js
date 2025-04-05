import { expect } from '@playwright/test';
import { test } from './fixtures.js';
import { 
  waitForExtensionToConnect, 
  addHistoryItem, 
  getAllHistoryItems, 
  clearAllData,
  getPeerId,
  waitForPeerCount
} from './utils.js';

test.describe('P2P History Synchronization', () => {
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
  });
  
  test('should connect two browser instances via P2P', async ({ extensionPage, secondExtensionPage }) => {
    // Get peer IDs from both instances
    const peerId1 = await getPeerId(extensionPage);
    const peerId2 = await getPeerId(secondExtensionPage);
    
    // Verify that the peer IDs are different
    expect(peerId1).not.toBe(peerId2);
    
    // Wait for the peers to discover each other (may take some time)
    await waitForPeerCount(extensionPage, 1, 30000);
    await waitForPeerCount(secondExtensionPage, 1, 5000); // Should be faster after first connection
    
    // Check that the UI reflects the peer count
    await extensionPage.openPopup();
    await secondExtensionPage.openPopup();
    
    const peerCountText1 = await extensionPage.textContent('#peerCount');
    const peerCountText2 = await secondExtensionPage.textContent('#peerCount');
    
    expect(peerCountText1).toContain('Connected Peers: 1');
    expect(peerCountText2).toContain('Connected Peers: 1');
  });
  
  test('should synchronize history items between two browser instances', async ({ extensionPage, secondExtensionPage }) => {
    // Wait for the peers to discover each other
    await waitForPeerCount(extensionPage, 1, 30000);
    
    // Add a history item in the first instance
    const testUrl = 'https://example.com/test-' + Date.now();
    const testTitle = 'Test Page ' + Date.now();
    
    await addHistoryItem(extensionPage, testUrl, testTitle);
    
    // Wait for synchronization (give it some time)
    await extensionPage.waitForTimeout(5000);
    
    // Get history items from both instances
    const items1 = await getAllHistoryItems(extensionPage);
    const items2 = await getAllHistoryItems(secondExtensionPage);
    
    // Find our test item in both instances
    const testItem1 = items1.find(item => item.value.url === testUrl);
    const testItem2 = items2.find(item => item.value.url === testUrl);
    
    // Verify that the item exists in both instances
    expect(testItem1).toBeTruthy();
    expect(testItem2).toBeTruthy();
    
    // Verify that the item has the same data in both instances
    expect(testItem1.value.title).toBe(testTitle);
    expect(testItem2.value.title).toBe(testTitle);
    
    // Verify that the device information is included
    expect(testItem1.value.deviceId).toBeTruthy();
    expect(testItem1.value.deviceName).toBeTruthy();
  });
  
  test('should clear data in one instance and not affect the other', async ({ extensionPage, secondExtensionPage }) => {
    // Wait for the peers to discover each other
    await waitForPeerCount(extensionPage, 1, 30000);
    
    // Add history items in both instances
    const testUrl1 = 'https://example.com/test1-' + Date.now();
    const testUrl2 = 'https://example.com/test2-' + Date.now();
    
    await addHistoryItem(extensionPage, testUrl1, 'Test Page 1');
    await addHistoryItem(secondExtensionPage, testUrl2, 'Test Page 2');
    
    // Wait for synchronization
    await extensionPage.waitForTimeout(5000);
    
    // Verify that both instances have both items
    let items1 = await getAllHistoryItems(extensionPage);
    let items2 = await getAllHistoryItems(secondExtensionPage);
    
    expect(items1.some(item => item.value.url === testUrl1)).toBe(true);
    expect(items1.some(item => item.value.url === testUrl2)).toBe(true);
    expect(items2.some(item => item.value.url === testUrl1)).toBe(true);
    expect(items2.some(item => item.value.url === testUrl2)).toBe(true);
    
    // Clear data in the first instance
    await clearAllData(extensionPage);
    
    // Verify that the first instance has no items
    items1 = await getAllHistoryItems(extensionPage);
    expect(items1.length).toBe(0);
    
    // Verify that the second instance still has its items
    items2 = await getAllHistoryItems(secondExtensionPage);
    expect(items2.length).toBeGreaterThan(0);
    expect(items2.some(item => item.value.url === testUrl2)).toBe(true);
    
    // Add a new item to the first instance
    const testUrl3 = 'https://example.com/test3-' + Date.now();
    await addHistoryItem(extensionPage, testUrl3, 'Test Page 3');
    
    // Wait for synchronization
    await extensionPage.waitForTimeout(5000);
    
    // Verify that the second instance received the new item
    items2 = await getAllHistoryItems(secondExtensionPage);
    expect(items2.some(item => item.value.url === testUrl3)).toBe(true);
  });
});