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

## License

MIT