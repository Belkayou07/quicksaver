// Fonction utilitaire pour logger les erreurs
function logError(message, error) {
  console.error(`[Amazon Product Info] ${message}:`, error);
  return null;
}

// Fonction pour extraire le texte en toute sécurité
function safeTextExtract(element) {
  try {
    return element ? element.textContent.trim() : '';
  } catch (error) {
    return '';
  }
}

function extractProductInfo() {
  console.log('[Amazon Product Info] Starting extraction...');
  
  const productInfo = {
    name: '',
    price: '',
    image: '',
    modelNumber: '',
    asin: '',
    rating: '',
    reviewCount: '',
    reviewUrl: '',
    error: null
  };

  try {
    // Extract rating and review count
    const ratingSelectors = [
      '#acrPopover', 
      '#averageCustomerReviews',
      '.a-star-4-5',
      '.a-star-5'
    ];

    for (const selector of ratingSelectors) {
      const ratingElement = document.querySelector(selector);
      if (ratingElement) {
        const ratingText = ratingElement.getAttribute('title') || safeTextExtract(ratingElement);
        if (ratingText) {
          const ratingMatch = ratingText.match(/([0-9,\.]+)/);
          if (ratingMatch) {
            productInfo.rating = ratingMatch[1];
            // Construire l'URL pour scroller vers les avis sur la même page
            const reviewsSection = document.querySelector('#reviews-medley-footer, #reviewsMedley, #customer-reviews-content');
            if (reviewsSection) {
              productInfo.reviewUrl = `#${reviewsSection.id}`;
            } else {
              productInfo.reviewUrl = '#customerReviews';
            }
            break;
          }
        }
      }
    }

    // Extract review count
    const reviewCountSelectors = [
      '#acrCustomerReviewText',
      '#reviewsMedley .a-size-base',
      '.totalRatingCount'
    ];

    for (const selector of reviewCountSelectors) {
      const reviewCountElement = document.querySelector(selector);
      if (reviewCountElement) {
        const reviewText = safeTextExtract(reviewCountElement);
        const reviewMatch = reviewText.match(/([0-9,\.]+)/);
        if (reviewMatch) {
          productInfo.reviewCount = reviewMatch[1];
          break;
        }
      }
    }

    // Extract product name with multiple selectors
    const nameSelectors = ['#productTitle', '#title', '.product-title'];
    for (const selector of nameSelectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement) {
        productInfo.name = safeTextExtract(nameElement);
        break;
      }
    }

    // Extract price with multiple selectors and better handling
    const priceSelectors = [
      'span[data-a-color="price"] span.a-offscreen',
      '.priceToPay span.a-offscreen',
      '#corePrice_feature_div .a-price .a-offscreen',
      '.a-price .a-offscreen',
      '#price_inside_buybox',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price-whole',
      '#price',
      '.price3P',
      '.apexPriceToPay',
      '#sns-base-price'
    ];

    for (const selector of priceSelectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement) {
        const foundPrice = safeTextExtract(priceElement);
        if (foundPrice && (foundPrice.includes('€') || foundPrice.includes('$') || foundPrice.includes('£'))) {
          productInfo.price = foundPrice.replace(/\s+/g, ' ').trim();
          console.log('[Amazon Product Info] Price found:', productInfo.price);
          break;
        }
      }
    }

    // Extract model number with improved selectors
    const modelSelectors = [
      '#productDetails_techSpec_section_1 tr',
      '#detailBullets_feature_div li',
      '#prodDetails tr',
      '#detailBulletsWrapper_feature_div li',
      '.detail-bullet-list span',
      '.a-section.a-spacing-small .a-row',
      '#technicalSpecifications_section_1 tr',
      '#technical-details tr',
      '#product-details-grid tr'
    ];

    let modelFound = false;
    for (const selector of modelSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = safeTextExtract(element).toLowerCase();
        if (text.includes('modèle') || text.includes('référence') || 
            text.includes('numéro du modèle') || text.includes('numéro de modèle') || 
            text.includes('model number') || text.includes('model no') || 
            text.includes('modelnummer')) {
          const modelMatch = text.match(/[^:]+[:|\s]+(.+)$/);
          if (modelMatch) {
            productInfo.modelNumber = modelMatch[1].trim();
            console.log('[Amazon Product Info] Model number found:', productInfo.modelNumber);
            modelFound = true;
            break;
          }
        }
      }
      if (modelFound) break;
    }

    // Si on n'a pas trouvé le numéro de modèle, essayer d'autres méthodes
    if (!productInfo.modelNumber) {
      // Chercher dans les attributs data
      const dataModelElement = document.querySelector('[data-model-number], [data-model], [data-product-model]');
      if (dataModelElement) {
        productInfo.modelNumber = dataModelElement.getAttribute('data-model-number') || 
                                dataModelElement.getAttribute('data-model') ||
                                dataModelElement.getAttribute('data-product-model');
      }
      
      // Chercher dans les métadonnées
      const metaSelectors = [
        'meta[property="product:model"]',
        'meta[name="model"]',
        'meta[name="product:model"]'
      ];
      
      for (const selector of metaSelectors) {
        const metaModel = document.querySelector(selector);
        if (metaModel) {
          productInfo.modelNumber = metaModel.getAttribute('content');
          break;
        }
      }
      
      // Chercher dans les scripts JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const jsonData = JSON.parse(script.textContent);
          if (jsonData.model || jsonData.modelNumber || (jsonData.product && jsonData.product.model)) {
            productInfo.modelNumber = jsonData.model || jsonData.modelNumber || jsonData.product.model;
            break;
          }
        } catch (e) {
          console.log('[Amazon Product Info] Error parsing JSON-LD:', e);
        }
      }
    }

    // Extract ASIN with improved methods
    productInfo.asin = extractASIN() || '';
    console.log('[Amazon Product Info] ASIN found:', productInfo.asin);

    // Extract image with improved selectors
    const imageSelectors = [
      '#imgBlkFront',
      '#landingImage',
      '#main-image',
      '#prodImage',
      '.a-dynamic-image',
      'img[data-old-hires]',
      'img[data-a-dynamic-image]'
    ];

    for (const selector of imageSelectors) {
      const imageElement = document.querySelector(selector);
      if (imageElement) {
        const imgSrc = imageElement.getAttribute('data-old-hires') || 
                      imageElement.getAttribute('src') || 
                      imageElement.getAttribute('data-a-dynamic-image');
        if (imgSrc) {
          try {
            // Si l'image est en JSON, extraire la première URL
            if (imgSrc.startsWith('{')) {
              const imageData = JSON.parse(imgSrc);
              const firstImageUrl = Object.keys(imageData)[0];
              productInfo.image = firstImageUrl;
            } else {
              productInfo.image = imgSrc;
            }
            break;
          } catch (e) {
            console.log('[Amazon Product Info] Error parsing image URL:', e);
            productInfo.image = imgSrc;
            break;
          }
        }
      }
    }

    console.log('[Amazon Product Info] Extraction completed successfully:', productInfo);

  } catch (error) {
    productInfo.error = 'Erreur lors de l\'extraction des informations';
    logError('Extraction failed', error);
  }

  return productInfo;
}

