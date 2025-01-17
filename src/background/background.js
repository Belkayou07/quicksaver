// Initialize side panel
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PRODUCT_DATA') {
    // Forward product data to side panel
    chrome.runtime.sendMessage({
      type: 'UPDATE_PRODUCT_INFO',
      data: request.data
    });
  }
}); 