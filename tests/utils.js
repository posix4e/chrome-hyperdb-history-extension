/**
 * Utility functions for testing the Chrome extension
 */

/**
 * Wait for the extension to initialize and connect to the P2P network
 * @param {import('@playwright/test').Page} page - The Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForExtensionToConnect(page, timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
          resolve(response);
        });
      });
    });
    
    if (status && status.connected) {
      return status;
    }
    
    // Wait a bit before checking again
    await page.waitForTimeout(500);
  }
  
  throw new Error('Extension failed to connect within the timeout period');
}

/**
 * Add a history item programmatically
 * @param {import('@playwright/test').Page} page - The Playwright page object
 * @param {string} url - The URL to add to history
 * @param {string} title - The title of the page
 */
async function addHistoryItem(page, url, title) {
  return page.evaluate(({ url, title }) => {
    return new Promise((resolve) => {
      // Create a mock history item
      const historyItem = {
        id: `test-${Date.now()}`,
        url,
        title,
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 0
      };
      
      // Send a message to the background script to store the history item
      chrome.runtime.sendMessage(
        { action: 'storeHistoryItem', historyItem },
        (response) => {
          resolve(response);
        }
      );
    });
  }, { url, title });
}

/**
 * Get all history items from the extension
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
async function getAllHistoryItems(page) {
  return page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getAllHistoryItems' }, (response) => {
        resolve(response.items || []);
      });
    });
  });
}

/**
 * Clear all stored data in the extension
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
async function clearAllData(page) {
  return page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'clearData' }, (response) => {
        resolve(response);
      });
    });
  });
}

/**
 * Get the peer ID of the extension
 * @param {import('@playwright/test').Page} page - The Playwright page object
 */
async function getPeerId(page) {
  const status = await page.evaluate(() => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
        resolve(response);
      });
    });
  });
  
  return status.peerId;
}

/**
 * Wait for a specific number of peers to connect
 * @param {import('@playwright/test').Page} page - The Playwright page object
 * @param {number} expectedPeerCount - The expected number of peers
 * @param {number} timeout - Timeout in milliseconds
 */
async function waitForPeerCount(page, expectedPeerCount, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const status = await page.evaluate(() => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
          resolve(response);
        });
      });
    });
    
    if (status && status.peerCount >= expectedPeerCount) {
      return status;
    }
    
    // Wait a bit before checking again
    await page.waitForTimeout(1000);
  }
  
  throw new Error(`Failed to connect to ${expectedPeerCount} peers within the timeout period`);
}

export {
  waitForExtensionToConnect,
  addHistoryItem,
  getAllHistoryItems,
  clearAllData,
  getPeerId,
  waitForPeerCount
};