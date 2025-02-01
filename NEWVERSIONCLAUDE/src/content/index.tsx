import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductExtractor } from '../services/productExtractor';
import { PriceWidget } from './components/PriceWidget';

// Start extracting ASIN and marketplace immediately
const initialInfo = ProductExtractor.extractInitialInfo();
if (initialInfo) {
  // Pre-fetch prices as soon as we have ASIN
  chrome.runtime.sendMessage({
    type: 'COMPARE_PRICES',
    payload: {
      ...initialInfo,
      currentPrice: 0, // We'll update this once we have it
      title: '' // We'll update this once we have it
    }
  });
}

// Initialize widget as soon as possible
const initializeWidget = () => {
  const product = ProductExtractor.extractProductInfo();
  console.log('Extracted product info:', product);
  
  if (!product || !product.marketplace || !product.asin) {
    console.error('Could not extract valid product info');
    return;
  }

  // Create container for our widget if it doesn't exist
  let container = document.getElementById('quick-saver-widget');
  if (!container) {
    container = document.createElement('div');
    container.id = 'quick-saver-widget';
  }
  
  // Find the price block on Amazon's page using multiple strategies
  const priceBlock = findPriceBlock();

  if (priceBlock?.parentElement && !document.getElementById('quick-saver-widget')) {
    priceBlock.parentElement.insertBefore(container, priceBlock.nextSibling);
    
    // Initialize React
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <PriceWidget product={product} />
      </React.StrictMode>
    );

    console.log('Widget initialized successfully');
  } else {
    // If we can't find the price block yet, keep trying
    if (document.readyState !== 'complete') {
      setTimeout(initializeWidget, 100);
    } else {
      console.error('Could not find price block to attach widget');
    }
  }
};

// Helper function to find price block using multiple strategies
function findPriceBlock(): Element | null {
  const selectors = [
    '#corePriceDisplay_desktop_feature_div',
    '#corePrice_desktop',
    '#price',
    '.a-price',
    '.a-color-price',
    '#priceblock_ourprice',
    '#priceblock_dealprice'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  return null;
}

// Start initialization process
if (document.readyState === 'loading') {
  // Start looking for price block early
  const quickCheck = () => {
    if (findPriceBlock()) {
      initializeWidget();
    }
  };
  
  // Check a few times before page load
  const interval = setInterval(quickCheck, 50);
  
  document.addEventListener('DOMContentLoaded', () => {
    clearInterval(interval);
    initializeWidget();
  });
} else {
  initializeWidget();
}

// Debounce function to prevent multiple rapid initializations
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Debounced re-initialization for URL changes
const debouncedInit = debounce(() => {
  console.log('URL changed, reinitializing...');
  const oldWidget = document.getElementById('quick-saver-widget');
  if (oldWidget) {
    oldWidget.remove();
  }
  
  // Start new price comparison immediately
  const initialInfo = ProductExtractor.extractInitialInfo();
  if (initialInfo) {
    chrome.runtime.sendMessage({
      type: 'COMPARE_PRICES',
      payload: {
        ...initialInfo,
        currentPrice: 0,
        title: ''
      }
    });
  }
  
  initializeWidget();
}, 300);

// Observe URL changes
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    debouncedInit();
  }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((_message, _sender, sendResponse) => {
  sendResponse({ received: true });
});
