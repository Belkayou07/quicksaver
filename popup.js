document.addEventListener('DOMContentLoaded', async () => {
  // Détection de la langue du navigateur
  const userLang = navigator.language.split('-')[0];
  const lang = translations[userLang] ? userLang : 'en'; // Anglais par défaut

  // Mise à jour des textes statiques avec vérification
  const headerText = document.querySelector('.header span:last-child');
  const loadingTextElement = document.querySelector('#loading div:last-child');
  const compareButton = document.getElementById('compareButton');
  const historyButton = document.getElementById('historyButton');
  const comparisonHeader = document.querySelector('.comparison-header span:last-child');
  
  if (headerText) headerText.textContent = translations[lang].header;
  if (loadingTextElement) loadingTextElement.textContent = translations[lang].loading;
  if (compareButton) compareButton.innerHTML = `<span>🔍</span>${translations[lang].compareButton}`;
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

    // Inject content script first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (err) {
      console.log('Script already injected or injection failed:', err);
    }

    // Wait a moment for the script to initialize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Wrap message sending in a Promise for better error handling
    const getProductInfo = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tab.id,
          { action: 'getProductInfo' },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error('Impossible de communiquer avec la page. Veuillez rafraîchir la page et réessayer.'));
              return;
            }
            if (!response) {
              reject(new Error('Aucune réponse reçue. Veuillez rafraîchir la page et réessayer.'));
              return;
            }
            resolve(response);
          }
        );
      });
    };

    // Try to get product info multiple times
    let attempts = 0;
    let response;
    while (attempts < 3) {
      try {
        response = await Promise.race([
          getProductInfo(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Délai d\'attente dépassé.')), 2000)
          )
        ]);
        break;
      } catch (err) {
        attempts++;
        if (attempts === 3) {
          throw new Error('Impossible de récupérer les informations après plusieurs tentatives. Veuillez rafraîchir la page.');
        }
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

    compareButton.addEventListener('click', async () => {
      try {
        priceComparison.style.display = 'block';
        comparisonResults.innerHTML = '<div class="loading-spinner"></div>';

        const asin = productASIN.textContent;
        const comparison = new PriceComparison();
        const results = await comparison.searchProductInMarketplaces(asin);

        if (results.length > 0) {
          // Trouver le meilleur prix
          const bestResult = results.reduce((best, current) => {
            const currentPrice = parseFloat(current.price.replace(/[^0-9.,]/g, '').replace(',', '.'));
            const bestPrice = parseFloat(best.price.replace(/[^0-9.,]/g, '').replace(',', '.'));
            return currentPrice < bestPrice ? current : best;
          });

          // Afficher les résultats
          comparisonResults.innerHTML = results.map(result => `
            <div class="marketplace-row ${result === bestResult ? 'best-price' : ''}" 
                 role="button"
                 tabindex="0"
                 title="Cliquez pour voir ce produit sur ${result.marketplace}"
                 data-url="${result.url}">
              <div class="marketplace-name">${result.marketplace}</div>
              <div class="marketplace-price">${result.price}</div>
            </div>
          `).join('');

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
          comparisonResults.innerHTML = `<div class="error-message">${translations[lang].noResults}</div>`;
        }
      } catch (error) {
        console.error('Erreur lors de la comparaison:', error);
        comparisonResults.innerHTML = `<div class="error-message">${translations[lang].errorMessages['Erreur lors de la comparaison des prix']}</div>`;
      }
    });

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