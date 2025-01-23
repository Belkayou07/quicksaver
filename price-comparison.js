class PriceComparison {
  constructor() {
    this.marketplaces = {
      'amazon.fr': { currency: 'EUR', name: 'Amazon FR' },
      'amazon.co.uk': { currency: 'GBP', name: 'Amazon UK' },
      'amazon.de': { currency: 'EUR', name: 'Amazon DE' },
      'amazon.it': { currency: 'EUR', name: 'Amazon IT' },
      'amazon.es': { currency: 'EUR', name: 'Amazon ES' },
      'amazon.nl': { currency: 'EUR', name: 'Amazon NL' },
      'amazon.com.be': { currency: 'EUR', name: 'Amazon BE' }
    };
    this.cache = new Map();
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    this.TIMEOUT = 5000; // 5 secondes timeout pour chaque requête
  }

  async searchProductInMarketplaces(asin) {
    if (!asin) {
      throw new Error('Invalid ASIN');
    }

    const results = await Promise.all(Object.entries(this.marketplaces).map(async ([domain, info]) => {
      const cacheKey = `${domain}-${asin}`;
      const cachedResult = this.getFromCache(cacheKey);

      if (cachedResult && this.isValidPrice(cachedResult.price)) {
        return cachedResult;
      } else {
        const result = await this.fetchPrice(domain, info, asin, cacheKey);
        return result;
      }
    }));

    // Filter out null results and return
    return results.filter(result => result !== null);
  }

  async fetchPrice(domain, info, asin, cacheKey) {
    try {
      const url = `https://${domain}/dp/${asin}`;
      
      // Use background script to fetch the page
      const response = await chrome.runtime.sendMessage({
        action: 'fetchPrice',
        url: url
      });

      // If the response is null (404) or failed, return null quietly
      if (!response || !response.success || !response.html) {
        return null;
      }

      // Parse the HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(response.html, 'text/html');

      // Check if the product is available
      if (!this.isProductAvailable(doc)) {
        return null;
      }

      // Find the price
      const price = this.findPrice(doc);
      if (!this.isValidPrice(price)) {
        return null;
      }

      // Extract numeric price
      const numericPrice = this.cleanPrice(price, info.currency);
      
      // Find shipping cost
      const shippingCost = this.findShippingCost(doc, info.currency);

      const result = {
        marketplace: info.name,
        price: this.formatPrice(numericPrice, info.currency),
        currency: info.currency,
        url: url
      };

      // Add shipping cost to price if it exists
      if (shippingCost > 0) {
        const totalPrice = numericPrice + shippingCost;
        result.price = this.formatPrice(totalPrice, info.currency);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Erreur lors de la recherche sur ${domain}:`, error);
      return null;
    }
  }

  findPrice(doc) {
    // Primary price selectors that we trust most
    const primarySelectors = [
      '.a-price .a-offscreen',
      '#price_inside_buybox',
      '#priceblock_ourprice',
      '#priceblock_dealprice'
    ];

    // Check primary selectors first
    for (const selector of primarySelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim()) {
        const price = element.textContent.trim();
        // Verify it's a valid price format
        if (/[0-9.,]+/.test(price)) {
          return price;
        }
      }
    }

    return null;
  }

  isProductAvailable(doc) {
    // First check if there's a clear "unavailable" message
    const notAvailableTexts = [
      'currently unavailable',
      'nicht verfügbar',
      'non disponible',
      'temporairement en rupture de stock',
      'actuellement indisponible',
      'currently out of stock',
      'no disponible'
    ];

    const availabilityElement = doc.querySelector('#availability, #availabilityInsideBuyBox_feature_div');
    if (availabilityElement) {
      const text = availabilityElement.textContent.toLowerCase().trim();
      if (notAvailableTexts.some(phrase => text.includes(phrase))) {
        return false;
      }
    }

    // Check if add to cart button exists and is not disabled
    const addToCartBtn = doc.querySelector('#add-to-cart-button');
    if (!addToCartBtn || addToCartBtn.disabled) {
      return false;
    }

    // Check if there's a valid price
    const price = this.findPrice(doc);
    if (!price || !this.isValidPrice(price)) {
      return false;
    }

    return true;
  }

  findShippingCost(doc, currency) {
    // Common shipping cost selectors on Amazon
    const shippingSelectors = [
      '#deliveryMessageMirId .a-color-secondary', // Standard shipping message
      '#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE', // Prime delivery message
      '#delivery-message', // Delivery message
      '#shipping-message', // Shipping message
      '.delivery-message', // Alternative delivery message
      '#price-shipping-message', // Price shipping message
      '.shipping-message-price' // Shipping price
    ];

    for (const selector of shippingSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent.trim().toLowerCase();
        
        // If free shipping is mentioned, return 0
        if (text.includes('free shipping') || text.includes('free delivery') || 
            text.includes('livraison gratuite') || text.includes('envío gratis') || 
            text.includes('spedizione gratuita') || text.includes('gratis verzending')) {
          return 0;
        }

        // Try to find a shipping cost amount
        const matches = text.match(/[0-9]+[.,][0-9]{2}[\s]*[€£]/g) || 
                       text.match(/[€£][\s]*[0-9]+[.,][0-9]{2}/g);
        
        if (matches) {
          const costStr = matches[0].replace(/[^\d.,]/g, '').replace(',', '.');
          return parseFloat(costStr);
        }
      }
    }

    // If no shipping cost is found, return 0 (assume free shipping)
    return 0;
  }

  cleanPrice(price, currency) {
    if (!price) return null;
    
    // Remove currency symbols and non-numeric characters except dots and commas
    const numericString = price.replace(/[^0-9.,]/g, '');
    
    // Convert to standard format (using dot as decimal separator)
    const standardized = numericString.includes(',') ? 
      numericString.replace(/\./g, '').replace(',', '.') : 
      numericString;

    const number = parseFloat(standardized);
    return isNaN(number) ? null : number;
  }

  formatPrice(amount, currency) {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) {
        return '0.00';
      }

      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      return formatter.format(amount);
    } catch (error) {
      console.error('Error formatting price:', error);
      return `0.00 ${currency}`;
    }
  }

  isValidPrice(price) {
    if (!price) return false;
    const numericValue = this.cleanPrice(price);
    return !isNaN(numericValue) && numericValue > 0;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  sortResults(results) {
    const getPriceValue = price => {
      if (price === 'N/A' || price === 'Erreur' || price === 'Timeout') return Infinity;
      return parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.'));
    };

    return results.sort((a, b) => getPriceValue(a.price) - getPriceValue(b.price));
  }
} 