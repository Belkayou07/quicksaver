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
      throw new Error('ASIN non valide');
    }

    const results = [];
    const promises = [];
    
    for (const [domain, info] of Object.entries(this.marketplaces)) {
      const cacheKey = `${domain}-${asin}`;
      const cachedResult = this.getFromCache(cacheKey);
      
      if (cachedResult && this.isValidPrice(cachedResult.price)) {
        results.push(cachedResult);
      } else {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), this.TIMEOUT);
        });

        promises.push(
          Promise.race([
            this.fetchPrice(domain, info, asin, cacheKey),
            timeoutPromise
          ]).catch(error => null) // Retourner null en cas d'erreur
        );
      }
    }

    const BATCH_SIZE = 3;
    const newResults = [];
    
    for (let i = 0; i < promises.length; i += BATCH_SIZE) {
      const batch = promises.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch);
      // Filtrer les résultats null et les prix invalides
      newResults.push(...batchResults.filter(result => result && this.isValidPrice(result.price)));
    }
    
    results.push(...newResults);
    
    return this.sortResults(results);
  }

  async fetchPrice(domain, info, asin, cacheKey) {
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      
      const response = await fetch(`https://${domain}/dp/${asin}`, {
        signal,
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124'
        }
      });

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // Vérifier si le produit est disponible
      if (!this.isProductAvailable(doc)) {
        return null;
      }

      const price = this.findPrice(doc);
      if (!price) {
        return null;
      }

      const cleanedPrice = this.cleanPrice(price, info.currency);
      if (!this.isValidPrice(cleanedPrice)) {
        return null;
      }

      const result = {
        marketplace: info.name,
        price: cleanedPrice,
        currency: info.currency,
        url: `https://${domain}/dp/${asin}`
      };

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

  isProductAvailable(doc) {
    // Vérifier les indicateurs de disponibilité
    const unavailableSelectors = [
      '#outOfStock',
      '#availability .a-color-price',
      '#availability .a-color-error',
      '.a-spacing-micro.a-color-price'
    ];

    for (const selector of unavailableSelectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.trim().toLowerCase().includes('indisponible')) {
        return false;
      }
    }

    // Vérifier si le bouton d'achat est présent
    const buyButton = doc.querySelector('#add-to-cart-button, #buy-now-button');
    if (!buyButton) {
      return false;
    }

    return true;
  }

  isValidPrice(price) {
    if (!price || price === 'N/A' || price === 'Erreur' || price === 'Timeout' || price.startsWith('.')) {
      return false;
    }
    
    // Vérifier que le prix contient des chiffres
    const numericValue = parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.'));
    return !isNaN(numericValue) && numericValue > 0;
  }

  findPrice(doc) {
    const selectors = [
      '.a-price .a-offscreen',
      '.a-price-whole',
      '#priceblock_ourprice',
      '.a-color-price',
      'span.a-price span[aria-hidden="true"]',
      '#corePrice_feature_div .a-price-whole',
      '.apexPriceToPay .a-price-whole',
      '#price_inside_buybox',
      '#newBuyBoxPrice'
    ].join(',');

    const element = doc.querySelector(selectors);
    return element ? element.textContent.trim() : null;
  }

  cleanPrice(price, currency) {
    return price
      .replace(/[^\d.,€£]/g, '')
      .replace(/,(\d{2})$/, '.$1')
      .replace(/\.(\d{3})/g, '$1')
      .trim() + (price.includes('€') || price.includes('£') ? '' : (currency === 'EUR' ? '€' : '£'));
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