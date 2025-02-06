import React, { useEffect, useState } from 'react';
import { AmazonProduct, ComparisonResult } from '../../types';
import { useThemeStore } from '../../store/themeStore';
import * as flags from 'country-flag-icons/react/3x2';
import './PriceWidget.css';

const DOMAIN_TO_COUNTRY: { [key: string]: { code: string } } = {
  'amazon.de': { code: 'DE' },
  'amazon.co.uk': { code: 'GB' },
  'amazon.com': { code: 'US' },
  'amazon.fr': { code: 'FR' },
  'amazon.it': { code: 'IT' },
  'amazon.es': { code: 'ES' },
  'amazon.nl': { code: 'NL' },
  'amazon.se': { code: 'SE' },
  'amazon.pl': { code: 'PL' },
  'amazon.co.jp': { code: 'JP' },
  'amazon.ca': { code: 'CA' },
  'amazon.com.au': { code: 'AU' },
  'amazon.com.be': { code: 'BE' },
  'amazon.com.br': { code: 'BR' },
  'amazon.cn': { code: 'CN' },
  'amazon.eg': { code: 'EG' },
  'amazon.in': { code: 'IN' },
  'amazon.com.mx': { code: 'MX' },
  'amazon.sa': { code: 'SA' },
  'amazon.sg': { code: 'SG' },
  'amazon.com.tr': { code: 'TR' },
  'amazon.ae': { code: 'AE' },
};

interface PriceWidgetProps {
  product: AmazonProduct;
}

export const PriceWidget: React.FC<PriceWidgetProps> = ({ product }) => {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useThemeStore();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: 'COMPARE_PRICES',
          payload: product
        });

        if (!response || !response.alternatives) {
          throw new Error('Invalid response from background script');
        }

        setComparison(response);
      } catch (err) {
        console.error('Error fetching prices:', err);
        setError('Could not fetch prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [product]);

  if (loading) {
    return (
      <div className="quick-saver-widget loading">
        <div className="loading-spinner" />
        Checking prices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="quick-saver-widget error">
        {error}
      </div>
    );
  }

  if (!comparison || comparison.alternatives.length === 0) {
    return (
      <div className="quick-saver-widget no-results">
        No alternative prices found
      </div>
    );
  }

  const calculateTotalPrice = (price: number, shippingCost: number | undefined): number => {
    return price + (shippingCost ?? 0);
  };

  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPriceSimple = (price: number, currency: string): string => {
    const formatted = formatPrice(price, currency);
    return formatted.replace(currency === 'EUR' ? '€' : '$', '').trim() + (currency === 'EUR' ? ' €' : ' $');
  };

  const calculateSavings = (
    originalPrice: number, 
    alternativePrice: number, 
    originalShipping: number | undefined, 
    alternativeShipping: number | undefined
  ): { amount: number; percentage: number; isLower: boolean } => {
    const originalTotal = calculateTotalPrice(originalPrice, originalShipping);
    const alternativeTotal = calculateTotalPrice(alternativePrice, alternativeShipping);
    const savings = originalTotal - alternativeTotal;
    const percentage = (savings / originalTotal) * 100;
    return {
      amount: Math.abs(savings),
      percentage: Math.abs(percentage),
      isLower: savings > 0
    };
  };

  const getMarketplaceInfo = (marketplace: string) => {
    const info = DOMAIN_TO_COUNTRY[marketplace] || { code: 'XX' };
    const FlagComponent = (flags as any)[info.code] || null;
    return {
      FlagComponent,
      code: info.code
    };
  };

  return (
    <div className="quick-saver-widget" data-theme={theme}>
      <div className="widget-header">
        <h3>Alternative Prices</h3>
      </div>

      <div className="price-list">
        {comparison.alternatives
          .sort((a, b) => 
            calculateTotalPrice(a.convertedPrice, a.shippingCost ?? 0) - 
            calculateTotalPrice(b.convertedPrice, b.shippingCost ?? 0)
          )
          .map((alt) => {
            const savings = calculateSavings(
              product.currentPrice,
              alt.convertedPrice,
              product.shippingCost ?? 0,
              alt.shippingCost ?? 0
            );
            const { FlagComponent, code } = getMarketplaceInfo(alt.marketplace);
            
            const priceType = savings.isLower 
              ? "positive"
              : savings.percentage === 0 
                ? "neutral"
                : "negative";
            
            const totalPrice = calculateTotalPrice(alt.convertedPrice, alt.shippingCost ?? 0);
            
            return (
              <a
                key={alt.marketplace}
                href={alt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="price-item"
                data-price-type={priceType}
              >
                <div className="price-info">
                  <span className="marketplace">
                    {FlagComponent && (
                      <span className="flag">
                        <FlagComponent style={{ width: '1.2em', height: '0.9em' }} />
                      </span>
                    )}
                    <span className="country-code">{code}</span>
                  </span>
                  <span className="price">
                    {formatPriceSimple(alt.convertedPrice, product.currency)}
                  </span>
                  <span className="shipping-cost">
                    {(alt.shippingCost ?? 0) === 0 
                      ? "+ Free"
                      : `+ ${formatPriceSimple(alt.shippingCost ?? 0, product.currency)}`
                    }
                  </span>
                  <span className="total-price">
                    = {formatPriceSimple(totalPrice, product.currency)}
                  </span>
                  {savings.isLower && (
                    <span className="savings">
                      Save {savings.percentage.toFixed(0)}%
                    </span>
                  )}
                  {!savings.isLower && savings.percentage > 0 && (
                    <span className="savings higher-price">
                      +{savings.percentage.toFixed(0)}%
                    </span>
                  )}
                  {savings.percentage === 0 && (
                    <span className="savings">
                      Same
                    </span>
                  )}
                </div>
              </a>
            );
          })}
      </div>

      <div className="widget-footer">
        Prices include currency conversion and shipping
      </div>
    </div>
  );
};
