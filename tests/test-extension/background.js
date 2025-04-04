// Modified background.js for testing with a staging peer
import Hypercore from 'https://cdn.jsdelivr.net/npm/hypercore@10/index.js';
import Hyperbee from 'https://cdn.jsdelivr.net/npm/hyperbee@2/index.js';
import RAM from 'https://cdn.jsdelivr.net/npm/random-access-memory@6/index.js';
import Hyperswarm from 'https://cdn.jsdelivr.net/npm/hyperswarm@4/index.js';

// Global variables
let db = null;
let swarm = null;
let peerId = null;
let isConnected = false;
let peers = new Set();
let stagingPeerInfo = null;

// Initialize the database and swarm
async function initialize(options = {}) {
  try {
    console.log('Initializing HyperDB History Sync for testing...');
    
    // Create or load the hypercore
    const core = new Hypercore(RAM);
    await core.ready();
    
    // Create the hyperbee database
    db = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    });
    
    // Initialize the swarm for P2P communication
    swarm = new Hyperswarm();
    
    // Join the swarm with the topic derived from the core's public key
    const topic = core.discoveryKey;
    const discovery = swarm.join(topic, { server: true, client: true });
    
    // Store the peer ID (public key)
    peerId = core.key.toString('hex');
    console.log('Your peer ID:', peerId);
    
    // If staging peer info is provided, connect to it
    if (options.stagingPeerInfo) {
      stagingPeerInfo = options.stagingPeerInfo;
      console.log('Connecting to staging peer:', stagingPeerInfo.peerId);
      
      // TODO: In a real implementation, we would use the staging peer's discovery key
      // to connect directly to it. For now, we'll rely on the DHT for discovery.
    }
    
    // Handle new connections
    swarm.on('connection', (socket, info) => {
      console.log('New peer connected:', info.publicKey.toString('hex'));
      
      // Add the peer to our list
      const remotePeerId = info.publicKey.toString('hex');
      peers.add(remotePeerId);
      
      // Replicate our hypercore with the peer
      const stream = core.replicate(info.client);
      socket.pipe(stream).pipe(socket);
      
      // Handle disconnection
      socket.on('close', () => {
        console.log('Peer disconnected:', remotePeerId);
        peers.delete(remotePeerId);
      });
    });
    
    isConnected = true;
    console.log('HyperDB History Sync initialized successfully');
    
    // Start tracking browser history
    startHistoryTracking();
    
    return {
      peerId,
      discoveryKey: core.discoveryKey.toString('hex')
    };
  } catch (error) {
    console.error('Failed to initialize HyperDB:', error);
    isConnected = false;
    throw error;
  }
}

// Track browser history
function startHistoryTracking() {
  // For testing, we'll use a simulated history API
  if (typeof chrome === 'undefined' || !chrome.history) {
    console.log('Using simulated history API for testing');
    
    // Simulate history items
    const historyItems = [
      {
        id: 'test1',
        url: 'https://example.com',
        title: 'Example Domain',
        lastVisitTime: Date.now(),
        visitCount: 1,
        typedCount: 0
      },
      {
        id: 'test2',
        url: 'https://github.com',
        title: 'GitHub',
        lastVisitTime: Date.now() - 3600000,
        visitCount: 5,
        typedCount: 2
      }
    ];
    
    // Store the simulated history items
    historyItems.forEach(async (item) => {
      await storeHistoryItem(item);
    });
    
    return;
  }
  
  // Use the real Chrome history API if available
  chrome.history.onVisited.addListener(async (historyItem) => {
    try {
      await storeHistoryItem(historyItem);
    } catch (error) {
      console.error('Failed to store history item:', error);
    }
  });
  
  // Initial sync of recent history
  syncRecentHistory();
}

// Store a history item in the HyperDB
async function storeHistoryItem(historyItem) {
  if (!db || !isConnected) return;
  
  try {
    // Create a key based on URL and timestamp
    const key = `history:${historyItem.id}`;
    
    // Store the history item
    await db.put(key, {
      url: historyItem.url,
      title: historyItem.title,
      lastVisitTime: historyItem.lastVisitTime,
      visitCount: historyItem.visitCount,
      typedCount: historyItem.typedCount,
      timestamp: Date.now()
    });
    
    console.log('Stored history item:', historyItem.url);
  } catch (error) {
    console.error('Error storing history item:', error);
  }
}

// Sync recent history (last 24 hours)
async function syncRecentHistory() {
  if (!db || !isConnected) return;
  
  try {
    // Get history from the last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    if (typeof chrome === 'undefined' || !chrome.history) {
      console.log('Using simulated history API for testing');
      return;
    }
    
    chrome.history.search({
      text: '',
      startTime: oneDayAgo,
      maxResults: 1000
    }, async (historyItems) => {
      console.log(`Syncing ${historyItems.length} recent history items...`);
      
      for (const item of historyItems) {
        await storeHistoryItem(item);
      }
      
      console.log('Recent history sync completed');
    });
  } catch (error) {
    console.error('Error syncing recent history:', error);
  }
}

// Get all history items from the database
async function getHistoryItems() {
  if (!db || !isConnected) return [];
  
  try {
    const items = [];
    for await (const { key, value } of db.createReadStream({ gt: 'history:', lt: 'history:\xff' })) {
      items.push(value);
    }
    return items;
  } catch (error) {
    console.error('Error getting history items:', error);
    return [];
  }
}

// Clear all stored data
async function clearStoredData() {
  if (!db || !isConnected) return false;
  
  try {
    // Iterate through all keys and delete them
    for await (const { key } of db.createReadStream()) {
      await db.del(key);
    }
    
    console.log('All stored data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing stored data:', error);
    return false;
  }
}

// Get the current status
function getStatus() {
  return {
    connected: isConnected,
    peerId: peerId,
    peerCount: peers.size,
    stagingPeer: stagingPeerInfo
  };
}

// Handle messages
function handleMessage(message, sender, sendResponse) {
  if (message.action === 'getStatus') {
    sendResponse(getStatus());
  } else if (message.action === 'syncNow') {
    syncRecentHistory()
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Sync error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  } else if (message.action === 'clearData') {
    clearStoredData()
      .then(success => sendResponse({ success }))
      .catch(error => {
        console.error('Clear data error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  } else if (message.action === 'getHistoryItems') {
    getHistoryItems()
      .then(items => sendResponse({ success: true, items }))
      .catch(error => {
        console.error('Get history items error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  } else if (message.action === 'initialize') {
    initialize(message.options)
      .then(info => sendResponse({ success: true, info }))
      .catch(error => {
        console.error('Initialize error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  }
}

// Export functions for testing
export {
  initialize,
  getStatus,
  storeHistoryItem,
  getHistoryItems,
  clearStoredData,
  syncRecentHistory,
  handleMessage
};

// If we're in a browser extension environment, set up message handling
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Initialize when the extension loads
  initialize();
}