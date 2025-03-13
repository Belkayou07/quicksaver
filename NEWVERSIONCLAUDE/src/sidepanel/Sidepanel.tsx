import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MARKETPLACES } from '../config/marketplaces';
import { useMarketplaceStore } from '../store/marketplaceStore';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { useSettingsStore } from '../store/settingsStore';
import '../i18n/config';

// Convert marketplace data to country format
const countries = Object.entries(MARKETPLACES).map(([domain, info]) => {
    const countryCode = domain.split('.').pop()?.toUpperCase() || '';
    // Special cases for domains with 'co' or 'com'
    const code = domain.includes('co.uk') ? 'GB' :
                domain.includes('com') ? (domain.includes('.com.') ? domain.split('.')[2].toUpperCase() : 'US') :
                countryCode;
    
    return {
        code,
        name: info.name, // Use country name instead of region
        flag: `${code.toLowerCase()}.png`,
        domain
    };
});

// Currency options with symbols - only used currencies
const currencies = [
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'PLN', symbol: 'zł' },
    { code: 'SEK', symbol: 'kr' }
];

// Languages from our marketplaces only
const languages = {
    en: 'English',    // UK
    nl: 'Nederlands', // Netherlands, Belgium
    fr: 'Français',   // France, Belgium
    de: 'Deutsch',    // Germany
    it: 'Italiano',   // Italy
    pl: 'Polski',     // Poland
    es: 'Español',    // Spain
    sv: 'Svenska'     // Sweden
};

export const Sidepanel: React.FC = () => {
    const { t } = useTranslation();
    const { selectedMarketplaces, toggleMarketplace, loadMarketplaces } = useMarketplaceStore();
    const { theme, loadTheme } = useThemeStore();
    const { language, loadLanguage } = useLanguageStore();
    const { 
        priceComparisonEnabled,
        shippingCalculationEnabled,
        flagDisplayEnabled,
        priceIndicatorEnabled,
        currencyCode,
        setSettings,
        loadSettings
    } = useSettingsStore();

    // Load all settings on mount
    useEffect(() => {
        loadSettings();
        loadTheme();
        loadLanguage();
        loadMarketplaces();
    }, [loadSettings, loadTheme, loadLanguage, loadMarketplaces]);

    const handleSettingChange = (setting: string, value: boolean | string) => {
        setSettings({ [setting]: value });
    };

    const isCountryEnabled = (domain: string) => selectedMarketplaces.includes(domain);

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = event.target.value;
        chrome.storage.local.set({ language: newLang });
    };

    return (
        <div className="sidepanel" data-theme={theme}>
            <header className="sidepanel-header">
                <div className="header-content">
                    <button 
                        className={`power-button ${priceComparisonEnabled ? 'on' : 'off'}`}
                        onClick={() => {
                            handleSettingChange('priceComparisonEnabled', !priceComparisonEnabled);
                            // Send message to background script to update display
                            chrome.runtime.sendMessage({
                                type: 'UPDATE_PRICE_COMPARISON',
                                enabled: !priceComparisonEnabled
                            });
                        }}
                        aria-label={priceComparisonEnabled ? 'Turn Off' : 'Turn On'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                            <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                    </button>
                    <h1 className="sidepanel-title">{t('settings.title')}</h1>
                    <button 
                        className={`theme-toggle ${theme}-mode`}
                        onClick={() => {
                            const newTheme = theme === 'dark' ? 'light' : 'dark';
                            chrome.storage.local.set({ theme: newTheme });
                        }}
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/>
                            <line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/>
                            <line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                        <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    </button>
                </div>
            </header>
            
            <main className="sidepanel-content">
                {/* Language Selection - First for accessibility */}
                <section className="settings-section">
                    <h2 className="settings-section-title">{t('settings.language.title')}</h2>
                    <div className="language-selector">
                        <select 
                            value={language} 
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
                </section>

                {/* Display Settings */}
                <section className="settings-section">
                    <h2 className="settings-section-title">{t('settings.display.title')}</h2>
                    <div className="display-settings">
                        <div className="setting-item">
                            <span className="setting-label">{t('settings.display.shipping')}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={shippingCalculationEnabled}
                                    onChange={(e) => handleSettingChange('shippingCalculationEnabled', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <span className="setting-label">{t('settings.display.flags')}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={flagDisplayEnabled}
                                    onChange={(e) => handleSettingChange('flagDisplayEnabled', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <span className="setting-label">{t('settings.display.savings')}</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={priceIndicatorEnabled}
                                    onChange={(e) => handleSettingChange('priceIndicatorEnabled', e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Currency Selection */}
                <section className="settings-section">
                    <h2 className="settings-section-title">{t('settings.currency.title')}</h2>
                    <div className="currency-selector">
                        <select
                            className="currency-select"
                            value={currencyCode}
                            onChange={(e) => handleSettingChange('currencyCode', e.target.value)}
                        >
                            {currencies.map(({ code, symbol }) => (
                                <option key={code} value={code}>
                                    {`${code}                ${symbol}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Country Selection */}
                <section className="settings-section">
                    <h2 className="settings-section-title">{t('settings.regions.title')}</h2>
                    <div className="country-list">
                        {countries.map(country => (
                            <div key={country.code} className="country-item">
                                <img
                                    src={`assets/flags/${country.flag}`}
                                    alt={`${t(`countries.${country.name}`)} flag`}
                                    className="country-flag"
                                />
                                <span className="country-name">{t(`countries.${country.name}`)}</span>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={isCountryEnabled(country.domain)}
                                        onChange={() => toggleMarketplace(country.domain)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
