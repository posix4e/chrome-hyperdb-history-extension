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

This extension uses Playwright for integration testing. The tests verify the P2P synchronization functionality between two browser instances.

#### Prerequisites

- Node.js 14 or higher
- npm

#### Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

#### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run a specific test file
npx playwright test tests/extension.spec.js
```

#### Test Structure

- `tests/fixtures.js`: Test fixtures for loading the Chrome extension in Playwright
- `tests/utils.js`: Utility functions for testing
- `tests/extension.spec.js`: Basic functionality tests
- `tests/p2p-sync.spec.js`: P2P synchronization tests
- `tests/device-identification.spec.js`: Device identification tests

### Linting

This project uses ESLint for code quality:

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### CI/CD

GitHub Actions workflows are set up for:

1. Linting the code
2. Running tests
3. Packaging the extension

Artifacts generated:
- Test reports
- Screenshots of failed tests
- Packaged extension (.zip)

## License

MIT