import { create } from 'zustand';

interface ThemeState {
    theme: 'dark' | 'light';
    initialized: boolean;
    setTheme: (theme: 'dark' | 'light') => void;
    toggleTheme: () => void;
    loadTheme: () => Promise<void>;
}

const useThemeStore = create<ThemeState>((set) => {
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local' || !('theme' in changes)) return;
        
        set((state) => ({
            ...state,
            theme: changes.theme.newValue
        }));
    });

    return {
        theme: 'dark',
        initialized: false,

        setTheme: (theme) => {
            set({ theme });
            chrome.storage.local.set({ theme });
        },

        toggleTheme: () => {
            set((state) => {
                const newTheme = state.theme === 'dark' ? 'light' : 'dark';
                chrome.storage.local.set({ theme: newTheme });
                return { theme: newTheme };
            });
        },

        loadTheme: async () => {
            const result = await chrome.storage.local.get(['theme']);
            set((state) => ({
                ...state,
                theme: result.theme ?? 'dark',
                initialized: true
            }));
        }
    };
});

export { useThemeStore };
