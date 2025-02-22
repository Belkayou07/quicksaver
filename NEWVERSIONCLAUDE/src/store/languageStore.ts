import { create } from 'zustand';
import i18n from '../i18n';

interface LanguageState {
    language: string;
    initialized: boolean;
    setLanguage: (lang: string) => void;
    loadLanguage: () => Promise<void>;
}

const useLanguageStore = create<LanguageState>((set) => {
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local' || !('language' in changes)) return;
        
        const newLang = changes.language.newValue;
        i18n.changeLanguage(newLang); // Update i18n instance
        set((state) => ({
            ...state,
            language: newLang
        }));
    });

    return {
        language: 'en',
        initialized: false,

        setLanguage: (lang) => {
            i18n.changeLanguage(lang); // Update i18n instance
            set({ language: lang });
            chrome.storage.local.set({ language: lang });
        },

        loadLanguage: async () => {
            const result = await chrome.storage.local.get(['language']);
            const lang = result.language ?? 'en';
            i18n.changeLanguage(lang); // Update i18n instance
            set((state) => ({
                ...state,
                language: lang,
                initialized: true
            }));
        }
    };
});

export { useLanguageStore };
