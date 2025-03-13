import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductDetector } from '../services/productDetector';
import { PriceService } from '../services/priceService';
import PriceComparison from '../components/PriceComparison';
import '../styles/priceComparison.css';

let comparisonRoot: ReturnType<typeof createRoot> | null = null;
let currentPrices: any[] = [];

const injectPriceComparison = async () => {
  const currentUrl = window.location.href;
  console.log('[DEBUG] Checking URL:', currentUrl);
  
  // Check if we're on a product page
  const isProduct = ProductDetector.isProductPage(currentUrl);
  console.log('[DEBUG] Is product page:', isProduct);
  
  if (!isProduct) {
    return;
  }

  // Get ASIN
  const asin = ProductDetector.extractASIN(currentUrl);
  console.log('[DEBUG] Extracted ASIN:', asin);
  
  if (!asin) {
    return;
  }

  // Get current product info
  const productInfo = ProductDetector.extractProductInfo();
  console.log('[DEBUG] Product info:', productInfo);
  
  if (!productInfo.price) {
    console.log('[DEBUG] No price found in product info');
    return;
  }

  // Create container for our widget
  let container = document.getElementById('quick-saver-price-comparison');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'quick-saver-price-comparison';
    
    // Find the best spot to inject our widget
    const priceBlock = document.querySelector('#corePriceDisplay_desktop_feature_div') || 
                      document.querySelector('#corePrice_desktop_feature_div') ||
                      document.querySelector('#corePrice_feature_div') ||
                      document.querySelector('#price') ||
                      document.querySelector('.a-price-whole')?.closest('.a-section');
                      
    if (!priceBlock) {
      console.warn('Could not find price block to inject widget');
      return;
    }

    // Insert after the price block
    priceBlock.parentNode?.insertBefore(container, priceBlock.nextSibling);

    // Create root once
    comparisonRoot = createRoot(container);
  }

  // Get prices from other marketplaces
  currentPrices = await PriceService.comparePrice(asin);

  // Render our component
  if (comparisonRoot) {
    comparisonRoot.render(
      <PriceComparison 
        prices={currentPrices}
      />
    );
  }
};

// Initial injection
injectPriceComparison();

// Listen for page changes (for single page apps)
const observer = new MutationObserver(() => {
  if (!document.getElementById('quick-saver-price-comparison')) {
    injectPriceComparison();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    console.log('[DEBUG] Received message:', message);

    if (message.type === 'TOGGLE_PRICE_COMPARISON') {
      // Re-render the component to reflect the new setting
      const container = document.getElementById('quick-saver-price-comparison');
      if (container && comparisonRoot && currentPrices.length > 0) {
        comparisonRoot.render(
          <PriceComparison 
            prices={currentPrices}
          />
        );
      }
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'UPDATE_SELECTED_MARKETPLACES') {
      // Re-render the component with the updated marketplace selection
      if (comparisonRoot && currentPrices.length > 0) {
        comparisonRoot.render(
          <PriceComparison 
            prices={currentPrices}
          />
        );
      }
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'UPDATE_CURRENCY') {
      // Re-render the component with the updated currency
      if (comparisonRoot && currentPrices.length > 0) {
        comparisonRoot.render(
          <PriceComparison 
            prices={currentPrices}
          />
        );
      }
      sendResponse({ success: true });
      return true;
    }

    sendResponse({ success: false, error: 'Unknown message type' });
    return true;
  } catch (error) {
    console.error('[DEBUG] Error handling message:', error);
    sendResponse({ success: false, error: String(error) });
    return true;
  }
});
