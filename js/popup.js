document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const peerIdElement = document.getElementById('peerId');
  const deviceInfoElement = document.getElementById('deviceInfo');
  const historyListElement = document.getElementById('historyList');
  const syncNowButton = document.getElementById('syncNow');
  const clearDataButton = document.getElementById('clearData');

  // Get device information
  function getDeviceInfo() {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';
    
    // Try to determine device type
    if (/Windows/.test(platform)) {
      deviceName = 'Windows PC';
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(platform)) {
      deviceName = 'Mac';
    } else if (/Linux/.test(platform)) {
      deviceName = 'Linux';
    } else if (/Android/.test(userAgent)) {
      deviceName = 'Android Device';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      deviceName = 'iOS Device';
    }
    
    // Add a unique identifier for this device instance
    const deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      const newDeviceId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', newDeviceId);
      return `${deviceName} (${newDeviceId})`;
    }
    
    return `${deviceName} (${deviceId})`;
  }

  // Display device info
  const deviceInfo = getDeviceInfo();
  deviceInfoElement.textContent = `Device: ${deviceInfo}`;

  // Check connection status
  chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
    if (response && response.connected) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
      
      if (response.peerId) {
        peerIdElement.textContent = `Your Peer ID: ${response.peerId}`;
      }
      
      // Also fetch history items
      chrome.runtime.sendMessage({ action: 'getHistory' }, function(historyResponse) {
        if (historyResponse && historyResponse.items && historyResponse.items.length > 0) {
          displayHistoryItems(historyResponse.items);
        }
      });
    } else {
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'status disconnected';
    }
  });

  // Sync now button
  syncNowButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'syncNow' }, function(response) {
      if (response && response.success) {
        alert('Sync started successfully!');
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
          historyListElement.innerHTML = 'No history items found';
        } else {
          alert('Failed to clear data. Check console for details.');
        }
      });
    }
  });
  
  // Function to display history items
  function displayHistoryItems(items) {
    if (!items || items.length === 0) {
      historyListElement.innerHTML = 'No history items found';
      return;
    }
    
    // Clear the list
    historyListElement.innerHTML = '';
    
    // Sort items by lastVisitTime (newest first)
    items.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
    
    // Add each item to the list
    items.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'history-item';
      
      const titleElement = document.createElement('div');
      titleElement.className = 'history-item-title';
      titleElement.textContent = item.title || 'No Title';
      
      const urlElement = document.createElement('div');
      urlElement.className = 'history-item-url';
      urlElement.textContent = item.url;
      
      const metaElement = document.createElement('div');
      metaElement.className = 'history-item-meta';
      
      // Format the date
      const date = new Date(item.lastVisitTime);
      const formattedDate = date.toLocaleString();
      
      // Show which device it came from if available
      const deviceInfo = item.deviceInfo || 'Unknown Device';
      
      metaElement.textContent = `Visited: ${formattedDate} | Device: ${deviceInfo}`;
      
      itemElement.appendChild(titleElement);
      itemElement.appendChild(urlElement);
      itemElement.appendChild(metaElement);
      
      historyListElement.appendChild(itemElement);
    });
  }
});