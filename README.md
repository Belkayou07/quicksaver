# Amazon Price Comparison Extension

## Project Overview
The **Amazon Price Comparison Extension** is a browser add-on designed to help users save money by comparing product prices across different Amazon regional marketplaces (e.g., Amazon.fr, Amazon.de, Amazon.it). When a user visits a product page on any supported Amazon website, the extension fetches the same product's details (name, price, model number, ratings, and image) from other marketplaces and displays them in a popup. This ensures the user can identify the best deal in real-time.

---

## How It Works
1. **User Interaction**:
   - When the user navigates to a product page (e.g., `https://www.amazon.fr/dp/B08XYZ1234`), the extension detects the page content.
   - A button or popup is activated, labeled "Compare Prices Across Amazon Marketplaces."

2. **Background Process**:
   - The extension's background script communicates with Amazon's APIs or scrapes public data (if APIs are unavailable).
   - It fetches product details such as name, model number, price, ratings, and image from:
     - Amazon.fr
     - Amazon.de
     - Amazon.it
     - Amazon.es
     - Amazon.co.uk
     - Amazon.be

3. **Data Display**:
   - Within 10 seconds, the extension processes and displays:
     - The product name.
     - Model number.
     - Current price.
     - Product ratings.
     - Product image.
   - If a lower price is found, the popup highlights it and provides a link to the corresponding product page.

4. **Error Handling**:
   - If there are issues fetching data (e.g., API limits or network errors), a user-friendly error message is displayed.

---

## Example Workflow
### Scenario:
   - The user is viewing a product on Amazon.fr priced at €25.
   - The extension runs automatically and finds the same product on Amazon.de for €20.

### Output:
   - A popup appears with the following details:
     ```
     Product Name: Wireless Bluetooth Earbuds
     Model Number: WB123-XY
     Current Prices:
       - Amazon.fr: €25
       - Amazon.de: €20 (Best Price!)
       - Amazon.it: €22
     Ratings:
       - Amazon.fr: 4.5/5
       - Amazon.de: 4.7/5
     [View on Amazon.de] (Link)
     ```

---

## Features
- **Real-Time Price Comparison**: Displays product prices from multiple Amazon marketplaces in under 10 seconds.
- **Detailed Information**: Shows product name, model number, ratings, and an image.
- **User-Friendly Interface**: Popup design ensures seamless interaction.
- **Error Notifications**: Clear messages if an error occurs during data retrieval.

---

## File Structure
```
AmazonPriceComparisonExtension/
├── manifest.json        # Extension configuration and metadata
├── src/
│   ├── background/
│   │   └── background.js # Handles API calls and data fetching
│   ├── content/
│   │   └── content.js    # Injected script for detecting product pages
│   ├── popup/
│   │   ├── popup.html    # UI for displaying price comparison
│   │   ├── popup.css     # Styling for the popup
│   │   └── popup.js      # Logic for rendering data in the popup
│   ├── utils/
│       └── fetcher.js    # Helper functions for API requests
├── icons/                # Extension icons
└── README.md             # Documentation
```

---

## Setup Instructions
1. **Prerequisites**:
   - Google Chrome or any Chromium-based browser.
   - Basic understanding of JavaScript and browser extensions.

2. **Installation**:
   - Clone the repository: `git clone https://github.com/username/AmazonPriceComparisonExtension.git`
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer Mode**.
   - Click **Load Unpacked** and select the project directory.

3. **Testing**:
   - Navigate to any supported Amazon marketplace and open a product page.
   - Activate the extension and verify the popup functionality.

---

## APIs Used
The extension fetches data using Amazon's Product Advertising API. If API access is unavailable, the extension uses public scraping techniques.

---

## Troubleshooting
- **Popup Shows "Comparing prices..." Indefinitely**:
   - Ensure API credentials are valid.
   - Check network connection.
   - Review background script logs for errors.

- **Manifest File Issues**:
   - Verify the file follows the JSON schema for Manifest V3.
   - Ensure all paths in `background.service_worker` and `content_scripts` are correct.

---

## Future Enhancements
- Add support for additional marketplaces (e.g., Amazon.com, Amazon.ca).
- Provide historical price trends.
- Include shipping costs in price comparison.
- Enable user customization (e.g., select preferred marketplaces).

---

## License
This project is licensed under the MIT License.

---

# Amazon Price Comparison Extension

## Project Overview
The **Amazon Price Comparison Extension** is a browser add-on designed to help users save money by comparing product prices across different Amazon regional marketplaces (e.g., Amazon.fr, Amazon.de, Amazon.it). When a user visits a product page on any supported Amazon website, the extension fetches the same product's details (name, price, model number, ratings, and image) from other marketplaces and displays them in a popup. This ensures the user can identify the best deal in real-time.

---

## How It Works
1. **User Interaction**:
   - When the user navigates to a product page (e.g., `https://www.amazon.fr/dp/B08XYZ1234`), the extension detects the page content.
   - A button or popup is activated, labeled "Compare Prices Across Amazon Marketplaces."

