# Tab Garden 🌱

A Chrome extension that transforms your new tab page into a visual garden where each open tab is represented by a plant, encouraging mindful browsing habits.

## Features

- **Visual Tab Representation**: Each open tab becomes a plant in your garden
- **Plant Variety**: Different websites get different plant types (YouTube → Fern, GitHub → Bonsai, etc.)
- **Health System**: Plants stay healthy when you visit them, but start wilting after 24 hours of inactivity
- **Interactive Garden**: Click on plants to switch to their corresponding tabs
- **Real-time Updates**: Your garden updates automatically as you open, close, and visit tabs
- **Beautiful Design**: Animated background and responsive layout with a garden theme

## Plant Types

- 🌿 **Fern** - YouTube and video sites
- 🌳 **Bonsai** - GitHub and development sites  
- 🌸 **Flower** - Twitter/X and social media
- 🌵 **Cactus** - News and information sites
- 🌻 **Sunflower** - Google and search engines
- 🌲 **Tree** - Stack Overflow and Q&A sites
- 🎋 **Bamboo** - Reddit and forums
- 🌱 **Sapling** - All other websites

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and your new tab page will be replaced with Tab Garden

## How It Works

- **Healthy Plants**: Tabs visited within the last 24 hours appear as healthy, colorful plants
- **Wilting Plants**: Tabs not accessed for over 24 hours become grayscale and slightly rotated
- **Garden Stats**: View your garden statistics at the bottom (total plants, healthy count, wilting count)
- **Tab Management**: Click any plant to switch to that tab, or right-click to close it

## Keyboard Shortcuts

- `R` - Refresh the garden display
- `Esc` - Close the new tab

## Technical Details

- **Manifest V3**: Built with the latest Chrome extension standards
- **Permissions**: Uses `tabs`, `storage`, and `alarms` permissions
- **Storage**: Tab data is stored locally using `chrome.storage.local`
- **Background Service**: Monitors tab activity and updates plant states
- **Responsive Design**: Works on desktop, tablet, and mobile screens

## Privacy

This extension only stores tab information locally on your device. No data is sent to external servers.

## Development

The extension consists of:
- `manifest.json` - Extension configuration
- `background.js` - Service worker for tab monitoring
- `newTab.html` - New tab page structure
- `newTab.css` - Garden styling and animations
- `newTab.js` - Garden rendering and interaction logic

## License

MIT License - Feel free to modify and distribute!