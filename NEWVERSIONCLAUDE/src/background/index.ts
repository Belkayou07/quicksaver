// Background script for the extension
import { browser } from 'webextension-polyfill-ts';

// Listen for installation
browser.runtime.onInstalled.addListener(() => {
  console.log('Quick-Saver extension installed');
});

// Handle fetch requests from content script
browser.runtime.onMessage.addListener(async (message: any) => {
  try {
    if (message.type === '_execute_browser_action') {
      // @ts-ignore - Chrome specific API
      chrome.action.openPopup();
      return { success: true };
    }

    if (message.type === 'TOGGLE_PANEL') {
      try {
        // @ts-ignore - Chrome specific API
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs[0]?.id) {
          throw new Error('No active tab found');
        }

        // Configure the sidepanel first
        // @ts-ignore - Chrome specific API
        await chrome.sidePanel.setOptions({
          tabId: tabs[0].id,
          path: 'sidepanel.html',
          enabled: true
        });

        // Focus the current window to ensure the user gesture context is maintained
        await chrome.windows.update(tabs[0].windowId, { focused: true });

        // Open the sidepanel
        // @ts-ignore - Chrome specific API
        await chrome.action.openPopup();

        return { success: true };
      } catch (error) {
        console.error('Error with sidepanel:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to handle sidepanel' };
      }
    }

    if (message.type === 'FETCH_URL') {
      const response = await fetch(message.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return { success: true, data: text };
    }
    
    if (message.type === 'FETCH_EXCHANGE_RATES') {
      try {
        const response = await fetch(message.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data; // The API already returns { rates: { ... } }
      } catch (error) {
        console.error('Error in background script:', error);
        throw error;
      }
    }

    return { success: false, error: 'Unknown message type' };
  } catch (error) {
    console.error('Error in background script:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
});
