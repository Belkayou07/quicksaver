import { ProductDetector } from './productDetector';
import { MarketplacePrice } from '../types/marketplace';
import { browser } from 'webextension-polyfill-ts';
import { MARKETPLACES } from '../config/marketplaces';

export class PriceService {
  private static EXCHANGE_API_BASE = 'https://api.exchangerate.fun/latest';
  private static exchangeRates: { [key: string]: number } = {};
  private static lastUpdate: number = 0;
  private static readonly UPDATE_INTERVAL = 3600000; // 1 hour in milliseconds
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000; // 1 second

  private static readonly MARKETPLACES = MARKETPLACES;

  /**
   * Updates exchange rates from the API
   */
  private static async updateExchangeRates(retryCount = 3): Promise<void> {
    const now = Date.now();
    if (now - this.lastUpdate < this.UPDATE_INTERVAL && Object.keys(this.exchangeRates).length > 0) {
      return;
    }

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const currencies = Object.values(this.MARKETPLACES).map(m => m.currency);
        const uniqueCurrencies = [...new Set(currencies)].join(',');
        const response = await browser.runtime.sendMessage({
          type: 'FETCH_EXCHANGE_RATES',
          url: `${this.EXCHANGE_API_BASE}?base=EUR&symbols=${uniqueCurrencies}`
        });

        if (!response || !response.rates) {
          throw new Error('Invalid response format');
        }

        this.exchangeRates = response.rates;
        this.lastUpdate = now;
        return;
      } catch (error) {
        console.error(`Failed to update exchange rates (attempt ${attempt}/${retryCount}):`, error);
        if (attempt === retryCount) {
          throw error;
        }
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
  }

  /**
   * Converts a price from one currency to EUR
   */
  private static convertToEUR(price: number, fromCurrency: string): number {
    if (fromCurrency === 'EUR') return price;
    
    const rate = this.exchangeRates[fromCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency}, using 1:1 conversion`);
      return price;
    }
    
    // Since our rates are now EUR based, we divide by the rate
    return price / rate;
  }

  /**
   * Fetches product data from a specific marketplace with retry logic
   */
  private static async fetchMarketplacePrice(
    marketplace: string,
    asin: string,
    attempt: number = 0
  ): Promise<MarketplacePrice | null> {
    try {
      const url = `https://${marketplace}/dp/${asin}`;
      const response = await browser.runtime.sendMessage({
        type: 'FETCH_URL',
        url
      });

      if (!response.success) {
        throw new Error(response.error);
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');

      // Price selectors in order of preference
      const priceSelectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#price_inside_buybox',
        '#newBuyBoxPrice',
        '#corePrice_feature_div .a-price-whole',
        '.price-info-supersize .a-price .a-offscreen',
        '#price .a-price .a-offscreen',
        '#apex_desktop_newAccordionRow .a-price .a-offscreen',
        '.a-price-whole'
      ];

      let priceElement = null;
      for (const selector of priceSelectors) {
        priceElement = doc.querySelector(selector);
        if (priceElement) break;
      }

      if (!priceElement) {
        return null;
      }

      const priceText = priceElement.textContent || '';
      const price = this.extractPrice(priceText);
      
      if (!price) {
        return null;
      }

      // Check availability with more patterns
      const availabilitySelectors = [
        '#availability',
        '#deliveryMessageMirId',
        '#mir-layout-DELIVERY_BLOCK',
        '#delivery-message',
        '#outOfStock',
        '.availabilityMessage',
        '#availability-string'
      ];

      let available = true;
      const unavailablePatterns = [
        'unavailable',
        'out of stock',
        'currently unavailable',
        'not available',
        'no longer available',
        'temporarily out of stock'
      ];

      for (const selector of availabilitySelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = element.textContent?.toLowerCase() || '';
          if (unavailablePatterns.some(pattern => text.includes(pattern))) {
            available = false;
            break;
          }
        }
      }

      // Enhanced shipping detection
      const shippingSelectors = [
        '#deliveryMessageMirId',
        '#mir-layout-DELIVERY_BLOCK',
        '#delivery-message',
        '#amazonGlobal_feature_div',
        '.delivery-message',
        '#shipping-message',
        '#delivery-promise-text',
        '#fast-track-message',
        '.shipping-message-container',
        '#price-shipping-message'
      ];

      let shipping: number | null = null;
      const freeShippingPatterns = ['free', 'gratuit', 'gratis', 'kostenlos'];

      for (const selector of shippingSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = element.textContent?.toLowerCase() || '';
          
          // Check for free shipping in multiple languages
          if (freeShippingPatterns.some(pattern => text.includes(pattern))) {
            shipping = 0;
            break;
          }
          
          // Look for shipping price with currency symbols
          const priceMatch = text.match(/[\d,.]+/);
          if (priceMatch) {
            shipping = this.extractPrice(priceMatch[0]);
            break;
          }
        }
      }

      const currency = MARKETPLACES[marketplace]?.currency;
      if (!currency) {
        console.error(`No currency found for marketplace: ${marketplace}`);
        return null;
      }

      const affiliateLink = ProductDetector.generateAffiliateLink(marketplace, asin);

      return {
        marketplace,
        price,
        shipping,
        currency,
        available,
        affiliateLink
      };
    } catch (error) {
      console.error(`Error fetching price from ${marketplace}:`, error);
      
      // Retry logic
      if (attempt < this.MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.fetchMarketplacePrice(marketplace, asin, attempt + 1);
      }
      
      return null;
    }
  }

  private static extractPrice(priceString: string): number {
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
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Compares prices across all marketplaces
   */
  public static async comparePrice(asin: string): Promise<MarketplacePrice[]> {
    await this.updateExchangeRates();

    const pricePromises = Object.keys(this.MARKETPLACES).map(marketplace =>
      this.fetchMarketplacePrice(marketplace, asin)
    );

    const results = await Promise.allSettled(pricePromises);
    
    // Get the current marketplace price first and convert it to EUR
    const currentMarketplace = window.location.hostname.replace('www.', '');
    const currentMarketplaceResult = results.find(
      (result): result is PromiseFulfilledResult<MarketplacePrice> => 
        result.status === 'fulfilled' && 
        result.value !== null && 
        result.value.marketplace === currentMarketplace
    );

    if (!currentMarketplaceResult) {
      console.error('Could not find current marketplace price');
      return [];
    }

    const currentItem = currentMarketplaceResult.value;
    const currentPriceEUR = this.convertToEUR(currentItem.price, currentItem.currency);
    
    // Filter out failed requests and null results, convert prices to EUR
    return results
      .filter((result): result is PromiseFulfilledResult<MarketplacePrice> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => {
        const item = result.value;
        const priceEUR = this.convertToEUR(item.price, item.currency);
        const shippingEUR = item.shipping !== null ? 
          this.convertToEUR(item.shipping, item.currency) : 
          null;

        return {
          ...item,
          price: priceEUR,
          shipping: shippingEUR
        };
      })
      .sort((a, b) => {
        const totalA = a.price + (a.shipping || 0);
        const totalB = b.price + (b.shipping || 0);
        return totalA - totalB;
      });
  }
}
