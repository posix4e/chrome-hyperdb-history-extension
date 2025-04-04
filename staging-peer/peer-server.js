// Staging peer server for testing real syncing with the HyperDB History Extension
const Hypercore = require('hypercore');
const Hyperbee = require('hyperbee');
const Hyperswarm = require('hyperswarm');
const RAM = require('random-access-memory');
const fs = require('fs');
const path = require('path');

// Create a directory for persistent storage
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class StagingPeer {
  constructor(options = {}) {
    this.options = {
      inMemory: false,
      verbose: true,
      ...options
    };
    
    this.core = null;
    this.db = null;
    this.swarm = null;
    this.peerId = null;
    this.peers = new Set();
    this.isConnected = false;
    this.historyItems = [];
  }
  
  async initialize() {
    try {
      console.log('Initializing staging peer server...');
      
      // Create or load the hypercore
      if (this.options.inMemory) {
        // Use in-memory storage for testing
        this.core = new Hypercore(RAM);
      } else {
        // Use persistent storage
        this.core = new Hypercore(path.join(DATA_DIR, 'hypercore'));
      }
      
      await this.core.ready();
      
      // Create the hyperbee database
      this.db = new Hyperbee(this.core, {
        keyEncoding: 'utf-8',
        valueEncoding: 'json'
      });
      
      // Initialize the swarm for P2P communication
      this.swarm = new Hyperswarm();
      
      // Join the swarm with the topic derived from the core's public key
      const topic = this.core.discoveryKey;
      const discovery = this.swarm.join(topic, { server: true, client: true });
      
      // Store the peer ID (public key)
      this.peerId = this.core.key.toString('hex');
      console.log('Staging peer ID:', this.peerId);
      
      // Handle new connections
      this.swarm.on('connection', (socket, info) => {
        const remotePeerId = info.publicKey.toString('hex');
        console.log('New peer connected:', remotePeerId);
        
        // Add the peer to our list
        this.peers.add(remotePeerId);
        
        // Replicate our hypercore with the peer
        const stream = this.core.replicate(info.client);
        socket.pipe(stream).pipe(socket);
        
        // Handle disconnection
        socket.on('close', () => {
          console.log('Peer disconnected:', remotePeerId);
          this.peers.delete(remotePeerId);
        });
      });
      
      this.isConnected = true;
      console.log('Staging peer initialized successfully');
      
      // Start monitoring for changes
      this.startMonitoring();
      
      return {
        peerId: this.peerId,
        discoveryKey: this.core.discoveryKey.toString('hex')
      };
    } catch (error) {
      console.error('Failed to initialize staging peer:', error);
      this.isConnected = false;
      throw error;
    }
  }
  
  async startMonitoring() {
    // Monitor for changes to the database
    const watcher = this.db.createHistoryStream({ live: true });
    
    watcher.on('data', async (data) => {
      try {
        if (data.type === 'put') {
          const { key, value } = data;
          console.log('New data received:', key);
          
          if (key.startsWith('history:')) {
            this.historyItems.push(value);
            console.log('History item stored:', value.url);
          }
        }
      } catch (error) {
        console.error('Error processing data change:', error);
      }
    });
  }
  
  async storeHistoryItem(historyItem) {
    if (!this.db || !this.isConnected) return false;
    
    try {
      // Create a key based on URL and timestamp
      const key = `history:${historyItem.id || Date.now()}`;
      
      // Store the history item
      await this.db.put(key, {
        url: historyItem.url,
        title: historyItem.title,
        lastVisitTime: historyItem.lastVisitTime,
        visitCount: historyItem.visitCount || 1,
        typedCount: historyItem.typedCount || 0,
        timestamp: Date.now()
      });
      
      console.log('Stored history item:', historyItem.url);
      return true;
    } catch (error) {
      console.error('Error storing history item:', error);
      return false;
    }
  }
  
  async getHistoryItems() {
    if (!this.db || !this.isConnected) return [];
    
    try {
      const items = [];
      for await (const { key, value } of this.db.createReadStream({ gt: 'history:', lt: 'history:\xff' })) {
        items.push(value);
      }
      return items;
    } catch (error) {
      console.error('Error getting history items:', error);
      return [];
    }
  }
  
  getStatus() {
    return {
      connected: this.isConnected,
      peerId: this.peerId,
      peerCount: this.peers.size,
      historyItemCount: this.historyItems.length
    };
  }
  
  async close() {
    if (this.swarm) {
      await new Promise(resolve => {
        this.swarm.destroy(resolve);
      });
    }
    
    if (this.core) {
      await this.core.close();
    }
    
    this.isConnected = false;
    console.log('Staging peer closed');
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  const stagingPeer = new StagingPeer({ inMemory: process.env.IN_MEMORY === 'true' });
  
  stagingPeer.initialize()
    .then(info => {
      console.log('Staging peer is running');
      console.log('Peer ID:', info.peerId);
      console.log('Discovery Key:', info.discoveryKey);
      
      // Add some sample history items
      setTimeout(async () => {
        await stagingPeer.storeHistoryItem({
          id: 'sample1',
          url: 'https://example.com',
          title: 'Example Domain',
          lastVisitTime: Date.now()
        });
        
        await stagingPeer.storeHistoryItem({
          id: 'sample2',
          url: 'https://github.com',
          title: 'GitHub',
          lastVisitTime: Date.now()
        });
        
        console.log('Added sample history items');
      }, 2000);
    })
    .catch(error => {
      console.error('Failed to start staging peer:', error);
      process.exit(1);
    });
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down staging peer...');
    await stagingPeer.close();
    process.exit(0);
  });
}

module.exports = StagingPeer;