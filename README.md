# HyperDB History Sync Chrome Extension

A Chrome extension that stores your browsing history in a HyperDB database and shares it peer-to-peer with your other devices.

## Features

- Automatically stores your browsing history in a local HyperDB database
- Shares your history data peer-to-peer with your other devices using Hyperswarm
- No central server required - your data stays under your control
- Simple UI to monitor connection status and manage data

## Installation

### From Source

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and active

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. The status indicator will show if you're connected to the P2P network
3. Your unique Peer ID is displayed - you can use this to identify your device
4. Use the "Sync Now" button to manually sync recent history
5. Use the "Clear Local Data" button to remove all stored history data

## How It Works

This extension uses:

- **Hypercore**: A secure, distributed append-only log
- **Hyperbee**: A distributed key-value database built on Hypercore
- **Hyperswarm**: A distributed peer discovery system

When you visit a webpage, the extension stores the visit in the local HyperDB. When your other devices with the same extension are online, they automatically discover each other through Hyperswarm and synchronize their history databases.

## Privacy & Security

- Your browsing history is only shared with devices that have your unique Hypercore key
- No data is sent to any central servers
- All data is encrypted during transfer between your devices
- You can clear all stored data at any time

## Development

To modify or extend this extension:

1. Make your changes to the source code
2. Reload the extension in Chrome's extension management page
3. Test your changes

### Testing

This extension includes automated integration tests using Playwright. The tests verify the UI components, interactions, and simulate Chrome API behavior.

#### Running Tests

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install --with-deps chromium
   ```

3. Run the tests:
   ```bash
   npm test
   ```

4. Run tests with debugging:
   ```bash
   npm run test:debug
   ```

5. View the HTML test report:
   ```bash
   npx playwright show-report
   ```

#### Test Features

- **Screenshot Testing**: Tests automatically capture screenshots at various stages, which are saved in the `test-results/` directory
- **UI Testing**: Verifies that all UI elements are present and correctly styled
- **Interaction Testing**: Tests button clicks and hover states
- **Mock Chrome API**: Simulates Chrome extension API behavior for testing outside the extension environment

#### Continuous Integration

The repository includes GitHub Actions workflows that automatically run the tests on push and pull requests to the main branch. The test results and screenshots are available as artifacts in the GitHub Actions workflow.

## License

MIT