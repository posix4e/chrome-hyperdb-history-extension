// Modified popup.js for testing with a staging peer
document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const peerIdElement = document.getElementById('peerId');
  const syncNowButton = document.getElementById('syncNow');
  const clearDataButton = document.getElementById('clearData');
  const historyListElement = document.getElementById('historyList');
  const stagingPeerStatusElement = document.getElementById('stagingPeerStatus');
  
  // Check connection status
  function updateStatus() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
        updateStatusUI(response);
      });
    } else {
      // For testing without Chrome API
      console.log('Using mock status for testing');
      updateStatusUI({
        connected: true,
        peerId: 'mock-peer-id-12345',
        peerCount: 1,
        stagingPeer: {
          peerId: 'staging-peer-id-67890',
          connected: true
        }
      });
    }
  }
  
  function updateStatusUI(response) {
    if (response && response.connected) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
      
      if (response.peerId) {
        peerIdElement.textContent = `Your Peer ID: ${response.peerId}`;
      }
      
      if (response.stagingPeer) {
        stagingPeerStatusElement.textContent = `Staging Peer: ${response.stagingPeer.peerId} (${response.stagingPeer.connected ? 'Connected' : 'Disconnected'})`;
        stagingPeerStatusElement.className = response.stagingPeer.connected ? 'status connected' : 'status disconnected';
      }
    } else {
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'status disconnected';
    }
  }
  
  // Load history items
  function loadHistoryItems() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'getHistoryItems' }, function(response) {
        if (response && response.success) {
          displayHistoryItems(response.items);
        } else {
          console.error('Failed to load history items');
        }
      });
    } else {
      // For testing without Chrome API
      console.log('Using mock history items for testing');
      displayHistoryItems([
        {
          url: 'https://example.com',
          title: 'Example Domain',
          lastVisitTime: Date.now(),
          visitCount: 1
        },
        {
          url: 'https://github.com',
          title: 'GitHub',
          lastVisitTime: Date.now() - 3600000,
          visitCount: 5
        }
      ]);
    }
  }
  
  function displayHistoryItems(items) {
    if (!historyListElement) return;
    
    historyListElement.innerHTML = '';
    
    if (items.length === 0) {
      historyListElement.innerHTML = '<li>No history items found</li>';
      return;
    }
    
    items.forEach(item => {
      const li = document.createElement('li');
      const date = new Date(item.lastVisitTime).toLocaleString();
      li.innerHTML = `
        <div class="history-item">
          <div class="title">${item.title || 'No Title'}</div>
          <div class="url">${item.url}</div>
          <div class="meta">Visited: ${date} (${item.visitCount} times)</div>
        </div>
      `;
      historyListElement.appendChild(li);
    });
  }
  
  // Initialize with staging peer
  function initializeWithStagingPeer() {
    // In a real implementation, we would fetch the staging peer info from the server
    const stagingPeerInfo = {
      peerId: 'staging-peer-id-67890',
      discoveryKey: 'mock-discovery-key'
    };
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ 
        action: 'initialize',
        options: { stagingPeerInfo }
      }, function(response) {
        if (response && response.success) {
          console.log('Initialized with staging peer:', response.info);
          updateStatus();
          loadHistoryItems();
        } else {
          console.error('Failed to initialize with staging peer');
        }
      });
    } else {
      // For testing without Chrome API
      console.log('Using mock initialization for testing');
      updateStatus();
      loadHistoryItems();
    }
  }
  
  // Sync now button
  if (syncNowButton) {
    syncNowButton.addEventListener('click', function() {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ action: 'syncNow' }, function(response) {
          if (response && response.success) {
            alert('Sync started successfully!');
            loadHistoryItems(); // Reload history items after sync
          } else {
            alert('Failed to start sync. Check console for details.');
          }
        });
      } else {
        // For testing without Chrome API
        console.log('Using mock sync for testing');
        alert('Sync started successfully!');
        loadHistoryItems(); // Reload history items after sync
      }
    });
  }
  
  // Clear data button
  if (clearDataButton) {
    clearDataButton.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all locally stored history data?')) {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({ action: 'clearData' }, function(response) {
            if (response && response.success) {
              alert('Data cleared successfully!');
              loadHistoryItems(); // Reload history items after clearing
            } else {
              alert('Failed to clear data. Check console for details.');
            }
          });
        } else {
          // For testing without Chrome API
          console.log('Using mock clear data for testing');
          alert('Data cleared successfully!');
          loadHistoryItems(); // Reload history items after clearing
        }
      }
    });
  }
  
  // Initialize the popup
  initializeWithStagingPeer();
});