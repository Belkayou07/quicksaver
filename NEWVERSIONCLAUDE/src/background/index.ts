// Background script for the extension
import { browser } from 'webextension-polyfill-ts';

// Listen for installation
browser.runtime.onInstalled.addListener(async () => {
  console.log('Quick-Saver extension installed');
});

// Function to open popup or focus existing one
async function openOrFocusPopup() {
  try {
    console.log('Starting openOrFocusPopup function');
    
    // Check if a popup window with our extension is already open
    const allWindows = await chrome.windows.getAll({ 
      populate: true
    });
    
    console.log('All windows:', allWindows.length);
    
    // Look for existing popup windows with our popup URL
    const popupUrl = chrome.runtime.getURL('popup.html');
    console.log('Looking for popup with URL:', popupUrl);
    
    // Log all windows for debugging
    allWindows.forEach((window, index) => {
      console.log(`Window ${index}:`, {
        id: window.id,
        type: window.type,
        state: window.state,
        tabs: window.tabs ? window.tabs.map(t => ({ 
          id: t.id, 
          url: t.url && t.url.substring(0, 50) + '...'
        })) : 'No tabs'
      });
    });
    
    // First look for popup windows containing our popup URL
    const existingPopup = allWindows.find(window => 
      window.type === 'popup' && 
      window.tabs && 
      window.tabs.some(tab => tab.url && tab.url.includes(popupUrl))
    );
    
    // If popup already exists, just focus on it
    if (existingPopup && existingPopup.id) {
      console.log('Found existing popup window, focusing it:', existingPopup.id);
      await chrome.windows.update(existingPopup.id, { 
        focused: true,
        drawAttention: true
      });
      return true;
    }
    
    console.log('No existing popup found, creating a new one');
    
    // Get current window to position the popup
    const [currentWindow] = await chrome.windows.getAll({ 
      windowTypes: ['normal'], 
      populate: false 
    });
    
    if (!currentWindow?.id) {
      throw new Error('No window found');
    }

    // Get window details
    const window = await chrome.windows.get(currentWindow.id);
    
    // Wider popup window
    const width = 500;

    // Create popup positioned on the right side
    const newPopup = await chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width,
      height: window.height,
      top: window.top,
      left: window.left! + window.width! - width, // Position on right side
      focused: true
    });
    
    console.log('Created new popup window:', newPopup.id);
    
    return true;
  } catch (error) {
    console.error('Error in openOrFocusPopup:', error);
    return false;
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked!', tab);
  try {
    const result = await openOrFocusPopup();
    console.log('Popup open result:', result);
  } catch (error) {
    console.error('Error handling extension icon click:', error);
  }
});

// Handle messages from content script
browser.runtime.onMessage.addListener(async (message: any, sender: any) => {
  try {
    if (message.type === 'UPDATE_PRICE_COMPARISON') {
      // Send message to content script to update price comparison visibility
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: 'TOGGLE_PRICE_COMPARISON',
          enabled: message.enabled
        });
      }
      return { success: true };
    }

    if (message.type === 'UPDATE_SELECTED_MARKETPLACES') {
      // Send message to all tabs to update the selected marketplaces
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'UPDATE_SELECTED_MARKETPLACES',
            marketplaces: message.marketplaces
          }).catch(() => {
            // Ignore errors for tabs that don't have the content script
          });
        }
      });
      return { success: true };
    }

    if (message.type === 'UPDATE_CURRENCY') {
      // Send message to all tabs to update the currency display
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'UPDATE_CURRENCY',
            currencyCode: message.currencyCode
          }).catch(() => {
            // Ignore errors for tabs that don't have the content script
          });
        }
      });
      return { success: true };
    }

    if (message.type === 'CLICK_EXTENSION') {
      try {
        const result = await openOrFocusPopup();
        return { success: result };
      } catch (error) {
        console.error('Error handling CLICK_EXTENSION message:', error);
        throw error;
      }
    }

    if (message.type === 'FETCH_URL') {
      const response = await fetch(message.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return { success: true, data: await response.text() };
    }

    if (message.type === 'FETCH_EXCHANGE_RATES') {
      try {
        const response = await fetch(message.url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        throw console.error('Error in background script:', error);
      }
    }

    return { success: false, error: 'Unknown message type' };
  } catch (error) {
    console.error('Error in background script:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
});

async function toggleSidepanel() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No active tab found');
    }

    // Configure and enable the sidepanel
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html',
      enabled: true
    });
  } catch (error) {
    console.error('Error toggling sidepanel:', error);
    throw error;
  }
}
