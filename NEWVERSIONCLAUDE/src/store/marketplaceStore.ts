import { create } from 'zustand';
import { MARKETPLACES } from '../config/marketplaces';

interface MarketplaceState {
  selectedMarketplaces: string[];
  initialized: boolean;
  setSelectedMarketplaces: (marketplaces: string[]) => void;
  toggleMarketplace: (marketplace: string) => void;
  loadMarketplaces: () => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => {
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    if ('selectedMarketplaces' in changes) {
      set({ selectedMarketplaces: changes.selectedMarketplaces.newValue });
    }
  });

  return {
    selectedMarketplaces: Object.keys(MARKETPLACES),
    initialized: false,
    
    setSelectedMarketplaces: (marketplaces) => {
      set({ selectedMarketplaces: marketplaces });
      
      // Save to storage
      chrome.storage.local.set({ selectedMarketplaces: marketplaces });
      
      // Notify content scripts of the change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_SELECTED_MARKETPLACES',
              marketplaces: marketplaces
            }).catch(() => {
              // Ignore errors for tabs that don't have the content script
            });
          }
        });
      });
    },
    
    toggleMarketplace: (marketplace) => {
      set((state) => {
        const newSelectedMarketplaces = state.selectedMarketplaces.includes(marketplace)
          ? state.selectedMarketplaces.filter((m) => m !== marketplace)
          : [...state.selectedMarketplaces, marketplace];
        
        // Save to storage
        chrome.storage.local.set({ selectedMarketplaces: newSelectedMarketplaces });
        
        // Notify content scripts of the change
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'UPDATE_SELECTED_MARKETPLACES',
                marketplaces: newSelectedMarketplaces
              }).catch(() => {
                // Ignore errors for tabs that don't have the content script
              });
            }
          });
        });
        
        return { selectedMarketplaces: newSelectedMarketplaces };
      });
    },
    
    loadMarketplaces: async () => {
      const result = await chrome.storage.local.get(['selectedMarketplaces']);
      
      set({
        selectedMarketplaces: result.selectedMarketplaces || Object.keys(MARKETPLACES),
        initialized: true
      });
    }
  };
});
