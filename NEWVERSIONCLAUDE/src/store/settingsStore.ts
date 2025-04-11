import { create } from 'zustand';

interface SettingsState {
    priceComparisonEnabled: boolean;
    shippingCalculationEnabled: boolean;
    flagDisplayEnabled: boolean;
    priceIndicatorEnabled: boolean;
    currencyCode: string;
    initialized: boolean;
    setSettings: (settings: Partial<Omit<SettingsState, 'setSettings' | 'loadSettings' | 'initialized'>>) => void;
    loadSettings: () => Promise<void>;
}

// Initialize store with default values
const useSettingsStore = create<SettingsState>((set) => {
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local') return;

        const newSettings: Partial<SettingsState> = {};
        let hasChanges = false;

        // Check each setting that might have changed
        if ('priceComparisonEnabled' in changes) {
            newSettings.priceComparisonEnabled = changes.priceComparisonEnabled.newValue;
            hasChanges = true;
        }
        if ('shippingCalculationEnabled' in changes) {
            newSettings.shippingCalculationEnabled = changes.shippingCalculationEnabled.newValue;
            hasChanges = true;
        }
        if ('flagDisplayEnabled' in changes) {
            newSettings.flagDisplayEnabled = changes.flagDisplayEnabled.newValue;
            hasChanges = true;
        }
        if ('priceIndicatorEnabled' in changes) {
            newSettings.priceIndicatorEnabled = changes.priceIndicatorEnabled.newValue;
            hasChanges = true;
        }
        if ('currencyCode' in changes) {
            newSettings.currencyCode = changes.currencyCode.newValue;
            hasChanges = true;
        }

        // Only update store if we have changes
        if (hasChanges) {
            set((state) => ({ ...state, ...newSettings }));
        }
    });

    return {
        priceComparisonEnabled: false, // Start with false until we load from storage
        shippingCalculationEnabled: true,
        flagDisplayEnabled: true,
        priceIndicatorEnabled: true,
        currencyCode: 'EUR',
        initialized: false,

        setSettings: (newSettings) => {
            // Update store
            set((state) => ({ ...state, ...newSettings }));
            
            // Save to storage
            chrome.storage.local.set(newSettings);

            // If price comparison setting changed, notify all tabs
            if ('priceComparisonEnabled' in newSettings) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'TOGGLE_PRICE_COMPARISON',
                                enabled: newSettings.priceComparisonEnabled
                            }).catch(() => {
                                // Ignore errors for tabs that don't have the content script
                            });
                        }
                    });
                });
            }

            // If display settings changed, notify all tabs to update display
            if ('shippingCalculationEnabled' in newSettings || 
                'flagDisplayEnabled' in newSettings || 
                'priceIndicatorEnabled' in newSettings) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'UPDATE_DISPLAY_SETTINGS',
                                settings: {
                                    shippingCalculationEnabled: 'shippingCalculationEnabled' in newSettings 
                                        ? newSettings.shippingCalculationEnabled 
                                        : undefined,
                                    flagDisplayEnabled: 'flagDisplayEnabled' in newSettings 
                                        ? newSettings.flagDisplayEnabled 
                                        : undefined,
                                    priceIndicatorEnabled: 'priceIndicatorEnabled' in newSettings 
                                        ? newSettings.priceIndicatorEnabled 
                                        : undefined
                                }
                            }).catch(() => {
                                // Ignore errors for tabs that don't have the content script
                            });
                        }
                    });
                });
            }

            // If currency code changed, notify all tabs to update price display
            if ('currencyCode' in newSettings) {
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'UPDATE_CURRENCY',
                                currencyCode: newSettings.currencyCode
                            }).catch(() => {
                                // Ignore errors for tabs that don't have the content script
                            });
                        }
                    });
                });
            }
        },

        loadSettings: async () => {
            const result = await chrome.storage.local.get([
                'priceComparisonEnabled',
                'shippingCalculationEnabled',
                'flagDisplayEnabled',
                'priceIndicatorEnabled',
                'currencyCode'
            ]);

            set((state) => ({
                ...state,
                priceComparisonEnabled: result.priceComparisonEnabled ?? true,
                shippingCalculationEnabled: result.shippingCalculationEnabled ?? true,
                flagDisplayEnabled: result.flagDisplayEnabled ?? true,
                priceIndicatorEnabled: result.priceIndicatorEnabled ?? true,
                currencyCode: result.currencyCode ?? 'EUR',
                initialized: true
            }));
        }
    };
});

export { useSettingsStore };
