import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import it from '../locales/it.json';
import ja from '../locales/ja.json';
import zhCN from '../locales/zh-CN.json';
import ar from '../locales/ar.json';
import nl from '../locales/nl.json';
import pl from '../locales/pl.json';
import sv from '../locales/sv.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  ja: { translation: ja },
  'zh-CN': { translation: zhCN },
  ar: { translation: ar },
  nl: { translation: nl },
  pl: { translation: pl },
  sv: { translation: sv }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

// Handle RTL languages
i18n.on('languageChanged', (lng) => {
  const rtlLanguages = ['ar'];
  document.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
});

export default i18n;
