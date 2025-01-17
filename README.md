# Quick-Saver

A browser extension that helps Amazon shoppers find the best prices across different regional marketplaces.

## Features

- Compare prices across multiple Amazon regional marketplaces
- View shipping costs and import taxes
- Automatic currency conversion
- Support for third-party sellers
- Clean and intuitive interface

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

## Project Structure

```
quick-saver/
├── manifest.json           # Extension configuration
├── src/
│   ├── popup/             # Extension popup UI
│   ├── options/           # Settings page
│   ├── content/           # Content scripts
│   ├── background/        # Service worker
│   └── utils/             # Shared utilities
├── assets/                # Icons and images
└── dist/                  # Built files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 