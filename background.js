// Keep track of tabs where content script is injected
let injectedTabs = new Set();

// Function to inject the content script
async function injectContentScript(tabId) {
  if (injectedTabs.has(tabId)) {
    console.log('Content script already injected in tab:', tabId);
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    injectedTabs.add(tabId);
    console.log('Content script injected successfully in tab:', tabId);
  } catch (err) {
    console.error('Failed to inject content script:', err);
  }
}

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('amazon')) {
    injectContentScript(tabId);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchPrice') {
    fetchPriceWithRetry(request.url)
      .then(html => sendResponse({ success: true, html }))
      .catch(error => {
        console.log(`Failed to fetch ${request.url}:`, error.message);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

async function fetchPriceWithRetry(url, retries = 2, delay = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // If it's a 404, the product doesn't exist in this marketplace
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      return text;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
}

// Set up the side panel availability
chrome.runtime.onInstalled.addListener(() => {
  // Enable the side panel for all URLs
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(err => console.error('Failed to set panel behavior:', err));
});