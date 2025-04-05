import { expect } from '@playwright/test';
import { test } from './fixtures.js';
import { waitForExtensionToConnect, clearAllData } from './utils.js';

test.describe('Chrome Extension Basic Functionality', () => {
  test('should load the extension and display the popup', async ({ extensionPage }) => {
    // Open the extension popup
    await extensionPage.openPopup();
    
    // Check that the popup loaded correctly
    const title = await extensionPage.textContent('h2');
    expect(title).toBe('HyperDB History Sync');
    
    // Check that the status is initially disconnected or connected
    const statusText = await extensionPage.textContent('#status');
    expect(['Connected', 'Disconnected']).toContain(statusText);
  });
  
  test('should initialize and connect to the P2P network', async ({ extensionPage }) => {
    // Open the extension popup
    await extensionPage.openPopup();
    
    // Wait for the extension to connect (may take a few seconds)
    const status = await waitForExtensionToConnect(extensionPage, 15000);
    
    // Check that the extension is connected
    expect(status.connected).toBe(true);
    expect(status.peerId).toBeTruthy();
    
    // Check that the UI reflects the connected state
    await extensionPage.waitForSelector('#status.connected');
    const statusText = await extensionPage.textContent('#status');
    expect(statusText).toBe('Connected');
    
    // Check that the peer ID is displayed
    const peerIdText = await extensionPage.textContent('#peerId');
    expect(peerIdText).toContain('Your Peer ID:');
    expect(peerIdText).toContain(status.peerId);
  });
  
  test('should display device information', async ({ extensionPage }) => {
    // Open the extension popup
    await extensionPage.openPopup();
    
    // Wait for the extension to connect
    await waitForExtensionToConnect(extensionPage, 15000);
    
    // Check that device information is displayed
    const deviceInfoText = await extensionPage.textContent('#deviceInfo');
    expect(deviceInfoText).toContain('Device:');
    expect(deviceInfoText).not.toBe('Device: Unknown');
    
    // Device ID should be displayed (first 8 characters of peer ID)
    const peerIdText = await extensionPage.textContent('#peerId');
    const peerId = peerIdText.split('Your Peer ID: ')[1];
    const deviceId = peerId.substring(0, 8);
    
    expect(deviceInfoText).toContain(deviceId);
  });
  
  test('should clear stored data when requested', async ({ extensionPage }) => {
    // Open the extension popup
    await extensionPage.openPopup();
    
    // Wait for the extension to connect
    await waitForExtensionToConnect(extensionPage, 15000);
    
    // Clear the data
    const result = await clearAllData(extensionPage);
    expect(result.success).toBe(true);
  });
});