import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProductDetector } from '../services/productDetector';
import { PriceService } from '../services/priceService';
import PriceComparison from '../components/PriceComparison';
import '../styles/priceComparison.css';

const injectPriceComparison = async () => {
  // Check if we're on a product page
  if (!ProductDetector.isProductPage(window.location.href)) {
    return;
  }

  // Get ASIN
  const asin = ProductDetector.extractASIN(window.location.href);
  if (!asin) {
    return;
  }

  // Get current product info
  const productInfo = ProductDetector.extractProductInfo();
  if (!productInfo.price) {
    return;
  }

  // Create container for our widget
  const container = document.createElement('div');
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

  // Get prices from other marketplaces
  const prices = await PriceService.comparePrice(asin);

  // Render our component
  const root = createRoot(container);
  root.render(
    <PriceComparison 
      prices={prices}
    />
  );
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
