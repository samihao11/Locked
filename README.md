# Focus Lock Chrome Extension

A Chrome extension that helps you stay focused by temporarily locking you into your current tabs, preventing distracting tab switches or new searches.

## Features

- 🔒 Lock your current browser tabs for a specified duration
- ⏲️ Customizable timer (1-180 minutes)
- 🚫 Prevents opening new tabs during focus session
- 🎯 Prevents changing URLs in existing tabs
- ⏱️ Visual countdown timer on all locked tabs
- ✅ "Finished" button to end focus session early if needed

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## How to Use

1. Click the Focus Lock extension icon in your Chrome toolbar
2. Enter the desired focus duration (in minutes)
3. Click "Start Focus Mode"
4. Your current tabs will be locked until the timer expires
5. A countdown timer will appear in the top-right corner of each tab
6. Click "Finished" at any time to end the focus session early

## Technical Details

The extension uses:

- Chrome Extension Manifest V3
- Content Scripts for UI injection
- Background Service Worker for tab management
- Chrome's scripting and tabs APIs

## Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup interface
- `background.js` - Background service worker
- `overlay.js` - Content script for timer display
- `icon.png` - Extension icon

## Privacy

This extension:

- Does not collect any user data
- Does not communicate with external servers
- Only accesses necessary tab and URL information
- All functionality runs locally in your browser

## Contributing

Feel free to submit issues and enhancement requests!
