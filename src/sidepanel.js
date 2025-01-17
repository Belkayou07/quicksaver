document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  let exchangeRates = null;
  let userCurrency = 'EUR'; // Default to EUR, will be updated based on user's location

  // Fetch exchange rates
  async function fetchExchangeRates() {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      const data = await response.json();
      exchangeRates = data.rates;
      console.log('Exchange rates loaded:', exchangeRates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }

  // Convert price to user's currency
  function convertPrice(price, fromCurrency, toCurrency) {
    if (!exchangeRates || fromCurrency === toCurrency) {
      return price;
    }

    // Convert to EUR first (base currency)
    const inEUR = fromCurrency === 'EUR' ? 
      price : 
      price / exchangeRates[fromCurrency];

    // Convert from EUR to target currency
    return toCurrency === 'EUR' ? 
      inEUR : 
      inEUR * exchangeRates[toCurrency];
  }

  function formatPrice(price, currency) {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    });
    return formatter.format(price);
  }

  function getShippingStatusClass(canShip) {
    if (canShip === true) return 'shipping-available';
    if (canShip === false) return 'shipping-unavailable';
    return 'shipping-unknown';
  }

  function updateProductInfo(data) {
    loadingElement.classList.add('hidden');
    if (!data) {
      contentElement.innerHTML = `
        <div class="no-product">
          <p>No Amazon product detected</p>
          <p class="hint">Visit an Amazon product page to start comparing prices</p>
        </div>
      `;
      return;
    }

    // Convert price to user's currency if needed
    const convertedPrice = convertPrice(data.price, data.currency, userCurrency);
    const originalPriceDisplay = data.currency !== userCurrency ? 
      `<div class="original-price">(${formatPrice(data.price, data.currency)})</div>` : '';

    contentElement.innerHTML = `
      <div class="product-details">
        <h3 class="product-title">${data.title}</h3>
        <div class="product-meta">
          <div class="price-info">
            <span class="label">Current Price:</span>
            <span class="price">${formatPrice(convertedPrice, userCurrency)}</span>
            ${originalPriceDisplay}
          </div>
          <div class="marketplace-info">
            <span class="label">Marketplace:</span>
            <span class="marketplace">Amazon ${data.marketplace}</span>
          </div>
          <div class="product-id">
            <span class="label">ASIN:</span>
            <span class="asin">${data.asin}</span>
          </div>
          <div class="shipping-status ${getShippingStatusClass(data.shippingAvailability?.canShip)}">
            <span class="label">Shipping:</span>
            <span class="status">${data.shippingAvailability?.message || 'Unknown'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Initialize
  fetchExchangeRates();

  // Try to get user's location for currency
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`);
        const data = await response.json();
        // Get currency for the country
        const countryToCurrency = {
          'UK': 'GBP',
          'SE': 'SEK',
          'FR': 'EUR',
          'BE': 'EUR',
          'NL': 'EUR',
          'DE': 'EUR',
          'IT': 'EUR',
          'ES': 'EUR'
        };
        userCurrency = countryToCurrency[data.countryCode] || 'EUR';
        console.log('Detected user currency:', userCurrency);
      } catch (error) {
        console.error('Error detecting user location:', error);
      }
    });
  }

  // Tab switching event listeners
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Product info display elements
  const productInfo = document.querySelector('.product-info');
  const loadingElement = productInfo.querySelector('.loading');
  const contentElement = productInfo.querySelector('.content');

  // Listen for product data updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_PRODUCT_INFO') {
      updateProductInfo(message.data);
    }
  });

  // Initial state - show loading
  loadingElement.classList.remove('hidden');
}); 