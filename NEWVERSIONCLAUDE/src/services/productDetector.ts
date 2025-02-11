export class ProductDetector {
  private static ASIN_REGEX = /[A-Z0-9]{10}/;
  
  /**
   * Detects if current page is an Amazon product page
   */
  public static isProductPage(url: string): boolean {
    return url.includes('/dp/') || url.includes('/gp/product/');
  }

  /**
   * Extracts ASIN from Amazon URL or page content
   */
  public static extractASIN(url: string): string | null {
    // Try to extract from URL first
    const urlPatterns = [
      /\/dp\/([A-Z0-9]{10})/,
      /\/gp\/product\/([A-Z0-9]{10})/,
      /\/([A-Z0-9]{10})(?:\/|\?|$)/
    ];

    for (const pattern of urlPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Gets current marketplace from URL
   */
  public static getCurrentMarketplace(url: string): string {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  }

  /**
   * Extracts basic product information from the current page
   */
  public static extractProductInfo(): {
    title: string;
    price: number | null;
    currency: string;
    shipping: number | null;
  } {
    const title = document.querySelector('#productTitle')?.textContent?.trim() || '';
    
    // Comprehensive price selectors for different marketplace layouts
    const priceSelectors = [
      '.a-price .a-offscreen',                    // Most common modern layout
      '#priceblock_ourprice',                     // Classic layout
      '#priceblock_dealprice',                    // Deal price
      '#price_inside_buybox',                     // Buy box price
      '#newBuyBoxPrice',                          // New buy box layout
      '#corePrice_feature_div .a-price-whole',    // Newer layout whole price
      '.price-info-supersize .a-price .a-offscreen', // Supersize price display
      '#price .a-price .a-offscreen',             // Simple price layout
      '#apex_desktop_newAccordionRow .a-price .a-offscreen' // Apex desktop layout
    ];

    let priceElement = null;
    for (const selector of priceSelectors) {
      priceElement = document.querySelector(selector);
      if (priceElement) break;
    }

    const priceText = priceElement?.textContent || '';
    const price = this.extractNumberFromPrice(priceText);
    
    // Get currency symbol/code
    const currency = this.extractCurrencyCode(priceText);
    
    // Comprehensive shipping selectors
    const shippingSelectors = [
      '#deliveryMessageMirId',                    // Common delivery message
      '#mir-layout-DELIVERY_BLOCK',               // Delivery block
      '#delivery-message',                        // Simple delivery message
      '#amazonGlobal_feature_div',                // Global shipping
      '.delivery-message',                        // Generic delivery message
      '#shipping-message',                        // Shipping message
      '#delivery-promise-text',                   // Delivery promise
      '#fast-track-message',                      // Fast track shipping
      '.shipping-message-container'               // Shipping container
    ];

    let shippingElement = null;
    for (const selector of shippingSelectors) {
      shippingElement = document.querySelector(selector);
      if (shippingElement) break;
    }

    const shippingText = shippingElement?.textContent || '';
    
    // Parse shipping cost
    let shipping: number | null = null;
    if (shippingText) {
      if (shippingText.toLowerCase().includes('free')) {
        shipping = 0;
      } else {
        // Look for price patterns in shipping text
        const priceMatch = shippingText.match(/[\d,.]+/);
        if (priceMatch) {
          shipping = this.extractNumberFromPrice(priceMatch[0]);
        }
      }
    }

    return {
      title,
      price,
      currency,
      shipping
    };
  }

  private static extractNumberFromPrice(priceString: string): number | null {
    // Remove all non-numeric characters except . and ,
    const cleanPrice = priceString.replace(/[^0-9.,]/g, '');
    
    // Handle different number formats
    let number: string;
    if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
      // Format: 1.234,56
      if (cleanPrice.indexOf('.') < cleanPrice.indexOf(',')) {
        number = cleanPrice.replace(/\./g, '').replace(',', '.');
      }
      // Format: 1,234.56
      else {
        number = cleanPrice.replace(/,/g, '');
      }
    } else if (cleanPrice.includes(',')) {
      // Assume comma is decimal separator
      number = cleanPrice.replace(',', '.');
    } else {
      number = cleanPrice;
    }
    
    const parsed = parseFloat(number);
    return isNaN(parsed) ? null : parsed;
  }

  private static extractCurrencyCode(priceString: string): string {
    const currencyMap: { [key: string]: string } = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR',
      'R$': 'BRL',
      'CA$': 'CAD',
      'AU$': 'AUD',
      'MX$': 'MXN',
      'zł': 'PLN',
      'kr': 'SEK',
      '₺': 'TRY',
      'د.إ': 'AED',
      'ر.س': 'SAR',
      'S$': 'SGD',
      '元': 'CNY',
      'ج.م': 'EGP'
    };

    for (const [symbol, code] of Object.entries(currencyMap)) {
      if (priceString.includes(symbol)) {
        return code;
      }
    }

    // Try to find currency code in text
    const currencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'BRL', 'CAD', 'AUD', 
                          'MXN', 'PLN', 'SEK', 'TRY', 'AED', 'SAR', 'SGD', 'CNY', 'EGP'];
    for (const code of currencyCodes) {
      if (priceString.includes(code)) {
        return code;
      }
    }

    return 'USD'; // Default fallback
  }

  /**
   * Generates affiliate link for a given marketplace and ASIN
   */
  public static generateAffiliateLink(marketplace: string, asin: string): string {
    const affiliateId = 'azpricecompar-21';
    return `https://${marketplace}/dp/${asin}?tag=${affiliateId}`;
  }
}
