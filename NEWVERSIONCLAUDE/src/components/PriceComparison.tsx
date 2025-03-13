import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MarketplacePrice } from '../types/marketplace';
import { marketplaceToCountry } from '../config/marketplaces';
import { useThemeStore } from '../store/themeStore';
import { useLanguageStore } from '../store/languageStore';
import { useSettingsStore } from '../store/settingsStore';
import { useMarketplaceStore } from '../store/marketplaceStore';

interface PriceComparisonProps {
  prices: MarketplacePrice[];
}

// Exchange rates against EUR (simplified version)
const exchangeRates: Record<string, number> = {
  EUR: 1,
  GBP: 0.85,
  PLN: 4.3,
  SEK: 11.25
};

// Currency symbols
const currencySymbols: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  PLN: 'zł',
  SEK: 'kr'
};

export const PriceComparison: React.FC<PriceComparisonProps> = ({ prices }) => {
  const { t } = useTranslation();
  const { theme, loadTheme } = useThemeStore();
  const { loadLanguage } = useLanguageStore();
  const { priceComparisonEnabled, initialized, loadSettings, currencyCode } = useSettingsStore();
  const { selectedMarketplaces } = useMarketplaceStore();
  
  useEffect(() => {
    // Load all settings on mount
    loadSettings();
    loadTheme();
    loadLanguage();
  }, [loadSettings, loadTheme, loadLanguage]);

  // Don't render until we've loaded the initial state
  if (!initialized) return null;
  
  // Don't render if price comparison is disabled
  if (!priceComparisonEnabled) return null;

  const currentMarketplace = window.location.hostname.replace('www.', '');
  const currentPrice = prices.find(p => p.marketplace === currentMarketplace);
  const basePriceEUR = currentPrice ? currentPrice.price + (currentPrice.shipping || 0) : 0;

  // Convert EUR to selected currency
  const convertPrice = (eurPrice: number): number => {
    const rate = exchangeRates[currencyCode] || 1;
    return eurPrice * rate;
  };

  // Format a price with the selected currency symbol
  const formatPrice = (price: number): string => {
    const formatted = price.toFixed(2);
    const symbol = currencySymbols[currencyCode] || '€';
    return `${formatted} ${symbol}`;
  };

  const calculatePriceDifference = (price: number): string => {
    if (!basePriceEUR) return 'N/A';
    const diff = ((price - basePriceEUR) / basePriceEUR) * 100;
    if (diff === 0) return '0%';
    return diff > 0 ? `+${diff.toFixed(0)}%` : `-${Math.abs(diff).toFixed(0)}%`;
  };

  const getPriceState = (difference: string): 'lower' | 'higher' | 'same' => {
    if (difference.startsWith('-')) return 'lower';
    if (difference === '0%') return 'same';
    return 'higher';
  };

  const getFlagUrl = (countryCode: string): string => {
    return chrome.runtime.getURL(`assets/flags/${countryCode.toLowerCase()}.png`);
  };

  const openSidepanel = () => {
    // Send message to background script to handle popup
    chrome.runtime.sendMessage({ type: 'CLICK_EXTENSION' });
  };

  return (
    <div className={`price-comparison ${theme}`}>
      <div className="price-comparison-header">
        <h3>{t('priceComparison.title')}</h3>
        <div className="header-controls">
          <button 
            className="settings-toggle" 
            onClick={openSidepanel}
            aria-label={t('common.openSettings')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className={`theme-toggle ${theme}-mode`}
            onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              chrome.storage.local.set({ theme: newTheme });
            }}
            aria-label={t('common.toggleTheme', { mode: theme === 'dark' ? 'light' : 'dark' })}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="price-comparison-content">
        {prices
          .filter(price => 
            price.price && 
            typeof price.shipping === 'number' && 
            price.marketplace !== currentMarketplace &&
            selectedMarketplaces.includes(price.marketplace) // Filter by selected marketplaces
          )
          .map((price, index) => {
            const totalPrice = price.price + (price.shipping || 0);
            const difference = calculatePriceDifference(totalPrice);
            const priceState = getPriceState(difference);
            const countryCode = marketplaceToCountry[price.marketplace];

            // Convert prices to the selected currency
            const convertedPrice = convertPrice(price.price);
            const convertedShipping = convertPrice(price.shipping || 0);
            const convertedTotal = convertedPrice + convertedShipping;

            return (
              <a 
                key={index} 
                href={price.affiliateLink}
                className={`price-item ${priceState}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="marketplace">
                  <img src={getFlagUrl(countryCode)} alt={countryCode} className="flag" />
                  <span className="country-code">{countryCode}</span>
                </div>
                <div className="price-details">
                  <span className="base-price">{formatPrice(convertedPrice)}</span>
                  <span className="shipping">+</span>
                  <span className="shipping-value" data-total={formatPrice(convertedTotal)}>
                    {price.shipping === 0 ? t('common.freeShipping') : formatPrice(convertedShipping)}
                  </span>
                  <span className="equals">≈</span>
                  <span className="total">{formatPrice(convertedTotal)}</span>
                </div>
                <div className={`difference ${priceState}`}>
                  {difference}
                </div>
              </a>
            );
          })}
      </div>
      <div className="footer-note">
        {t('priceComparison.footerNote')}
      </div>
    </div>
  );
};

export default PriceComparison;