2. **Background Process**:
   - The extension's background script communicates with Amazon's APIs or scrapes public data (if APIs are unavailable).
   - It fetches product details such as name, model number, price, ratings, and image from:
     - Amazon.fr
     - Amazon.de
     - Amazon.it
     - Amazon.es
     - Amazon.co.uk
     - Amazon.be

3. **Data Display**:
   - Within 10 seconds, the extension processes and displays:
     - The product name.
     - Model number.
     - Current price.
     - Product ratings.
     - Product image.
   - If a lower price is found, the popup highlights it and provides a link to the corresponding product page.

4. **Error Handling**:
   - If there are issues fetching data (e.g., API limits or network errors), a user-friendly error message is displayed.

---

## Example Workflow
### Scenario:
   - The user is viewing a product on Amazon.fr priced at €25.
   - The extension runs automatically and finds the same product on Amazon.de for €20.

### Output:
   - A popup appears with the following details:
     ```
     Product Name: Wireless Bluetooth Earbuds
     Model Number: WB123-XY
     Current Prices:
       - Amazon.fr: €25
       - Amazon.de: €20 (Best Price!)
       - Amazon.it: €22
     Ratings:
       - Amazon.fr: 4.5/5
       - Amazon.de: 4.7/5
     [View on Amazon.de] (Link)
     ```

---

## Features
- **Real-Time Price Comparison**: Displays product prices from multiple Amazon marketplaces in under 10 seconds.
- **Detailed Information**: Shows product name, model number, ratings, and an image.
- **User-Friendly Interface**: Popup design ensures seamless interaction.
- **Error Notifications**: Clear messages if an error occurs during data retrieval.
- **Intelligent Matching**: The extension uses intelligent algorithms to match products across different marketplaces even if the URLs or product codes vary slightly.

---

## Example of Functionality
### Detecting the Product Page:
When the user lands on an Amazon product page, the extension analyzes the URL to identify the unique product identifier (ASIN). For instance:
- URL: `https://www.amazon.fr/dp/B08XYZ1234`
- Extracted ASIN: `B08XYZ1234`

### Fetching Data:
Using the ASIN, the extension queries the product across the supported marketplaces. If the ASIN is not directly available in another region, the extension uses a search algorithm to find the closest match by comparing:
- Product title
- Brand and model number
- Price range

### Displaying Results:
If matches are found, the popup displays them in an organized table with a link to view the product on each marketplace. For example:
```
Marketplace   | Price   | Ratings | Link
--------------|---------|---------|----------------
Amazon.fr     | €25.00  | 4.5/5   | [View Product]
Amazon.de     | €20.00  | 4.7/5   | [View Product]
Amazon.it     | €22.00  | 4.6/5   | [View Product]
```

If no matches are found, the popup displays a message such as: "No comparable products found on other marketplaces."

---

## File Structure
```
AmazonPriceComparisonExtension/
├── manifest.json        # Extension configuration and metadata
├── src/
│   ├── background/
│   │   └── background.js # Handles API calls and data fetching
│   ├── content/
│   │   └── content.js    # Injected script for detecting product pages
│   ├── popup/
│   │   ├── popup.html    # UI for displaying price comparison
│   │   ├── popup.css     # Styling for the popup
│   │   └── popup.js      # Logic for rendering data in the popup
│   ├── utils/
│       └── fetcher.js    # Helper functions for API requests
├── icons/                # Extension icons
└── README.md             # Documentation
```

---

## Setup Instructions
1. **Prerequisites**:
   - Google Chrome or any Chromium-based browser.
   - Basic understanding of JavaScript and browser extensions.

2. **Installation**:
   - Clone the repository: `git clone https://github.com/username/AmazonPriceComparisonExtension.git`
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer Mode**.
   - Click **Load Unpacked** and select the project directory.

3. **Testing**:
   - Navigate to any supported Amazon marketplace and open a product page.
   - Activate the extension and verify the popup functionality.

---

## APIs Used
The extension fetches data using Amazon's Product Advertising API. If API access is unavailable, the extension uses public scraping techniques.

---

## Troubleshooting
- **Popup Shows "Comparing prices..." Indefinitely**:
   - Ensure API credentials are valid.
   - Check network connection.
   - Review background script logs for errors.

- **Manifest File Issues**:
   - Verify the file follows the JSON schema for Manifest V3.
   - Ensure all paths in `background.service_worker` and `content_scripts` are correct.

---

## Future Enhancements
- Add support for additional marketplaces (e.g., Amazon.com, Amazon.ca).
- Provide historical price trends.
- Include shipping costs in price comparison.
- Enable user customization (e.g., select preferred marketplaces).
- Implement multi-language support for a better user experience across regions.

---

## License
This project is licensed under the MIT License.

---

## Author
Mohamed Bounou





