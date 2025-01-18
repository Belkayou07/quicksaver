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

// Listen for messages from popup with error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Amazon Product Info] Received message:', request);
  
  if (request.action === 'getProductInfo') {
    try {
      const productInfo = extractProductInfo();
      console.log('[Amazon Product Info] Sending response:', productInfo);
      sendResponse(productInfo);
    } catch (error) {
      logError('Message handling failed', error);
      sendResponse({ error: 'Erreur lors de l\'extraction des données' });
    }
  }
  else if (request.action === 'scrollToReviews') {
    try {
      const reviewsSection = document.querySelector(request.reviewsSelector);
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      logError('Scroll to reviews failed', error);
    }
  }
  return true;
}); 