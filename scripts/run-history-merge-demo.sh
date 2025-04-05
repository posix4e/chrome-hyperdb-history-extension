#!/bin/bash

# Run the history merge demonstration test
echo "Running history merge demonstration test..."
npx playwright test tests/history-merge-demo.spec.js

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo "Test completed successfully!"
  
  # Create a directory for the demo report
  mkdir -p demo-report
  
  # Copy the screenshots and report to the demo-report directory
  cp -r test-results/history-merge-screenshots/* demo-report/
  
  # Create an index.html file that displays the screenshots in sequence
  cat > demo-report/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>History Merge Demonstration</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1, h2 { color: #333; }
    .step { margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 20px; }
    .browser-container { display: flex; justify-content: space-between; margin-top: 10px; }
    .browser { width: 48%; }
    .browser img { max-width: 100%; border: 1px solid #ddd; }
    .browser h3 { margin-top: 5px; color: #0066cc; }
    .description { margin: 10px 0; line-height: 1.5; }
    .report-link { display: block; margin: 20px 0; padding: 10px; background-color: #f0f0f0; text-align: center; }
  </style>
</head>
<body>
  <h1>HyperDB History Sync Demonstration</h1>
  <p>This demonstration shows how browsing history is synchronized between two browser instances using HyperDB and P2P networking.</p>
  
  <a href="history-merge-report.html" class="report-link">View Final Merge Report</a>
  
  <h2>Step-by-Step Demonstration</h2>
  
  <div class="step">
    <h3>Step 1: Initial State</h3>
    <p class="description">Both browser instances start with the extension popup open.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="01-browser1-initial.png" alt="Browser 1 Initial State">
        <h3>Browser 1</h3>
      </div>
      <div class="browser">
        <img src="01-browser2-initial.png" alt="Browser 2 Initial State">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 2: Connected to P2P Network</h3>
    <p class="description">Both browser instances connect to the P2P network.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="02-browser1-connected.png" alt="Browser 1 Connected">
        <h3>Browser 1</h3>
      </div>
      <div class="browser">
        <img src="02-browser2-connected.png" alt="Browser 2 Connected">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 3: Data Cleared</h3>
    <p class="description">History data is cleared in both browser instances to start fresh.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="03-browser1-cleared.png" alt="Browser 1 Cleared">
        <h3>Browser 1</h3>
      </div>
      <div class="browser">
        <img src="03-browser2-cleared.png" alt="Browser 2 Cleared">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 4: Peers Connected</h3>
    <p class="description">The two browser instances discover each other as peers.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="04-browser1-peer-connected.png" alt="Browser 1 Peer Connected">
        <h3>Browser 1</h3>
      </div>
      <div class="browser">
        <img src="04-browser2-peer-connected.png" alt="Browser 2 Peer Connected">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 5: History Item Added in Browser 1</h3>
    <p class="description">A history item is added in Browser 1.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="05-browser1-item-added.png" alt="Browser 1 Item Added">
        <h3>Browser 1</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 6: Synchronization to Browser 2</h3>
    <p class="description">The history item from Browser 1 is synchronized to Browser 2.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="06-browser2-after-sync1.png" alt="Browser 2 After Sync 1">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 7: History Item Added in Browser 2</h3>
    <p class="description">A history item is added in Browser 2.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="07-browser2-item-added.png" alt="Browser 2 Item Added">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <div class="step">
    <h3>Step 8: Final Synchronization</h3>
    <p class="description">Both browser instances now have both history items synchronized.</p>
    <div class="browser-container">
      <div class="browser">
        <img src="08-browser1-after-sync2.png" alt="Browser 1 After Sync 2">
        <h3>Browser 1</h3>
      </div>
      <div class="browser">
        <img src="08-browser2-after-sync2.png" alt="Browser 2 After Sync 2">
        <h3>Browser 2</h3>
      </div>
    </div>
  </div>
  
  <a href="history-merge-report.html" class="report-link">View Final Merge Report</a>
  
  <p>This demonstration shows how the HyperDB History Sync extension enables seamless synchronization of browsing history across multiple browser instances using peer-to-peer technology, without requiring a central server.</p>
</body>
</html>
EOL
  
  echo "Demo report created in the demo-report directory!"
  echo "Open demo-report/index.html to view the demonstration."
else
  echo "Test failed. Check the test output for details."
fi