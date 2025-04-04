// REST API server for the staging peer
const express = require('express');
const cors = require('cors');
const StagingPeer = require('./peer-server');

class ApiServer {
  constructor(options = {}) {
    this.options = {
      port: process.env.PORT || 3000,
      ...options
    };
    
    this.app = express();
    this.server = null;
    this.stagingPeer = new StagingPeer(options);
  }
  
  async initialize() {
    // Initialize the staging peer
    const peerInfo = await this.stagingPeer.initialize();
    
    // Configure Express
    this.app.use(cors());
    this.app.use(express.json());
    
    // Set up routes
    this.setupRoutes();
    
    return peerInfo;
  }
  
  setupRoutes() {
    // Get peer status
    this.app.get('/api/status', (req, res) => {
      const status = this.stagingPeer.getStatus();
      res.json(status);
    });
    
    // Get peer info
    this.app.get('/api/info', (req, res) => {
      res.json({
        peerId: this.stagingPeer.peerId,
        discoveryKey: this.stagingPeer.core.discoveryKey.toString('hex')
      });
    });
    
    // Get history items
    this.app.get('/api/history', async (req, res) => {
      try {
        const items = await this.stagingPeer.getHistoryItems();
        res.json(items);
      } catch (error) {
        console.error('Error getting history items:', error);
        res.status(500).json({ error: 'Failed to get history items' });
      }
    });
    
    // Add a history item
    this.app.post('/api/history', async (req, res) => {
      try {
        const historyItem = req.body;
        
        if (!historyItem.url) {
          return res.status(400).json({ error: 'URL is required' });
        }
        
        const success = await this.stagingPeer.storeHistoryItem(historyItem);
        
        if (success) {
          res.status(201).json({ success: true, message: 'History item stored' });
        } else {
          res.status(500).json({ error: 'Failed to store history item' });
        }
      } catch (error) {
        console.error('Error storing history item:', error);
        res.status(500).json({ error: 'Failed to store history item' });
      }
    });
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });
  }
  
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.options.port, () => {
        console.log(`API server listening on port ${this.options.port}`);
        resolve(this.server);
      });
      
      this.server.on('error', (error) => {
        console.error('Failed to start API server:', error);
        reject(error);
      });
    });
  }
  
  async stop() {
    if (this.server) {
      await new Promise(resolve => {
        this.server.close(resolve);
      });
    }
    
    await this.stagingPeer.close();
    console.log('API server stopped');
  }
}

// If this file is run directly, start the server
if (require.main === module) {
  const apiServer = new ApiServer({
    port: process.env.PORT || 3000,
    inMemory: process.env.IN_MEMORY === 'true'
  });
  
  apiServer.initialize()
    .then(peerInfo => {
      console.log('Staging peer initialized with ID:', peerInfo.peerId);
      return apiServer.start();
    })
    .then(() => {
      console.log('API server started');
    })
    .catch(error => {
      console.error('Failed to start API server:', error);
      process.exit(1);
    });
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down API server...');
    await apiServer.stop();
    process.exit(0);
  });
}

module.exports = ApiServer;