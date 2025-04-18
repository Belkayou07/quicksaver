import React, { useEffect, useState, useRef } from 'react';
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

// Currency symbols
const currencySymbols: Record<string, string> = {
  EUR: '€',
  GBP: '£',
  PLN: 'zł',
  SEK: 'kr'
};

// Define responsive breakpoints
const BREAKPOINTS = {
  // Scenario 1: Shipping ON, Savings ON
  SHIPPING_ON_SAVINGS_ON: {
    SHIPPING_HIDDEN: 500,
    PRODUCT_PRICE_HIDDEN: 440,
    SAVINGS_HIDDEN: 380
  },
  // Scenario 2: Shipping ON, Savings OFF
  SHIPPING_ON_SAVINGS_OFF: {
    SHIPPING_HIDDEN: 440,
    PRODUCT_PRICE_HIDDEN: 380
  },
  // Scenario 3: Shipping OFF, Savings ON
  SHIPPING_OFF_SAVINGS_ON: {
    LAYOUT_COMPACT: 420,
    SAVINGS_HIDDEN: 360
  },
  // Scenario 4: Shipping OFF, Savings OFF 
  SHIPPING_OFF_SAVINGS_OFF: {
    SUPER_COMPACT: 340
  }
};

export const PriceComparison: React.FC<PriceComparisonProps> = ({ prices }) => {
  const { t } = useTranslation();
  const { theme, loadTheme } = useThemeStore();
  const { loadLanguage } = useLanguageStore();
  const { 
    priceComparisonEnabled, 
    shippingCalculationEnabled,
    flagDisplayEnabled,
    priceIndicatorEnabled,
    initialized, 
    loadSettings, 
    currencyCode 
  } = useSettingsStore();
  const { selectedMarketplaces } = useMarketplaceStore();
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [responsiveState, setResponsiveState] = useState({
    hideShipping: false,
    hideProductPrice: false,
    hideSavings: false,
    compactLayout: false,
    superCompact: false
  });
  const compRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Load all settings on mount
    loadSettings();
    loadTheme();
    loadLanguage();

    // Check for responsive breakpoints based on active scenario
    const checkContainerWidth = () => {
      const container = document.getElementById('quick-saver-price-comparison');
      if (!container) return;

      const width = container.offsetWidth;
      console.log(`[Quick-Saver] Container width: ${width}px`);
      
      // Determine active scenario
      const activeScenario = 
        shippingCalculationEnabled && priceIndicatorEnabled ? 'SHIPPING_ON_SAVINGS_ON' :
        shippingCalculationEnabled && !priceIndicatorEnabled ? 'SHIPPING_ON_SAVINGS_OFF' :
        !shippingCalculationEnabled && priceIndicatorEnabled ? 'SHIPPING_OFF_SAVINGS_ON' :
        'SHIPPING_OFF_SAVINGS_OFF';
        
      console.log(`[Quick-Saver] Active scenario: ${activeScenario}`);
        
      // Apply responsive state based on active scenario and width
      switch(activeScenario) {
        case 'SHIPPING_ON_SAVINGS_ON':
          setResponsiveState({
            hideShipping: width < BREAKPOINTS.SHIPPING_ON_SAVINGS_ON.SHIPPING_HIDDEN,
            hideProductPrice: width < BREAKPOINTS.SHIPPING_ON_SAVINGS_ON.PRODUCT_PRICE_HIDDEN,
            hideSavings: width < BREAKPOINTS.SHIPPING_ON_SAVINGS_ON.SAVINGS_HIDDEN,
            compactLayout: false,
            superCompact: false
          });
          break;
        
        case 'SHIPPING_ON_SAVINGS_OFF':
          setResponsiveState({
            hideShipping: width < BREAKPOINTS.SHIPPING_ON_SAVINGS_OFF.SHIPPING_HIDDEN,
            hideProductPrice: width < BREAKPOINTS.SHIPPING_ON_SAVINGS_OFF.PRODUCT_PRICE_HIDDEN,
            hideSavings: true, // Always hidden in this scenario
            compactLayout: false,
            superCompact: false
          });
          break;
          
        case 'SHIPPING_OFF_SAVINGS_ON':
          setResponsiveState({
            hideShipping: true, // Always hidden in this scenario
            hideProductPrice: false, // Always visible in this scenario
            hideSavings: width < BREAKPOINTS.SHIPPING_OFF_SAVINGS_ON.SAVINGS_HIDDEN,
            compactLayout: width < BREAKPOINTS.SHIPPING_OFF_SAVINGS_ON.LAYOUT_COMPACT,
            superCompact: false
          });
          break;
          
        case 'SHIPPING_OFF_SAVINGS_OFF':
          setResponsiveState({
            hideShipping: true, // Always hidden in this scenario
            hideProductPrice: false, // Always visible in this scenario
            hideSavings: true, // Always hidden in this scenario
            compactLayout: false,
            superCompact: width < BREAKPOINTS.SHIPPING_OFF_SAVINGS_OFF.SUPER_COMPACT
          });
          break;
      }
    };

    // Check initially
    checkContainerWidth();
    
    // And check on resize
    window.addEventListener('resize', checkContainerWidth);

    // Fetch exchange rates
    const fetchRates = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'FETCH_EXCHANGE_RATES',
          url: 'https://api.exchangerate.fun/latest?base=EUR'
        });
        
        if (response && response.rates) {
          setExchangeRates(response.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      }
    };

    fetchRates();

    return () => {
      window.removeEventListener('resize', checkContainerWidth);
    };
  }, [loadSettings, loadTheme, loadLanguage, shippingCalculationEnabled, priceIndicatorEnabled]);

  // Don't render until we've loaded the initial state
  if (!initialized) return null;
  
  // Don't render if price comparison is disabled
  if (!priceComparisonEnabled) return null;

  const currentMarketplace = window.location.hostname.replace('www.', '');
  const currentPrice = prices.find(p => p.marketplace === currentMarketplace);
  // Define base price and shipping separately
  const baseProductPrice = currentPrice ? currentPrice.originalPrice : 0;
  const baseShippingPrice = currentPrice && currentPrice.originalShipping !== null ? currentPrice.originalShipping : 0;
  // Total price is only used when shipping calculation is enabled
  const baseTotalPrice = baseProductPrice + baseShippingPrice;
  const baseCurrency = currentPrice ? currentPrice.originalCurrency : 'EUR';

  // Convert price from any currency to selected currency
  const convertPrice = (price: number, fromCurrency: string): number => {
    if (fromCurrency === currencyCode) return price;
    
    const fromRate = exchangeRates[fromCurrency] || 1;
    const toRate = exchangeRates[currencyCode] || 1;
    
    // Convert through EUR as base currency
    const priceInEUR = price / fromRate;
    return priceInEUR * toRate;
  };

  // Format a price with the selected currency symbol
  const formatPrice = (price: number): string => {
    const formatted = price.toFixed(2);
    const symbol = currencySymbols[currencyCode] || '€';
    return `${formatted} ${symbol}`;
  };

  const calculatePriceDifference = (itemPrice: number, itemShipping: number | null, currency: string): string => {
    // If there's no base price to compare with, return N/A
    if (!baseProductPrice) return 'N/A';
    
    // Helper function to format the percentage difference
    const formatPercentageDiff = (diff: number): string => {
    if (diff === 0) return '0%';
    return diff > 0 ? `+${diff.toFixed(0)}%` : `-${Math.abs(diff).toFixed(0)}%`;
    };
    
    // When shipping calculation is enabled, compare total prices (product + shipping)
    // When shipping calculation is disabled, compare only product prices
    let baseForComparison: number;
    let itemForComparison: number;
    
    if (shippingCalculationEnabled) {
      // Total price comparison (product + shipping)
      baseForComparison = baseTotalPrice; // Current marketplace price + shipping
      itemForComparison = itemPrice + (itemShipping || 0); // Alternative marketplace price + shipping
      console.log(`[PRICE-DIFF] Shipping ON: Comparing total prices ${baseForComparison} vs ${itemForComparison}`);
    } else {
      // Product price comparison only (no shipping)
      baseForComparison = baseProductPrice; // Current marketplace product price only
      itemForComparison = itemPrice; // Alternative marketplace product price only
      console.log(`[PRICE-DIFF] Shipping OFF: Comparing product prices ${baseProductPrice} vs ${itemPrice}`);
    }
    
    // Convert everything to the selected currency
    const convertedBasePrice = convertPrice(baseForComparison, baseCurrency);
    const convertedItemPrice = convertPrice(itemForComparison, currency);
    
    // Calculate percentage difference
    const diff = ((convertedItemPrice - convertedBasePrice) / convertedBasePrice) * 100;
    
    console.log(`[PRICE-DIFF] Base Price: ${convertedBasePrice} ${currencyCode}, Item Price: ${convertedItemPrice} ${currencyCode}, Diff: ${diff.toFixed(2)}%`);
    
    return formatPercentageDiff(diff);
  };

  const getPriceState = (difference: string): 'lower' | 'higher' | 'same' => {
    if (difference.startsWith('-')) return 'lower';
    if (difference === '0%') return 'same';
    return 'higher';
  };

  const getFlagUrl = (countryCode: string): string => {
    return chrome.runtime.getURL(`assets/flags/${countryCode.toLowerCase()}.png`);
  };

  const openSettings = () => {
    // Send message to background script to handle popup
    console.log('Opening settings popup via CLICK_EXTENSION message');
    chrome.runtime.sendMessage({ type: 'CLICK_EXTENSION' })
      .then(response => {
        console.log('Response from CLICK_EXTENSION message:', response);
      })
      .catch(error => {
        console.error('Error sending CLICK_EXTENSION message:', error);
      });
  };

  const renderPriceItem = (price: MarketplacePrice, index: number) => {
    // Calculate difference based on our conditional logic
    const difference = calculatePriceDifference(
      price.originalPrice, 
      price.originalShipping, 
      price.originalCurrency
    );
    const priceState = getPriceState(difference);
    const countryCode = marketplaceToCountry[price.marketplace];

    // Convert prices to the selected currency
    const convertedPrice = convertPrice(price.originalPrice, price.originalCurrency);
    const convertedShipping = price.originalShipping !== null ? 
      convertPrice(price.originalShipping, price.originalCurrency) : 
      0;
    const convertedTotal = convertedPrice + convertedShipping;

    // Add specific class when we have shipping
    const hasShipping = price.originalShipping !== null && price.originalShipping !== 0;
    const priceItemClass = `price-item ${hasShipping ? 'has-shipping' : ''} ${priceState}`;

    // Check if the tooltip should be shown based on our responsive state
    const shouldShowTooltip = responsiveState.hideShipping || 
                             responsiveState.hideProductPrice || 
                             responsiveState.hideSavings ||
                             responsiveState.compactLayout ||
                             responsiveState.superCompact;

    return (
      <a 
        key={index} 
        href={price.affiliateLink}
        className={priceItemClass}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="marketplace">
          {flagDisplayEnabled && (
            <img src={getFlagUrl(countryCode)} alt={countryCode} className="flag" />
          )}
          <span className="country-code">{countryCode}</span>
        </div>
        <div className="price-details">
          {shippingCalculationEnabled ? (
            <>
              <span className="base-price">{formatPrice(convertedPrice)}</span>
              <span className="shipping">+</span>
              <span className="shipping-value" data-total={formatPrice(convertedTotal)}>
                {hasShipping ? formatPrice(convertedShipping) : t('common.freeShipping')}
              </span>
              <span className="equals">≈</span>
              <span className="total">{formatPrice(convertedTotal)}</span>
            </>
          ) : (
            <span className="base-price">{formatPrice(convertedPrice)}</span>
          )}
        </div>
        {priceIndicatorEnabled && (
          <div className={`difference ${priceState}`}>
            {difference}
          </div>
        )}
        
        {/* Tooltip with only hidden information - shown on hover when elements are hidden */}
        {shouldShowTooltip && (
          <div className="tooltip">
            {/* Always show marketplace in tooltip for context */}
            <div className="tooltip-marketplace">
              <img src={getFlagUrl(countryCode)} alt={countryCode} className="tooltip-flag" />
              <span>{countryCode}</span>
            </div>
            
            {/* Always show base price */}
            <div className="tooltip-row">
              <span className="tooltip-label">{t('priceComparison.headers.price')}</span>
              <span className="tooltip-value">{formatPrice(convertedPrice)}</span>
            </div>
            
            {/* Only show shipping if shipping calculation is enabled */}
            {shippingCalculationEnabled && (
              <div className="tooltip-row">
                <span className="tooltip-label">{t('priceComparison.headers.shipping')}</span>
                <span className="tooltip-value">
                  {hasShipping ? formatPrice(convertedShipping) : t('common.freeShipping')}
                </span>
              </div>
            )}
            
            {/* Only show total if shipping calculation is enabled */}
            {shippingCalculationEnabled && (
              <div className="tooltip-row tooltip-total">
                <span className="tooltip-label">{t('priceComparison.headers.total')}</span>
                <span className="tooltip-value">{formatPrice(convertedTotal)}</span>
              </div>
            )}
            
            {/* Only show savings if price indicator is enabled */}
            {priceIndicatorEnabled && (
              <div className={`tooltip-row tooltip-savings ${priceState}`}>
                <span className="tooltip-value">{difference}</span>
              </div>
            )}
          </div>
        )}
      </a>
    );
  };

  return (
    <div ref={compRef} className={`price-comparison ${theme} 
      ${responsiveState.hideShipping ? 'hide-shipping' : ''} 
      ${responsiveState.hideProductPrice ? 'hide-product-price' : ''} 
      ${responsiveState.hideSavings ? 'hide-savings' : ''}
      ${responsiveState.compactLayout ? 'compact-layout' : ''}
      ${responsiveState.superCompact ? 'super-compact' : ''}`}>
      <div className="price-comparison-header">
        <h3>{t('priceComparison.title')}</h3>
        <div className="header-controls">
          <button 
            className="settings-toggle" 
            onClick={openSettings}
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
        {/* Filter prices to display */}
        {(() => {
          const filteredPrices = prices.filter(price => 
            price.originalPrice && 
            typeof price.originalShipping === 'number' && 
            price.marketplace !== currentMarketplace &&
            selectedMarketplaces.includes(price.marketplace)
          );

          // If no alternatives found, show a message
          if (filteredPrices.length === 0) {
            return (
              <div className="no-alternatives">
                <div className="no-alternatives-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>{t('priceComparison.noAlternatives')}</p>
                </div>
              </div>
            );
          }

          // Otherwise, show the regular price comparison table with headers
          return (
            <>
              {/* Add column headers */}
              <div className="price-column-headers">
                <div className="column-header-marketplace">
                  {t('priceComparison.headers.marketplace')}
                </div>
                <div className="column-header-price-details">
                  <span className="column-header-base-price">
                    {t('priceComparison.headers.price')}
                  </span>
                  {shippingCalculationEnabled && (
                    <>
                      <span className="column-header-shipping">+</span>
                      <span className="column-header-shipping-value">
                        {t('priceComparison.headers.shipping')}
                      </span>
                      <span className="column-header-equals">=</span>
                      <span className="column-header-total">
                        {t('priceComparison.headers.total')}
                      </span>
                    </>
                  )}
                </div>
                {priceIndicatorEnabled && (
                  <div className="column-header-difference">
                    {shippingCalculationEnabled 
                      ? t('priceComparison.headers.totalDiff') 
                      : t('priceComparison.headers.priceDiff')}
                  </div>
                )}
              </div>
              <div className="price-list">
                {filteredPrices.map((price, index) => renderPriceItem(price, index))}
              </div>
            </>
          );
        })()}
      </div>
      <div className="footer-note">
        {(() => {
          // Create a dynamic footer based on enabled settings
          const footerParts = [];
          
          // If shipping calculations are enabled
          if (shippingCalculationEnabled) {
            footerParts.push(t('priceComparison.footer.shipping'));
          }
          
          // Always mention currency conversion since prices are always converted
          footerParts.push(t('priceComparison.footer.currency'));
          
          // If price indicator is enabled
          if (priceIndicatorEnabled) {
            // Use different savings text based on shipping calculation setting
            const savingsKey = shippingCalculationEnabled 
              ? 'priceComparison.footer.savingsWithShipping'
              : 'priceComparison.footer.savingsNoShipping';
            footerParts.push(t(savingsKey));
          }
          
          // If we have multiple parts, join them with commas and "and"
          if (footerParts.length > 1) {
            const lastPart = footerParts.pop();
            return t('priceComparison.footer.template', {
              parts: footerParts.join(', '),
              last: lastPart
            });
          } else if (footerParts.length === 1) {
            // If we only have one part, use it directly
            return footerParts[0];
          } else {
            // Fallback, though this should never happen
            return t('priceComparison.footer.default');
          }
        })()}
      </div>
    </div>
  );
};

export default PriceComparison;
