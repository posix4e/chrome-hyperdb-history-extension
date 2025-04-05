document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const peerIdElement = document.getElementById('peerId');
  const deviceInfoElement = document.getElementById('deviceInfo');
  const peerCountElement = document.getElementById('peerCount');
  const syncNowButton = document.getElementById('syncNow');
  const clearDataButton = document.getElementById('clearData');
  const historyContainer = document.getElementById('historyContainer');

  // Function to update the UI with status information
  function updateStatusUI() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
      if (response && response.connected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'status connected';
        
        if (response.peerId) {
          peerIdElement.textContent = `Your Peer ID: ${response.peerId}`;
        }
        
        if (response.deviceInfo) {
          deviceInfoElement.textContent = `Device: ${response.deviceInfo.deviceName} (${response.deviceInfo.deviceId})`;
        }
        
        peerCountElement.textContent = `Connected Peers: ${response.peerCount}`;
      } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'status disconnected';
        deviceInfoElement.textContent = 'Device: Unknown';
        peerCountElement.textContent = 'Connected Peers: 0';
      }
    });
  }

  // Function to format date
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
  
  // Function to fetch and display history
  function fetchAndDisplayHistory() {
    historyContainer.innerHTML = '<div class="loading">Loading history...</div>';
    
    chrome.runtime.sendMessage({ action: 'getAllHistoryItems' }, function(response) {
      if (response && response.success && response.items && response.items.length > 0) {
        // Sort items by timestamp (newest first)
        const sortedItems = response.items.sort((a, b) => b.value.timestamp - a.value.timestamp);
        
        // Clear the container
        historyContainer.innerHTML = '';
        
        // Add each history item to the container
        sortedItems.forEach(item => {
          const historyItem = document.createElement('div');
          historyItem.className = 'history-item';
          
          const title = document.createElement('div');
          title.className = 'title';
          title.textContent = item.value.title || 'Untitled';
          
          const url = document.createElement('div');
          url.className = 'url';
          url.textContent = item.value.url;
          
          const meta = document.createElement('div');
          meta.className = 'meta';
          
          const time = document.createElement('span');
          time.textContent = formatDate(item.value.timestamp);
          
          const device = document.createElement('span');
          device.textContent = `Device: ${item.value.deviceName || 'Unknown'}`;
          
          meta.appendChild(time);
          meta.appendChild(device);
          
          historyItem.appendChild(title);
          historyItem.appendChild(url);
          historyItem.appendChild(meta);
          
          historyContainer.appendChild(historyItem);
        });
      } else {
        historyContainer.innerHTML = '<div class="no-history">No history items found</div>';
      }
    });
  }
  
  // Initial status update
  updateStatusUI();
  
  // Initial history fetch
  fetchAndDisplayHistory();
  
  // Update status every 5 seconds
  setInterval(updateStatusUI, 5000);

  // Sync now button
  syncNowButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'syncNow' }, function(response) {
      if (response && response.success) {
        alert('Sync started successfully!');
        // Refresh history display after sync
        setTimeout(fetchAndDisplayHistory, 1000);
      } else {
        alert('Failed to start sync. Check console for details.');
      }
    });
  });

  // Clear data button
  clearDataButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all locally stored history data?')) {
      chrome.runtime.sendMessage({ action: 'clearData' }, function(response) {
        if (response && response.success) {
          alert('Data cleared successfully!');
          // Refresh history display after clearing data
          fetchAndDisplayHistory();
        } else {
          alert('Failed to clear data. Check console for details.');
        }
      });
    }
  });
  
  // Add a refresh button for history
  const refreshButton = document.createElement('button');
  refreshButton.textContent = 'Refresh History';
  refreshButton.style.marginTop = '10px';
  refreshButton.addEventListener('click', fetchAndDisplayHistory);
  
  // Insert the refresh button before the history container
  historyContainer.parentNode.insertBefore(refreshButton, historyContainer);
});