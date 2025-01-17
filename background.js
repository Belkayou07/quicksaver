// Cache pour stocker les résultats temporairement
const priceCache = new Map();

// Handle price comparison requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'COMPARE_PRICES') {
    comparePrices(request.productId, request.currentPrice)
      .then(results => sendResponse({ success: true, data: results }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Price comparison logic
async function comparePrices(productId, currentPrice) {
  const marketplaces = [
    'amazon.fr',
    'amazon.de',
    'amazon.es',
    'amazon.it',
    'amazon.nl',
    'amazon.be',
    'amazon.se',
    'amazon.co.uk'
  ];

  // Vérifier le cache
  const cacheKey = `${productId}_${Date.now()}`;
  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey);
  }

  const results = await Promise.all(
    marketplaces.map(async (domain) => {
      try {
        const response = await fetch(`https://${domain}/dp/${productId}`, {
          headers: {
            'Accept': 'text/html',
            'User-Agent': 'Mozilla/5.0 (compatible; Quick-Saver/1.0)'
          }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();

        // Extraction du prix avec regex
        const priceMatch = html.match(/(?:"price":"|priceAmount":|"price":{[^}]*"value":)(\d+\.?\d*)/);
        const currencyMatch = html.match(/(?:"currency":"|"currencySymbol":")([^"]*)/);

        if (priceMatch && currencyMatch) {
          const price = parseFloat(priceMatch[1]);
          const currency = currencyMatch[1];

          // Conversion en EUR si nécessaire
          const eurPrice = await convertToEUR(price, currency);

          return {
            marketplace: domain,
            price: price,
            eurPrice: eurPrice,
            currency: currency,
            available: true,
            savings: currentPrice ? ((currentPrice - eurPrice) / currentPrice * 100).toFixed(2) : 0
          };
        }

        throw new Error('Price not found');
      } catch (error) {
        console.error(`Error fetching ${domain}:`, error);
        return {
          marketplace: domain,
          available: false,
          error: error.message
        };
      }
    })
  );

  // Filtrer et trier les résultats
  const validResults = results
    .filter(r => r.available)
    .sort((a, b) => a.eurPrice - b.eurPrice);

  // Mettre en cache pour 5 minutes
  priceCache.set(cacheKey, validResults);
  setTimeout(() => priceCache.delete(cacheKey), 5 * 60 * 1000);

  return validResults;
}

async function convertToEUR(price, fromCurrency) {
  if (fromCurrency === 'EUR') return price;
  
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    return price * data.rates.EUR;
  } catch (error) {
    console.error('Currency conversion error:', error);
    return price; // Retourner le prix original en cas d'erreur
  }
} 