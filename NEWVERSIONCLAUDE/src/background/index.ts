// Background script for the extension
import { browser } from 'webextension-polyfill-ts';

// Listen for installation
browser.runtime.onInstalled.addListener(async () => {
  console.log('Quick-Saver extension installed');
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

    if (message.type === 'CLICK_EXTENSION') {
      // Get current window to position the popup
      const [currentWindow] = await chrome.windows.getAll({ windowTypes: ['normal'], populate: true });
      if (!currentWindow?.id) {
        throw new Error('No window found');
      }

      // Get window details
      const window = await chrome.windows.get(currentWindow.id);
      
      // Wider popup window
      const width = 500;

      // Create popup positioned on the right side
      await chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width,
        height: window.height,
        top: window.top,
        left: window.left! + window.width! - width, // Position on right side
        focused: true
      });
      return { success: true };
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
