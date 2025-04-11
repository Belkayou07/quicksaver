import { ProductDetector } from './productDetector';
import { MarketplacePrice } from '../types/marketplace';
import { browser } from 'webextension-polyfill-ts';
import { MARKETPLACES } from '../config/marketplaces';
import { Logger } from '../utils/logger';

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
        
        // Use a CORS proxy or handle the error gracefully
        const response = await browser.runtime.sendMessage({
          type: 'FETCH_EXCHANGE_RATES',
          url: `https://api.exchangerate.host/latest?base=EUR&symbols=${uniqueCurrencies}`
        });

        if (!response || !response.rates) {
          Logger.api.warn('Invalid exchange rate response format');
          return;
        }

        this.exchangeRates = response.rates;
        this.lastUpdate = now;
        Logger.api.info('Exchange rates updated successfully');
        return;
      } catch (error) {
        Logger.api.error('Failed to update exchange rates', { error, attempt });
        if (attempt === retryCount) {
          // Use fallback rates if all attempts fail
          this.exchangeRates = {
            EUR: 1,
            GBP: 0.85,
            PLN: 4.5,
            SEK: 11.5
          };
          Logger.api.warn('Using fallback exchange rates');
          return;
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
      console.log(`[DEBUG] Fetching ${url}`);
      
      const response = await browser.runtime.sendMessage({
        type: 'FETCH_URL',
        url
      });

      if (!response.success) {
        if (response.status === 404) {
          Logger.price.debug(`Product not available in ${marketplace}`, { asin });
          return null;
        }
        Logger.price.error(`Failed to fetch ${marketplace}`, { error: response.error, asin });
        throw new Error(response.error);
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(response.data, 'text/html');

      // Check if we're on a "New & Used" page and redirect to the main product page
      const isUsedPage = doc.querySelector('#olpLinkWidget, #olp-upd-new, #olp-upd-new-used');
      if (isUsedPage) {
        console.log(`[DEBUG] ${marketplace}: On a used/new offers page, need to get main product page`);
        // Try to find link to main product page
        const mainPageLink = doc.querySelector('a[href*="/dp/"]');
        if (mainPageLink && mainPageLink.getAttribute('href')) {
          const newUrl = new URL(mainPageLink.getAttribute('href') || '', `https://${marketplace}`).href;
          console.log(`[DEBUG] ${marketplace}: Redirecting to main product page: ${newUrl}`);
          
          const newResponse = await browser.runtime.sendMessage({
            type: 'FETCH_URL',
            url: newUrl
          });
          
          if (!newResponse.success) {
            throw new Error(newResponse.error);
          }
          
          doc.documentElement.innerHTML = newResponse.data;
        }
      }

      // Check for "Buy New" section to ensure we're looking at new products
      const buyNewSection = doc.querySelector('#newAccordionRow, #newOfferAccordionRow, #buyNew, #buybox');
      if (buyNewSection) {
        console.log(`[DEBUG] ${marketplace}: Found Buy New section`);
      }

      // Price selectors in order of preference, prioritizing deal prices
      const priceSelectors = [
        // New product selectors first
        '#newBuyBoxPrice',
        '#price_inside_buybox',
        '#corePrice_desktop .a-price .a-offscreen',
        '#corePrice_feature_div .a-price .a-offscreen',
        '#corePriceDisplay_desktop_feature_div .a-price .a-offscreen',
        // Deal and discount prices
        '#priceblock_dealprice',
        '#priceblock_saleprice',
        '.apexPriceToPay .a-offscreen',
        '.priceToPay .a-offscreen',
        '.a-price[data-a-color="price"] .a-offscreen',
        '#corePrice_feature_div .savingsPercentage + .a-price .a-offscreen', // Price after savings percentage
        '.a-price[data-a-strike="false"] .a-offscreen', // Non-strikethrough price
        // Regular prices
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#corePrice_feature_div .a-price-whole',
        '.price-info-supersize .a-price .a-offscreen',
        '#price .a-price .a-offscreen',
        '#apex_desktop_newAccordionRow .a-price .a-offscreen',
        '.a-price-whole'
      ];

      let priceElement = null;
      let matchedSelector = '';
      let priceText = '';

      // First check if there's a "New" price specifically
      const newPriceContainers = [
        '#newBuyBox',
        '#newAccordionRow',
        '#buyNew',
        '#buybox',
        '#corePrice_desktop',
        '#corePrice_feature_div',
        '#corePriceDisplay_desktop_feature_div'
      ];

      // Look for new product prices first
      for (const container of newPriceContainers) {
        const element = doc.querySelector(container);
        if (element) {
          console.log(`[DEBUG] ${marketplace}: Checking new price container ${container}`);
          
          // Check for "Used" or "Renewed" text to avoid these sections
          const elementText = element.textContent?.toLowerCase() || '';
          if (elementText.includes('used') || 
              elementText.includes('renewed') || 
              elementText.includes('refurbished') ||
              elementText.includes('gebruikt') ||  // Dutch
              elementText.includes('occasion') ||  // French
              elementText.includes('gebraucht') || // German
              elementText.includes('usato') ||     // Italian
              elementText.includes('usado')) {     // Spanish/Portuguese
            console.log(`[DEBUG] ${marketplace}: Skipping container with used/renewed products`);
            continue;
          }
          
          // Try to find the price element within this container
          for (const selector of priceSelectors) {
            const priceEl = element.querySelector(selector);
            if (priceEl) {
              const text = priceEl.textContent?.trim();
              if (text) {
                priceElement = priceEl;
                matchedSelector = `${container} > ${selector}`;
                priceText = text;
                console.log(`[DEBUG] ${marketplace}: Found new product price: ${text}`);
                break;
              }
            }
          }
          
          if (priceText) break;
        }
      }

      // If no new price found, try the deal price containers
      if (!priceText) {
        const dealPriceContainers = [
          '#corePriceDisplay_desktop_feature_div',
          '#corePrice_feature_div',
          '#price',
          '#desktop_buybox',
          '#centerCol'
        ];

        // Look for discount patterns
        for (const container of dealPriceContainers) {
          const element = doc.querySelector(container);
          if (element) {
            console.log(`[DEBUG] ${marketplace}: Checking container ${container}`);
            const elementText = element.textContent || '';
            
            // Skip if this appears to be a used/renewed section
            if (elementText.toLowerCase().includes('used') || 
                elementText.toLowerCase().includes('renewed') ||
                elementText.toLowerCase().includes('refurbished') ||
                elementText.toLowerCase().includes('gebruikt') ||
                elementText.toLowerCase().includes('occasion') ||
                elementText.toLowerCase().includes('gebraucht') ||
                elementText.toLowerCase().includes('usato') ||
                elementText.toLowerCase().includes('usado')) {
              console.log(`[DEBUG] ${marketplace}: Skipping used/renewed section`);
              continue;
            }
            
            console.log(`[DEBUG] ${marketplace}: Container text: ${elementText.substring(0, 200)}...`);
            
            // First try to find the new price element directly
            const newPriceElement = element.querySelector('.priceToPay .a-offscreen, .apexPriceToPay .a-offscreen');
            if (newPriceElement) {
              const text = newPriceElement.textContent?.trim();
              if (text) {
                priceElement = newPriceElement;
                matchedSelector = 'direct-new-price';
                priceText = text;
                console.log(`[DEBUG] ${marketplace}: Found direct new price: ${text}`);
                break;
              }
            }

            // Check for percentage discount
            const discountMatch = elementText.match(/[-−]?\s*(\d+)\s*%/);
            if (discountMatch) {
              console.log(`[DEBUG] ${marketplace}: Found discount percentage: ${discountMatch[1]}%`);
              
              // Look for prices near the discount
              const priceElements = element.querySelectorAll('.a-price .a-offscreen');
              console.log(`[DEBUG] ${marketplace}: Found ${priceElements.length} price elements`);
              
              let prices: { element: Element; text: string; }[] = [];
              priceElements.forEach(el => {
                const text = el.textContent?.trim();
                if (text) {
                  prices.push({ element: el, text });
                  console.log(`[DEBUG] ${marketplace}: Price candidate: ${text}`);
                }
              });

              // Sort prices numerically
              prices.sort((a, b) => {
                const aNum = parseFloat(a.text.replace(/[^0-9.,]/g, '').replace(',', '.'));
                const bNum = parseFloat(b.text.replace(/[^0-9.,]/g, '').replace(',', '.'));
                return aNum - bNum;
              });

              // The lowest price is likely the discounted price
              if (prices.length > 0) {
                const lowestPrice = prices[0];
                const isStrikethrough = lowestPrice.element.closest('.a-text-strike, .a-text-price-strike, [data-a-strike="true"]');
                if (!isStrikethrough) {
                  priceElement = lowestPrice.element;
                  matchedSelector = 'lowest-price-near-discount';
                  priceText = lowestPrice.text;
                  console.log(`[DEBUG] ${marketplace}: Selected lowest price: ${priceText}`);
                  break;
                }
              }
            }
          }
        }
      }

      // If still no price found, try regular selectors
      if (!priceText) {
        console.log(`[DEBUG] ${marketplace}: No discount price found, trying regular selectors`);
        for (const selector of priceSelectors) {
          const elements = doc.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent?.trim() || '';
            if (text && text !== ' ') {
              // Skip if it's marked as "was" price or crossed out
              const isStrikethrough = element.closest('.a-text-strike, .a-text-price-strike, [data-a-strike="true"]');
              if (!isStrikethrough) {
                // Check if this price is in a used/renewed section
                const parentText = element.closest('#usedAccordionRow, #renewedAccordionRow, #usedBuyBox, #renewedBuyBox')?.textContent?.toLowerCase() || '';
                if (parentText.includes('used') || 
                    parentText.includes('renewed') || 
                    parentText.includes('refurbished') ||
                    parentText.includes('gebruikt') ||
                    parentText.includes('occasion') ||
                    parentText.includes('gebraucht') ||
                    parentText.includes('usato') ||
                    parentText.includes('usado')) {
                  console.log(`[DEBUG] ${marketplace}: Skipping price in used/renewed section: ${text}`);
                  continue;
                }
                
                priceElement = element;
                matchedSelector = selector;
                priceText = text;
                break;
              }
            }
          }
          if (priceText) break;
        }
      }

      if (!priceText) {
        console.log(`[DEBUG] ${marketplace}: No valid price found. Tried selectors:`, priceSelectors);
        return null;
      }

      console.log(`[DEBUG] ${marketplace}: Found price using selector: ${matchedSelector}`);
      console.log(`[DEBUG] ${marketplace}: Raw price text: "${priceText}"`);

      const price = this.extractPrice(priceText);
      
      if (!price) {
        console.log(`[DEBUG] ${marketplace}: Could not extract price from text: "${priceText}"`);
        return null;
      }

      console.log(`[DEBUG] ${marketplace}: Extracted price: ${price}`);

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
        'temporarily out of stock',
        'cannot be shipped',
        'nicht verfügbar',  // German
        'non disponible',   // French
        'no disponible',    // Spanish
        'niet beschikbaar', // Dutch
        'niedostępny',      // Polish
        'nie jest dostępny' // Polish
      ];

      let availabilityText = '';
      for (const selector of availabilitySelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          availabilityText = element.textContent?.toLowerCase() || '';
          if (unavailablePatterns.some(pattern => availabilityText.includes(pattern))) {
            available = false;
            console.log(`[DEBUG] ${marketplace}: Product unavailable. Text: "${availabilityText}"`);
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
      const freeShippingPatterns = ['free', 'gratuit', 'gratis', 'kostenlos', 'gratuita', 'bezpłatna'];

      let shippingText = '';
      for (const selector of shippingSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          shippingText = element.textContent?.toLowerCase() || '';
          
          // Check for free shipping in multiple languages
          if (freeShippingPatterns.some(pattern => shippingText.includes(pattern))) {
            shipping = 0;
            console.log(`[DEBUG] ${marketplace}: Free shipping detected`);
            break;
          }
          
          // Look for shipping price with currency symbols
          const priceMatch = shippingText.match(/[\d,.]+/);
          if (priceMatch) {
            shipping = this.extractPrice(priceMatch[0]);
            console.log(`[DEBUG] ${marketplace}: Shipping cost detected: ${shipping}`);
            break;
          }
        }
      }

      if (shipping === null) {
        console.log(`[DEBUG] ${marketplace}: No shipping info found. Tried selectors:`, shippingSelectors);
      }

      const currency = MARKETPLACES[marketplace]?.currency;
      if (!currency) {
        console.error(`[DEBUG] No currency found for marketplace: ${marketplace}`);
        return null;
      }

      const affiliateLink = ProductDetector.generateAffiliateLink(marketplace, asin);

      const result = {
        marketplace,
        price,
        shipping,
        currency,
        available,
        affiliateLink,
        originalPrice: price,
        originalShipping: shipping,
        originalCurrency: currency
      };

      console.log(`[DEBUG] ${marketplace} final result:`, result);
      return result;

    } catch (error) {
      console.error(`[DEBUG] Error processing ${marketplace}:`, {
        error,
        marketplace,
        asin,
        attempt
      });
      
      // Retry logic
      if (attempt < this.MAX_RETRIES - 1) {
        console.log(`[DEBUG] Retrying ${marketplace}, attempt ${attempt + 1}/${this.MAX_RETRIES}`);
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

    console.log(`[DEBUG] Starting price comparison for ASIN: ${asin}`);
    console.log(`[DEBUG] Checking marketplaces:`, Object.keys(this.MARKETPLACES));

    const pricePromises = Object.keys(this.MARKETPLACES).map(marketplace =>
      this.fetchMarketplacePrice(marketplace, asin)
        .then(result => {
          if (!result) {
            console.log(`[DEBUG] ${marketplace} returned null for ASIN ${asin}`);
          }
          return result;
        })
        .catch(error => {
          console.error(`[DEBUG] Error fetching ${marketplace} for ASIN ${asin}:`, error);
          return null;
        })
    );

    const results = await Promise.allSettled(pricePromises);
    
    // Log results for each marketplace
    results.forEach((result, index) => {
      const marketplace = Object.keys(this.MARKETPLACES)[index];
      if (result.status === 'rejected') {
        console.error(`[DEBUG] ${marketplace} request rejected:`, result.reason);
      } else if (!result.value) {
        console.log(`[DEBUG] ${marketplace} returned no data`);
      } else {
        console.log(`[DEBUG] ${marketplace} successful:`, result.value);
      }
    });
    
    // Get the current marketplace price first
    const currentMarketplace = window.location.hostname.replace('www.', '');
    console.log(`[DEBUG] Current marketplace: ${currentMarketplace}`);
    
    const currentMarketplaceResult = results.find(
      (result): result is PromiseFulfilledResult<MarketplacePrice> => 
        result.status === 'fulfilled' && 
        result.value !== null && 
        result.value.marketplace === currentMarketplace
    );

    if (!currentMarketplaceResult) {
      console.error('[DEBUG] Could not find current marketplace price');
      return [];
    }

    const currentItem = currentMarketplaceResult.value;
    console.log(`[DEBUG] Current marketplace price: ${currentItem.price} ${currentItem.currency}`);
    
    // Filter out failed requests and null results, keep original prices
    const filteredResults = results
      .filter((result): result is PromiseFulfilledResult<MarketplacePrice> => {
        const isValid = result.status === 'fulfilled' && result.value !== null;
        if (!isValid) {
          console.log(`[DEBUG] Filtering out result:`, result);
        }
        return isValid;
      })
      .map(result => {
        const item = result.value;
        console.log(`[DEBUG] Original prices for ${item.marketplace}:`, {
          price: item.price,
          currency: item.currency,
          shipping: item.shipping
        });

        return {
          ...item,
          originalPrice: item.price,
          originalCurrency: item.currency,
          originalShipping: item.shipping
        };
      })
      .sort((a, b) => {
        // Sort based on original prices in their respective currencies
        const totalA = a.originalPrice + (a.originalShipping || 0);
        const totalB = b.originalPrice + (b.originalShipping || 0);
        return totalA - totalB;
      });

    console.log(`[DEBUG] Final filtered results:`, filteredResults);
    return filteredResults;
  }
}
