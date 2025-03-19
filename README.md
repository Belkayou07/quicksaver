# Quick-Saver

Quick-Saver is a browser extension that helps Amazon shoppers find the best deals by automatically comparing prices across different Amazon regional marketplaces. This repository contains both the browser extension code and a promotional website.

## Project Structure

The repository is organized as follows:

- `/NEWVERSIONCLAUDE/` - The browser extension source code
- `/website/` - The promotional website

## Browser Extension

### Features

- **Price Comparison**: Automatically identify and compare product listings from other Amazon regions (UK, Germany, France, Italy, Spain, Netherlands, Belgium, Sweden, and Poland)
- **Price Display Widget**: Show alternative pricing directly on the Amazon product page
- **Multi-Region Support**: Choose which Amazon regions to compare prices with
- **Shipping & Taxes Calculator**: Estimate shipping costs and taxes for products from other regions
- **Currency Conversion**: Automatically convert prices to your local currency
- **Customizable Interface**: Light/dark mode and various display options

### Development Setup

To set up the extension for development:

1. Clone this repository:
```
git clone https://github.com/yourusername/quick-saver.git
cd quick-saver/NEWVERSIONCLAUDE
```

2. Install dependencies:
```
npm install
```

3. Run in development mode:
```
npm run dev
```

4. Load the extension in your browser:
   - For Chrome: Go to `chrome://extensions/`, enable Developer mode, and click "Load unpacked". Select the `dist` folder.
   - For Firefox: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` file in the `dist` folder.

### Building for Production

To build the extension for production:

```
npm run build
```

This will create a production-ready version in the `dist` folder.

## Website

The website serves as a landing page for the Quick-Saver extension, providing information about features, installation instructions, and more.

### Website Structure

- `/website/index.html` - Main landing page
- `/website/css/` - CSS stylesheets
- `/website/js/` - JavaScript files
- `/website/img/` - Images and assets

### Developing the Website

The website is built with plain HTML, CSS, and JavaScript, making it easy to develop and maintain.

To view the website locally, simply open the `website/index.html` file in your web browser.

### Deployment

You can deploy the website to any standard web hosting service:

1. Upload the entire `/website` directory to your web server
2. Ensure the server is configured to serve `index.html` as the default document

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all the open-source libraries used in this project
- Amazon Product Advertising API for enabling product data access
- All contributors and users of the extension 