function extractASIN() {
  try {
    // Méthode 1: Depuis l'URL
    const urlMatch = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    if (urlMatch) return urlMatch[1];

    // Méthode 2: Depuis les données de la page
    const dataElements = document.querySelectorAll('[data-asin]');
    for (const element of dataElements) {
      const asin = element.getAttribute('data-asin');
      if (asin && asin.match(/^[A-Z0-9]{10}$/)) return asin;
    }

    // Méthode 3: Depuis le corps de la page
    const bodyText = document.body.innerHTML;
    const asinPatterns = [
      /"ASIN"\s*:\s*"([A-Z0-9]{10})"/,
      /"asin"\s*:\s*"([A-Z0-9]{10})"/,
      /asin=([A-Z0-9]{10})/
    ];

    for (const pattern of asinPatterns) {
      const match = bodyText.match(pattern);
      if (match) return match[1];
    }

  } catch (error) {
    logError('ASIN extraction failed', error);
  }

  return '';
}

// Create and insert price comparison container
function createPriceComparisonContainer() {
  const priceElement = document.querySelector('#corePriceDisplay_desktop_feature_div, #price_inside_buybox');
  if (!priceElement) return null;

  let container = document.getElementById('quick-saver-prices');
  if (!container) {
    container = document.createElement('div');
    container.id = 'quick-saver-prices';
    container.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f8f9fa;
      display: none;
    `;
    priceElement.parentNode.insertBefore(container, priceElement.nextSibling);
  }
  return container;
}

// Show loading state in the price container
function showPriceLoading() {
  const container = createPriceComparisonContainer();
  if (!container) return;
  
  container.style.display = 'block';
  container.innerHTML = `
    <div style="text-align: center; padding: 10px;">
      <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; 
                  border-top: 2px solid #232F3E; border-radius: 50%; 
                  animation: quicksaver-spin 1s linear infinite;"></div>
      <style>
        @keyframes quicksaver-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div style="margin-top: 5px; color: #666;">Comparing prices...</div>
    </div>
  `;
}

function createLoadingSpinner(marketplaceName) {
  return `
    <div class="marketplace-loading" style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      margin-bottom: 4px;
      border-radius: 4px;
      background-color: #f8f8f8;">
      <span>${marketplaceName}</span>
      <div class="loading-spinner" style="
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #555;
        border-radius: 50%;
        animation: spin 1s linear infinite;">
      </div>
    </div>
  `;
}

function showInitialLoadingState(marketplaces) {
  const container = createPriceComparisonContainer();
  if (!container) return;

  container.style.display = 'block';
  container.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">🌍 Price Comparison</div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .marketplace-result {
        transition: opacity 0.3s ease-in-out;
      }
    </style>
    ${Object.values(marketplaces).map(info => createLoadingSpinner(info.name)).join('')}
  `;
}

function updatePartialResults(container, results, totalMarketplaces) {
  if (!container) return;

  const loadingSpinners = container.querySelectorAll('.marketplace-loading');
  const processedMarketplaces = new Set(results.map(r => r.marketplace));
  
  // Update progress text
  const progressText = container.querySelector('.progress-text') || (() => {
    const div = document.createElement('div');
    div.className = 'progress-text';
    div.style.fontSize = '12px';
    div.style.color = '#666';
    div.style.marginBottom = '8px';
    container.querySelector('div').insertAdjacentElement('afterend', div);
    return div;
  })();
  
  progressText.textContent = `Checking prices: ${processedMarketplaces.size}/${totalMarketplaces}`;

  // Sort results by price
  const sortedResults = [...results].sort((a, b) => 
    parseFloat(a.price.replace(/[^0-9.,]/g, '')) - parseFloat(b.price.replace(/[^0-9.,]/g, ''))
  );

  // Update or add new results
  sortedResults.forEach(result => {
    const existingSpinner = Array.from(loadingSpinners).find(
      spinner => spinner.textContent.includes(result.marketplace)
    );
    
    if (existingSpinner) {
      existingSpinner.outerHTML = `
        <a href="${result.url}" 
           target="_blank" 
           class="marketplace-result"
           style="display: flex; justify-content: space-between; 
                  margin-bottom: 4px; padding: 4px 8px;
                  text-decoration: none; color: inherit;
                  border-radius: 4px;
                  transition: background-color 0.2s;
                  cursor: pointer;
                  opacity: 0;"
           onmouseover="this.style.backgroundColor='#f0f0f0'"
           onmouseout="this.style.backgroundColor='transparent'">
          <span>${result.marketplace}</span>
          <span style="color: #B12704; font-weight: bold;">${result.price}</span>
        </a>
      `;
      
      // Trigger fade-in animation
      setTimeout(() => {
        const newElement = container.querySelector(`a[href="${result.url}"]`);
        if (newElement) newElement.style.opacity = '1';
      }, 50);
    }
  });
}

// Update price display on the page
function updatePagePriceDisplay(results) {
  const container = createPriceComparisonContainer();
  if (!container) return;

  if (!results || results.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">🌍 Price Comparison</div>
    ${results.map(result => `
      <a href="${result.url}" 
         target="_blank" 
         style="display: flex; justify-content: space-between; 
                margin-bottom: 4px; padding: 4px 8px;
                text-decoration: none; color: inherit;
                border-radius: 4px;
                transition: background-color 0.2s;
                cursor: pointer;"
         onmouseover="this.style.backgroundColor='#f0f0f0'"
         onmouseout="this.style.backgroundColor='transparent'">
        <span>${result.marketplace}</span>
        <span style="color: #B12704; font-weight: bold;">${result.price}</span>
      </a>
    `).join('')}
    <style>
      #quick-saver-prices a:hover {
        background-color: #f0f0f0;
      }
      #quick-saver-prices a:active {
        background-color: #e4e4e4;
      }
    </style>
  `;
}

// Automatically start price comparison
async function startAutomaticPriceComparison() {
  // Reset previous state
  const container = createPriceComparisonContainer();
  if (!container) return;
  
  container.innerHTML = '';
  container.style.display = 'none';

  try {
    const productInfo = extractProductInfo();
    if (!productInfo || !productInfo.asin) {
      throw new Error('Could not find product information');
    }

    const priceComparator = new PriceComparison();
    
    // Show initial loading state
    showInitialLoadingState(priceComparator.marketplaces);
    
    // Set up array to collect results as they come in
    const results = [];
    const totalMarketplaces = Object.keys(priceComparator.marketplaces).length;
    
    // Create a promise for each marketplace
    const promises = Object.entries(priceComparator.marketplaces).map(async ([domain, info]) => {
      const result = await priceComparator.fetchPrice(domain, info, productInfo.asin, `${domain}-${productInfo.asin}`);
      if (result) {
        results.push(result);
        updatePartialResults(container, results, totalMarketplaces);
      }
      return result;
    });

    // Wait for all promises to complete
    const allResults = (await Promise.all(promises)).filter(result => result !== null);

    if (allResults.length === 0) {
      throw new Error('No prices found');
    }

    // Final update with all results
    updatePagePriceDisplay(allResults);
  } catch (error) {
    console.error('Error in automatic price comparison:', error);
    if (container) {
      container.style.display = 'block';
      container.innerHTML = `
        <div style="color: #c40000; padding: 5px;">
          <div style="margin-bottom: 5px;">⚠️ Unable to compare prices</div>
          <div style="font-size: 12px; color: #666;">
            Please try refreshing the page or check back later
          </div>
        </div>
      `;
    }
  }
}

// Check if the current page is a product page
function isProductPage() {
  const url = window.location.href;
  return url.includes('/dp/') || 
         url.includes('/gp/product/') || 
         url.includes('/gp/aw/d/');
}

// Initialize price comparison
function initializePriceComparison() {
  if (!isProductPage()) return;
  
  // Clear any existing containers
  const existingContainer = document.getElementById('quick-saver-prices');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Start the price comparison process
  waitForPriceElement();
}

// Wait for price element to be available
function waitForPriceElement() {
  const observer = new MutationObserver((mutations, obs) => {
    const priceElement = document.querySelector('#corePriceDisplay_desktop_feature_div, #price_inside_buybox');
    if (priceElement) {
      obs.disconnect();
      startAutomaticPriceComparison();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also check immediately in case the element is already there
  const priceElement = document.querySelector('#corePriceDisplay_desktop_feature_div, #price_inside_buybox');
  if (priceElement) {
    startAutomaticPriceComparison();
  }
}

// Initialize on page load and URL changes
function initialize() {
  // Initial check
  initializePriceComparison();

  // Listen for URL changes (for single-page navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      initializePriceComparison();
    }
  }).observe(document, { subtree: true, childList: true });
}

// Start the initialization process
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Listen for connection attempts from the popup
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "productInfo") {
    port.onMessage.addListener(async function(msg) {
      if (msg.action === 'getProductInfo') {
        try {
          const productInfo = extractProductInfo();
          port.postMessage(productInfo);
        } catch (error) {
          port.postMessage({ error: error.message });
        }
      } else if (msg.action === 'scrollToReviews') {
        try {
          const reviewsElement = document.querySelector(msg.reviewsSelector);
          if (reviewsElement) {
            reviewsElement.scrollIntoView({ behavior: 'smooth' });
          }
        } catch (error) {
          console.error('Error scrolling to reviews:', error);
        }
      } else if (msg.action === 'updatePrices') {
        updatePagePriceDisplay(msg.results);
      } else if (msg.action === 'showLoading') {
        showPriceLoading();
      }
    });
  }
});

// Keep the old message listener for backward compatibility
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProductInfo') {
    try {
      const productInfo = extractProductInfo();
      sendResponse(productInfo);
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true; // Will respond asynchronously
  } else if (request.action === 'scrollToReviews') {
    try {
      const reviewsElement = document.querySelector(request.reviewsSelector);
      if (reviewsElement) {
        reviewsElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error scrolling to reviews:', error);
    }
  }
}); 