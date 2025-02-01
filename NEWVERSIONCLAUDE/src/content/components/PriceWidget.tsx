import React, { useEffect, useState } from 'react';
import { AmazonProduct, ComparisonResult } from '../../types';
import './PriceWidget.css';

const FLAGS: { [key: string]: string } = {
  'Amazon US': '',
  'Amazon UK': '',
  'Amazon DE': '',
  'Amazon FR': '',
  'Amazon IT': '',
  'Amazon ES': '',
  'Amazon NL': '',
  'Amazon SE': '',
  'Amazon PL': '',
  'Amazon JP': '',
  'Amazon CA': '',
  'Amazon AU': '',
};

interface PriceWidgetProps {
  product: AmazonProduct;
}

export const PriceWidget: React.FC<PriceWidgetProps> = ({ product }) => {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const calculateSavings = (originalPrice: number, alternativePrice: number) => {
    const savings = originalPrice - alternativePrice;
    const percentage = (savings / originalPrice) * 100;
    return {
      amount: Math.abs(savings),
      percentage: Math.abs(percentage),
      isLower: savings > 0
    };
  };

  return (
    <div className="quick-saver-widget">
      <div className="widget-header">
        <h3>Alternative Prices</h3>
      </div>

      <div className="price-list">
        {comparison.alternatives
          .sort((a, b) => a.convertedPrice - b.convertedPrice)
          .map((alt) => {
            const savings = calculateSavings(product.currentPrice, alt.convertedPrice);
            const flag = FLAGS[alt.marketplace] || '';
            
            return (
              <a
                key={alt.marketplace}
                href={alt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="price-item"
              >
                <span className="marketplace">
                  <span className="flag">{flag}</span>
                  {alt.marketplace}
                </span>
                <div className="price-info">
                  <span className="price">{formatPrice(alt.convertedPrice, product.currency)}</span>
                  {savings.isLower && (
                    <span className="savings">
                      Save {savings.percentage.toFixed(0)}%
                    </span>
                  )}
                  {!savings.isLower && (
                    <span className="savings higher-price">
                      +{savings.percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </a>
            );
          })}
      </div>

      <div className="widget-footer">
        Prices include currency conversion
      </div>
    </div>
  );
};
