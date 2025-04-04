/**
 * Mock implementation of Chrome Extension API for testing
 */
class MockChromeAPI {
  constructor() {
    this.runtime = {
      sendMessage: this.createSendMessageMock(),
      onMessage: this.createListenerMock()
    };
    
    this.history = {
      onVisited: this.createListenerMock(),
      search: this.createSearchMock()
    };
    
    this.storage = {
      local: {
        get: this.createStorageGetMock(),
        set: this.createStorageSetMock()
      }
    };
    
    this.tabs = {
      query: this.createTabsQueryMock()
    };
  }
  
  createSendMessageMock() {
    return (message, callback) => {
      if (message.action === 'getStatus') {
        callback({
          connected: true,
          peerId: 'mock-peer-id-12345',
          peerCount: 3
        });
      } else if (message.action === 'syncNow') {
        callback({ success: true });
      } else if (message.action === 'clearData') {
        callback({ success: true });
      }
    };
  }
  
  createListenerMock() {
    const listeners = [];
    
    return {
      addListener: (callback) => {
        listeners.push(callback);
      },
      removeListener: (callback) => {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      },
      hasListeners: () => listeners.length > 0,
      getListeners: () => [...listeners],
      trigger: (...args) => {
        listeners.forEach(listener => listener(...args));
      }
    };
  }
  
  createSearchMock() {
    return (query, callback) => {
      callback([
        {
          id: '1',
          url: 'https://example.com',
          title: 'Example Domain',
          lastVisitTime: Date.now(),
          visitCount: 5,
          typedCount: 2
        },
        {
          id: '2',
          url: 'https://github.com',
          title: 'GitHub',
          lastVisitTime: Date.now() - 3600000,
          visitCount: 10,
          typedCount: 3
        }
      ]);
    };
  }
  
  createStorageGetMock() {
    return (keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = 'mock-value';
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = 'mock-value';
        });
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          result[key] = keys[key]; // Use default values
        });
      }
      callback(result);
    };
  }
  
  createStorageSetMock() {
    return (items, callback) => {
      if (callback) {
        callback();
      }
    };
  }
  
  createTabsQueryMock() {
    return (queryInfo, callback) => {
      callback([
        {
          id: 1,
          url: 'https://example.com',
          title: 'Example Domain',
          active: true
        }
      ]);
    };
  }
  
  injectIntoPage(page) {
    return page.evaluate((mockAPI) => {
      window.chrome = mockAPI;
    }, this);
  }
}

module.exports = { MockChromeAPI };