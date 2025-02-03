import { AmazonProduct, MessageType } from '../types';
import { PriceComparisonService } from '../services/priceComparison';
import { MARKETPLACES } from '../config/marketplaces';

// Initialize services
const priceComparisonService = new PriceComparisonService();
const priceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1800000; // 30 minutes

// Preload exchange rates
async function preloadExchangeRates() {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    await chrome.storage.local.set({ exchangeRates: { rates: data.rates, timestamp: Date.now() } });
  } catch (error) {
    console.error('Failed to preload exchange rates:', error);
  }
}

// Preload prices for a product across all marketplaces
async function preloadPrices(product: AmazonProduct) {
  const marketplaces = Object.keys(MARKETPLACES).filter(m => m !== product.marketplace);
  
  // Start all requests in parallel
  const promises = marketplaces.map(async marketplace => {
    try {
      const cacheKey = `${product.asin}-${marketplace}`;
      const cached = priceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }

      const result = await priceComparisonService.fetchFromMarketplace(product.asin, marketplace);
      
      if (result) {
        priceCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
      
      return result;
    } catch (error) {
      console.error(`Error preloading price for ${marketplace}:`, error);
      return null;
    }
  });

  // Wait for all requests to complete
  await Promise.all(promises);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: { type: MessageType; payload: any }, _sender, sendResponse) => {
  console.log('Background script received message:', message);

  (async () => {
    try {
      switch (message.type) {
        case 'COMPARE_PRICES': {
          console.log('Processing price comparison for:', message.payload);
          const product = message.payload as AmazonProduct;
          
          if (!product || !product.asin || !product.marketplace) {
            throw new Error('Invalid product data received');
          }

          // First, quickly return cached results if available
          const cachedComparison = await getCachedComparison(product);
          if (cachedComparison) {
            sendResponse(cachedComparison);
            // After sending cached results, preload fresh prices
            preloadPrices(product);
            return;
          }

          // If no cache, get fresh comparison
          const comparison = await priceComparisonService.comparePrice(product);
          console.log('Comparison result:', comparison);
          
          if (!comparison || !comparison.alternatives) {
            throw new Error('Invalid comparison result');
          }

          // Cache the comparison result
          await chrome.storage.local.set({
            [`comparison-${product.asin}`]: {
              data: comparison,
              timestamp: Date.now()
            }
          });

          sendResponse(comparison);
          break;
        }

        case 'UPDATE_SETTINGS': {
          console.log('Updating settings:', message.payload);
          await chrome.storage.local.set({ settings: message.payload });
          sendResponse({ success: true });
          break;
        }

        case 'GET_EXCHANGE_RATES': {
          const { exchangeRates } = await chrome.storage.local.get('exchangeRates');
          if (!exchangeRates || Date.now() - exchangeRates.timestamp > 3600000) {
            // Refresh rates if older than 1 hour
            await preloadExchangeRates();
          }
          sendResponse({ success: true, rates: exchangeRates?.rates || {} });
          break;
        }

        default: {
          console.warn('Unknown message type:', message.type);
          sendResponse({ error: 'Unknown message type' });
        }
      }
    } catch (error) {
      console.error('Error in background script:', error);
      sendResponse({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false 
      });
    }
  })();

  return true;
});

// Helper function to get cached comparison
async function getCachedComparison(product: AmazonProduct) {
  const { [`comparison-${product.asin}`]: cached } = await chrome.storage.local.get(`comparison-${product.asin}`);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached comparison');
    return cached.data;
  }
  
  return null;
}

// Set up alarm for periodic price checks and cache cleanup
chrome.alarms.create('checkPrices', { periodInMinutes: 30 });
chrome.alarms.create('cleanupCache', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkPrices') {
    try {
      const { savedProducts } = await chrome.storage.local.get('savedProducts');
      if (!savedProducts) return;

      for (const product of savedProducts) {
        if (!product || !product.marketplace || !product.asin) {
          console.error('Invalid saved product:', product);
          continue;
        }

        const comparison = await priceComparisonService.comparePrice(product);
        
        if (comparison.priceDifference > 0) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon128.png',
            title: 'Price Drop Alert!',
            message: `The price for ${product.title} has dropped by ${comparison.priceDifference.toFixed(2)} ${product.currency}`
          });
        }
      }
    } catch (error) {
      console.error('Error checking prices:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else if (alarm.name === 'cleanupCache') {
    // Cleanup old cache entries
    for (const [key, value] of priceCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_DURATION) {
        priceCache.delete(key);
      }
    }
  }
});

// Handle extension icon click to toggle side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    // Set the initial state of the side panel if not already set
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

// Initialize side panel behavior when extension loads
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
