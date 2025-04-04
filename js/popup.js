document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const peerIdElement = document.getElementById('peerId');
  const syncNowButton = document.getElementById('syncNow');
  const clearDataButton = document.getElementById('clearData');

  // Check connection status
  chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
    if (response && response.connected) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status connected';
      
      if (response.peerId) {
        peerIdElement.textContent = `Your Peer ID: ${response.peerId}`;
      }
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
        } else {
          alert('Failed to clear data. Check console for details.');
        }
      });
    }
  });
});