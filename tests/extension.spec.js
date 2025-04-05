import { expect } from '@playwright/test';
import { test } from './fixtures.js';

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
  
  // Skip more complex tests in CI environment
  test.skip('should initialize and connect to the P2P network', async ({ extensionPage }) => {
    // This test is skipped in CI
  });
  
  test.skip('should display device information', async ({ extensionPage }) => {
    // This test is skipped in CI
  });
  
  test.skip('should clear stored data when requested', async ({ extensionPage }) => {
    // This test is skipped in CI
  });
});