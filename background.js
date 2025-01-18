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

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url?.includes('amazon')) {
    await injectContentScript(tab.id);
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Amazon Product Info extension installed');
}); 