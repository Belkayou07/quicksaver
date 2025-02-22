import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';
import deTranslations from '../locales/de.json';
import esTranslations from '../locales/es.json';
import itTranslations from '../locales/it.json';
import nlTranslations from '../locales/nl.json';
import plTranslations from '../locales/pl.json';
import svTranslations from '../locales/sv.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      fr: {
        translation: frTranslations
      },
      de: {
        translation: deTranslations
      },
      es: {
        translation: esTranslations
      },
      it: {
        translation: itTranslations
      },
      nl: {
        translation: nlTranslations
      },
      pl: {
        translation: plTranslations
      },
      sv: {
        translation: svTranslations
      }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
