document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settings-btn');
  const priceComparison = document.getElementById('price-comparison');
  const loadingElement = priceComparison.querySelector('.loading');
  const resultsElement = priceComparison.querySelector('.results');
  const noResultsElement = priceComparison.querySelector('.no-results');

  // Handle settings button click
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Get current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url.includes('amazon')) {
      showLoading();
      try {
        // Request price comparison from background script
        const results = await chrome.runtime.sendMessage({
          type: 'GET_PRICE_COMPARISON',
          url: currentTab.url
        });
        
        if (results && results.length > 0) {
          showResults(results);
        } else {
          showNoResults();
        }
      } catch (error) {
        console.error('Error getting price comparison:', error);
        showNoResults();
      }
    } else {
      showMessage('Please navigate to an Amazon product page.');
    }
  });

  function showLoading() {
    loadingElement.classList.remove('hidden');
    resultsElement.classList.add('hidden');
    noResultsElement.classList.add('hidden');
  }

  function showResults(results) {
    loadingElement.classList.add('hidden');
    resultsElement.classList.remove('hidden');
    noResultsElement.classList.add('hidden');
    
    // TODO: Implement results display
    resultsElement.innerHTML = '<p>Price comparison results will be shown here</p>';
  }

  function showNoResults() {
    loadingElement.classList.add('hidden');
    resultsElement.classList.add('hidden');
    noResultsElement.classList.remove('hidden');
  }

  function showMessage(message) {
    loadingElement.classList.add('hidden');
    resultsElement.classList.add('hidden');
    noResultsElement.classList.remove('hidden');
    noResultsElement.querySelector('p').textContent = message;
  }
}); 