// Product data extractor for Amazon pages
class AmazonProductExtractor {
  constructor() {
    this.productData = null;
    this.debug = true; // Enable debug logging
  }

  log(message, data) {
    if (this.debug) {
      console.log(`[Quick-Saver] ${message}`, data || '');
    }
  }

  extractProductData() {
    const url = window.location.href;
    this.log('Checking URL:', url);

    if (!this.isProductPage(url)) {
      this.log('Not a product page');
      return null;
    }

    const data = {
      title: this.getProductTitle(),
      price: this.getProductPrice(),
      asin: this.getProductASIN(),
      currency: this.getCurrency(),
      marketplace: this.getMarketplace(),
      shipping: this.getShippingInfo(),
      shippingAvailability: this.getShippingAvailability(),
      url: window.location.href,
      image: this.getProductImage(),
      originalPrice: this.getProductPrice(), // Store original price before conversion
      originalCurrency: this.getCurrency() // Store original currency
    };

    this.log('Extracted product data:', data);
    
    // Validate essential data
    if (!data.title || !data.price || !data.asin) {
      this.log('Missing essential product data');
      return null;
    }

    return data;
  }

  isProductPage(url) {
    // More comprehensive product page detection
    const isProduct = url.includes('/dp/') || 
                     url.includes('/gp/product/') || 
                     url.includes('/product/') ||
                     document.querySelector('#productTitle') !== null;
    
    this.log('Product page detection:', isProduct);
    return isProduct;
  }

  getProductTitle() {
    const selectors = [
      '#productTitle',
      '#title',
      '.product-title'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const title = element.textContent.trim();
        this.log('Found title using selector:', selector);
        return title;
      }
    }

    this.log('No title found');
    return null;
  }

  getProductPrice() {
    const priceSelectors = [
      '.priceToPay span.a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      '.a-price span[aria-hidden="true"]',
      '#price_inside_buybox',
      '#newBuyBoxPrice',
      '#price'
    ];

    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const priceText = element.textContent.trim();
        this.log('Found price using selector:', selector);
        this.log('Raw price text:', priceText);
        
        // Extract numbers and decimals, handling both dot and comma
        const price = priceText
          .replace(/[^0-9,\.]/g, '')
          .replace(',', '.');
        
        const parsedPrice = parseFloat(price);
        if (!isNaN(parsedPrice)) {
          this.log('Parsed price:', parsedPrice);
          return parsedPrice;
        }
      }
    }

    this.log('No valid price found');
    return null;
  }

  getProductASIN() {
    // Try multiple ASIN detection methods
    let asin = null;

    // Method 1: URL parsing
    const asinMatch = window.location.pathname.match(/\/(dp|gp\/product|product)\/([A-Z0-9]{10})/);
    if (asinMatch) {
      asin = asinMatch[2];
      this.log('Found ASIN in URL:', asin);
      return asin;
    }

    // Method 2: Data attribute
    const dataAsinElement = document.querySelector('[data-asin]');
    if (dataAsinElement) {
      asin = dataAsinElement.getAttribute('data-asin');
      this.log('Found ASIN in data attribute:', asin);
      return asin;
    }

    // Method 3: Meta tags
    const metaTags = document.getElementsByTagName('meta');
    for (const tag of metaTags) {
      const content = tag.getAttribute('content');
      if (content && content.match(/[A-Z0-9]{10}/)) {
        asin = content.match(/[A-Z0-9]{10}/)[0];
        this.log('Found ASIN in meta tag:', asin);
        return asin;
      }
    }

    this.log('No ASIN found');
    return null;
  }

  getProductImage() {
    const selectors = [
      '#landingImage',
      '#imgBlkFront',
      '#main-image',
      '#productImage'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.src) {
        this.log('Found image using selector:', selector);
        return element.src;
      }
    }

    this.log('No product image found');
    return null;
  }

  getCurrency() {
    const marketplace = this.getMarketplace();
    switch (marketplace) {
      case 'UK':
        return 'GBP';
      case 'SE':
        return 'SEK';
      default:
        return 'EUR'; // BE, NL, FR, DE, IT, ES use EUR
    }
  }

  getMarketplace() {
    const domain = window.location.hostname;
    let marketplace = null;

    if (domain.includes('amazon.fr')) marketplace = 'FR';
    else if (domain.includes('amazon.nl')) marketplace = 'NL';
    else if (domain.includes('amazon.be')) marketplace = 'BE';
    else if (domain.includes('amazon.de')) marketplace = 'DE';
    else if (domain.includes('amazon.it')) marketplace = 'IT';
    else if (domain.includes('amazon.es')) marketplace = 'ES';
    else if (domain.includes('amazon.se')) marketplace = 'SE';
    else if (domain.includes('amazon.co.uk')) marketplace = 'UK';

    this.log('Detected marketplace:', marketplace);
    return marketplace;
  }

  getShippingInfo() {
    const selectors = [
      '#deliveryMessageMirId',
      '#delivery-message',
      '#mir-layout-DELIVERY_BLOCK',
      '.delivery-message'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const shipping = element.textContent.trim();
        this.log('Found shipping info using selector:', selector);
        return shipping;
      }
    }

    this.log('No shipping info found');
    return null;
  }

  getShippingAvailability() {
    // Check for common shipping restriction messages
    const restrictionSelectors = [
      '.delivery-restriction-message',
      '#deliveryBlockMessage',
      '#shipping-restriction-message',
      '.a-box-error'
    ];

    // Check for explicit "cannot be shipped" messages
    for (const selector of restrictionSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.toLowerCase();
        if (text.includes('cannot be shipped') || 
            text.includes('cannot ship') || 
            text.includes('does not ship') ||
            text.includes('niet verzonden') || // Dutch
            text.includes('ne peut pas être livré') || // French
            text.includes('nie może zostać wysłany')) { // Polish
          this.log('Found shipping restriction:', text);
          return {
            canShip: false,
            message: element.textContent.trim()
          };
        }
      }
    }

    // Check for positive shipping messages
    const deliveryElement = document.querySelector('#deliveryMessageMirId, #delivery-message');
    if (deliveryElement) {
      const text = deliveryElement.textContent.toLowerCase();
      // Look for positive shipping indicators
      if (text.includes('delivered') || 
          text.includes('delivery') ||
          text.includes('ships to') ||
          text.includes('verzending') || // Dutch
          text.includes('livraison') || // French
          text.includes('wysyłka')) { // Polish
        return {
          canShip: true,
          message: deliveryElement.textContent.trim()
        };
      }
    }

    // Default to unknown if no clear indicators are found
    return {
      canShip: null,
      message: 'Shipping availability unknown'
    };
  }
}

// Initialize the extractor
const extractor = new AmazonProductExtractor();

// Function to send product data to the extension
function sendProductData() {
  const productData = extractor.extractProductData();
  if (productData) {
    console.log('[Quick-Saver] Sending product data to extension:', productData);
    chrome.runtime.sendMessage({
      type: 'PRODUCT_DATA',
      data: productData
    });
  } else {
    console.log('[Quick-Saver] No valid product data to send');
  }
}

// Run on page load
console.log('[Quick-Saver] Content script loaded, attempting initial product detection');
setTimeout(sendProductData, 1000); // Wait for page to fully load

// Run when URL changes (for single-page navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('[Quick-Saver] URL changed, attempting product detection');
    setTimeout(sendProductData, 1000); // Wait for page content to load
  }
}).observe(document, { subtree: true, childList: true }); 