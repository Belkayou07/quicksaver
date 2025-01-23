document.addEventListener('DOMContentLoaded', async () => {
  // Détection de la langue du navigateur
  const userLang = navigator.language.split('-')[0];
  const lang = translations[userLang] ? userLang : 'en'; // Anglais par défaut

  // Mise à jour des textes statiques avec vérification
  const headerText = document.querySelector('.header span:last-child');
  const loadingTextElement = document.querySelector('#loading div:last-child');
  const historyButton = document.getElementById('historyButton');
  const comparisonHeader = document.querySelector('.comparison-header span:last-child');
  
  if (headerText) headerText.textContent = translations[lang].header;
  if (loadingTextElement) loadingTextElement.textContent = translations[lang].loading;
  if (historyButton) historyButton.innerHTML = `<span>📋</span>${translations[lang].historyButton}`;
  if (comparisonHeader) comparisonHeader.textContent = translations[lang].priceComparison;

  const loadingElement = document.getElementById('loading');
  const productInfoElement = document.getElementById('productInfo');
  const errorElement = document.getElementById('error');
  const errorTextElement = document.getElementById('errorText');

  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if we're on an Amazon product page
    if (!tab.url?.match(/amazon\.(com|co\.uk|fr|de|it|es|nl|com\.be).*\/(dp|gp\/product)/)) {
      throw new Error('Veuillez naviguer vers une page produit Amazon');
    }

    // Keep track of content script injection
    let isContentScriptInjected = false;

    // Inject content script if not already injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      isContentScriptInjected = true;
    } catch (err) {
      console.log('Script already injected or injection failed:', err);
      // Assume script is already injected if injection fails
      isContentScriptInjected = true;
    }

    // Wait a moment for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Wrap message sending in a Promise with timeout
    const getProductInfo = () => {
      return new Promise((resolve, reject) => {
        // Set up a timeout
        const timeout = setTimeout(() => {
          reject(new Error('Timeout while waiting for response'));
        }, 5000);

        // Set up a port for longer-lived connection
        const port = chrome.tabs.connect(tab.id, {name: 'productInfo'});
        
        port.onMessage.addListener(function(response) {
          clearTimeout(timeout);
          if (!response) {
            reject(new Error('No response received'));
            return;
          }
          resolve(response);
        });

        port.onDisconnect.addListener(function() {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            reject(new Error('Connection failed: ' + chrome.runtime.lastError.message));
          }
        });

        // Send the message
        port.postMessage({action: 'getProductInfo'});
      });
    };

    // Try to get product info with retries
    let attempts = 0;
    let response;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        loadingElement.style.display = 'block';
        response = await getProductInfo();
        break;
      } catch (err) {
        attempts++;
        console.log(`Attempt ${attempts} failed:`, err);
        
        if (attempts === maxAttempts) {
          throw new Error('Impossible de récupérer les informations après plusieurs tentatives. Veuillez rafraîchir la page.');
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    loadingElement.style.display = 'none';

    if (response.error) {
      errorTextElement.textContent = response.error;
      errorElement.style.display = 'block';
      return;
    }

    // Mise à jour des labels avec vérification
    const priceLabel = document.querySelector('.info-row:nth-of-type(1) .info-label');
    const modelLabel = document.querySelector('.info-row:nth-of-type(2) .info-label');
    const asinLabel = document.querySelector('.info-row:nth-of-type(3) .info-label');

    if (priceLabel) priceLabel.textContent = translations[lang].price;
    if (modelLabel) modelLabel.textContent = translations[lang].modelNumber;
    if (asinLabel) asinLabel.textContent = translations[lang].asin;

    // Display product information avec vérification
    const productImage = document.getElementById('productImage');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productModel = document.getElementById('productModel');
    const productASIN = document.getElementById('productASIN');
    const productRating = document.getElementById('productRating');
    const productRatingStars = document.getElementById('productRatingStars');
    const productRatingValue = document.getElementById('productRatingValue');
    const productReviewCount = document.getElementById('productReviewCount');

    if (productImage) productImage.src = response.image || '';
    if (productName) productName.textContent = response.name || translations[lang].notAvailable;
    if (productPrice) productPrice.textContent = response.price || translations[lang].notAvailable;
    if (productModel) productModel.textContent = response.modelNumber || translations[lang].notAvailable;
    if (productASIN) productASIN.textContent = response.asin || translations[lang].notAvailable;

    // Afficher la note et le nombre d'avis
    if (response.rating) {
      const rating = parseFloat(response.rating);
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      
      // Créer les étoiles
      let stars = '★'.repeat(fullStars);
      if (hasHalfStar) stars += '⯨';
      stars += '☆'.repeat(5 - Math.ceil(rating));
      
      if (productRatingStars) productRatingStars.textContent = stars;
      if (productRatingValue) productRatingValue.textContent = `${rating}/5`;
      if (productReviewCount) {
        const reviewCount = response.reviewCount ? `(${response.reviewCount} avis)` : '';
        productReviewCount.textContent = reviewCount;
      }

      // Ajouter le gestionnaire de clic pour ouvrir les commentaires
      if (productRating && response.reviewUrl) {
        productRating.addEventListener('click', async () => {
          // Envoyer un message au content script pour faire défiler jusqu'aux avis
          chrome.tabs.sendMessage(tab.id, {
            action: 'scrollToReviews',
            reviewsSelector: response.reviewUrl
          });
        });
      }
    } else {
      if (productRating) productRating.style.display = 'none';
    }

    if (productInfoElement) {
      productInfoElement.style.display = 'block';
      
      // Ajouter le produit à l'historique
      const productHistory = new ProductHistory();
      await productHistory.addProduct({
        name: response.name,
        price: response.price,
        image: response.image,
        asin: response.asin,
        url: tab.url
      });
    }

    // Gestion de la comparaison des prix
    const priceComparison = document.getElementById('priceComparison');
    const comparisonResults = document.getElementById('comparisonResults');
    const shippingToggle = document.getElementById('shippingToggle');
    let includeShipping = false;

    // Initialize shipping toggle state
    shippingToggle.classList.toggle('active', includeShipping);

    shippingToggle.addEventListener('click', () => {
      includeShipping = !includeShipping;
      shippingToggle.classList.toggle('active', includeShipping);
      
      // Update all prices to show/hide shipping costs
      if (cachedResults.length > 0) {
        updatePriceDisplay(cachedResults, includeShipping);
      }
    });

    let cachedResults = [];

    function updatePriceDisplay(results, withShipping) {
      if (results.length > 0) {
        // Sort results based on current price view (with or without shipping)
        const sortedResults = [...results].sort((a, b) => {
          const aPrice = parseFloat(
            (withShipping && a.shippingCost > 0 ? a.price : a.priceWithoutShipping)
              .replace(/[^0-9.,]/g, '')
              .replace(',', '.')
          );
          const bPrice = parseFloat(
            (withShipping && b.shippingCost > 0 ? b.price : b.priceWithoutShipping)
              .replace(/[^0-9.,]/g, '')
              .replace(',', '.')
          );
          return aPrice - bPrice;
        });

        // First item is always the best price after sorting
        const bestResult = sortedResults[0];

        // Display results
        comparisonResults.innerHTML = sortedResults.map(result => {
          const hasShipping = result.shippingCost > 0;
          const mainPrice = withShipping && hasShipping ? result.price : result.priceWithoutShipping;
          const isBest = result === bestResult;

          return `
            <div class="marketplace-row ${isBest ? 'best-price' : ''}" 
                 role="button"
                 tabindex="0"
                 title="Cliquez pour voir ce produit sur ${result.marketplace}"
                 data-url="${result.url}">
              <div class="marketplace-name">
                <span>${result.marketplace}</span>
                ${hasShipping ? 
                  `<small class="shipping-info ${withShipping ? 'active' : ''}">${result.shippingCost}${result.currency} shipping</small>` :
                  `<small class="shipping-info">Free shipping</small>`
                }
              </div>
              <div class="marketplace-price">
                <strong>${mainPrice}</strong>
                ${hasShipping && withShipping ? 
                  `<small>(${result.priceWithoutShipping} + ${result.shippingCost}${result.currency})</small>` : 
                  ''}
              </div>
            </div>
          `;
        }).join('');

        // Add click event listeners
        const rows = comparisonResults.querySelectorAll('.marketplace-row');
        rows.forEach(row => {
          row.addEventListener('click', () => {
            const url = row.dataset.url;
            if (url) {
              chrome.tabs.create({ url: url });
            }
          });

          // Add keyboard support for accessibility
          row.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              const url = row.dataset.url;
              if (url) {
                chrome.tabs.create({ url: url });
              }
            }
          });
        });
      }
    }

    // Gestion de l'historique
    historyButton.addEventListener('click', async () => {
      try {
        const productHistory = new ProductHistory();
        const history = await productHistory.getHistory();
        
        if (history.length > 0) {
          const historyHtml = history.map(product => {
            const date = new Date(product.timestamp);
            const formattedDate = new Intl.DateTimeFormat(lang, {
              dateStyle: 'medium',
              timeStyle: 'short'
            }).format(date);

            return `
              <div class="marketplace-row" 
                   role="button"
                   tabindex="0"
                   title="Cliquez pour revoir ce produit"
                   data-url="${product.url}">
                <img src="${product.image}" alt="${product.name}" class="history-image">
                <div class="history-content">
                  <div class="history-info">
                    <div class="history-name">${product.name}</div>
                    <span class="history-date">${formattedDate}</span>
                  </div>
                  <div class="marketplace-price">${product.price}</div>
                </div>
              </div>
            `;
          }).join('');

          priceComparison.style.display = 'block';
          comparisonHeader.textContent = translations[lang].historyButton;
          comparisonResults.innerHTML = historyHtml;

          // Ajouter les gestionnaires d'événements pour les clics
          const rows = comparisonResults.querySelectorAll('.marketplace-row');
          rows.forEach(row => {
            row.addEventListener('click', () => {
              const url = row.dataset.url;
              if (url) {
                chrome.tabs.create({ url: url });
              }
            });

            // Ajouter le support du clavier pour l'accessibilité
            row.addEventListener('keypress', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                const url = row.dataset.url;
                if (url) {
                  chrome.tabs.create({ url: url });
                }
              }
            });
          });
        } else {
          priceComparison.style.display = 'block';
          comparisonResults.innerHTML = `<div class="error-message">${translations[lang].noResults}</div>`;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        comparisonResults.innerHTML = `<div class="error-message">${translations[lang].errorMessages['Erreur lors de la comparaison des prix']}</div>`;
      }
    });

  } catch (error) {
    console.error('Error:', error);
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) {
      errorTextElement.textContent = translations[lang].errorMessages[error.message] || error.message;
      errorElement.style.display = 'block';
    }
  }
}); 