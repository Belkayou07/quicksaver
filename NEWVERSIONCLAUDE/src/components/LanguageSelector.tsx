import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();

    const languages = {
        en: 'English',
        fr: 'Français',
        nl: 'Nederlands',
        es: 'Español',
        pt: 'Português',
        it: 'Italiano',
        de: 'Deutsch',
        ru: 'Русский',
        pl: 'Polski',
        sv: 'Svenska',
        no: 'Norsk',
        fi: 'Suomi',
        el: 'Ελληνικά',
        tr: 'Türkçe',
        ja: '日本語',
        ko: '한국어',
        'zh-CN': '简体中文',
        'zh-TW': '繁體中文',
        vi: 'Tiếng Việt',
        th: 'ไทย',
        hi: 'हिन्दी',
        bn: 'বাংলা',
        id: 'Bahasa Indonesia',
        ms: 'Bahasa Melayu',
        ar: 'العربية',
        he: 'עברית',
        fa: 'فارسی',
        ur: 'اردو',
        'pt-BR': 'Português (Brasil)',
        'es-MX': 'Español (México)',
        'fr-CA': 'Français (Canada)'
    };

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = event.target.value;
        i18n.changeLanguage(newLang);
    };

    return (
        <div className="setting-item">
            <span className="setting-label">{t('settings.language.select')}</span>
            <select 
                value={i18n.language} 
                onChange={handleLanguageChange}
                className="language-select"
            >
                {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>
                        {name}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LanguageSelector;
