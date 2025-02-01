import { AmazonProduct } from '../types';
import { MARKETPLACES } from '../config/marketplaces';
import { CurrencyConverter } from './currencyConverter';

export interface ComparisonResult {
  original: AmazonProduct;
  alternatives: (AmazonProduct & { convertedPrice: number })[];
  bestPrice: (AmazonProduct & { convertedPrice: number }) | null;
  priceDifference: number;
  lastUpdated: number;
}

export class PriceComparisonService {
  private static readonly TIMEOUT = 8000; // 8 seconds
  private static readonly RETRY_DELAY = 1000; // 1 second
  private static readonly MAX_RETRIES = 1; // Reduced retries for faster response
  private static readonly CACHE_DURATION = 1800000; // 30 minutes
  private cache: Map<string, { data: AmazonProduct; timestamp: number }> = new Map();
  private currencyConverter: CurrencyConverter;
  private pricePatterns: RegExp[] = [
    /"price":\s*"?(\d+[.,]\d{2})"?/,
    /"priceAmount":\s*"?(\d+[.,]\d{2})"?/,
    /"priceTotal":\s*\{\s*"text":\s*"[^"]*?(\d+[.,]\d{2})"?/,
    /data-price="(\d+[.,]\d{2})"/,
    /data-a-price-whole[^>]+>(\d+)<[^>]+>([.,]\d{2})</,
  ];

  constructor() {
    this.currencyConverter = CurrencyConverter.getInstance();
  }

  async comparePrice(product: AmazonProduct): Promise<ComparisonResult> {
    console.log('Starting price comparison for product:', product);
    const marketplaces = Object.keys(MARKETPLACES).filter(m => m !== product.marketplace);
    
    // Start all requests in parallel immediately
    const promises = marketplaces.map(marketplace => {
      const cacheKey = `${product.asin}-${marketplace}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < PriceComparisonService.CACHE_DURATION) {
        console.log('Using cached data for', marketplace);
        return Promise.resolve(cached.data);
      }
      
      return this.fetchWithRetry(product.asin, marketplace);
    });

    // Wait for all results with a timeout
    const results = await Promise.all(
      promises.map(p => 
        Promise.race([
          p,
          new Promise<null>(resolve => 
            setTimeout(() => resolve(null), PriceComparisonService.TIMEOUT)
          )
        ])
      )
    );

    const validResults = results.filter((r): r is AmazonProduct => r !== null);
    console.log('Valid results:', validResults.length);

    // Convert prices in parallel
    const convertedResults = await Promise.all(
      validResults.map(async result => ({
        ...result,
        convertedPrice: await this.currencyConverter.convert(
          result.currentPrice,
          result.currency,
          product.currency
        )
      }))
    );

    // Sort results by price
    const sortedResults = convertedResults.sort((a, b) => 
      (a.convertedPrice || Infinity) - (b.convertedPrice || Infinity)
    );

    const bestPrice = sortedResults[0];
    const priceDifference = bestPrice
      ? product.currentPrice - bestPrice.convertedPrice
      : 0;

    const comparison = {
      original: product,
      alternatives: sortedResults,
      bestPrice: bestPrice || null,
      priceDifference,
      lastUpdated: Date.now()
    };

    return comparison;
  }

  private async fetchWithRetry(asin: string, marketplace: string, retryCount = 0): Promise<AmazonProduct | null> {
    try {
      const result = await this.fetchFromMarketplace(asin, marketplace);

      if (!result && retryCount < PriceComparisonService.MAX_RETRIES) {
        console.log(`Retrying ${marketplace}, attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, PriceComparisonService.RETRY_DELAY));
        return this.fetchWithRetry(asin, marketplace, retryCount + 1);
      }

      if (result) {
        const cacheKey = `${asin}-${marketplace}`;
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
        console.log('Fetched and cached data for', marketplace);
      }

      return result;
    } catch (error) {
      console.error(`Error in fetchWithRetry for ${marketplace}:`, error);
      return null;
    }
  }

  async fetchFromMarketplace(asin: string, marketplace: string): Promise<AmazonProduct | null> {
    try {
      const marketplaceInfo = MARKETPLACES[marketplace];
      const url = `https://www.${marketplace}/dp/${asin}`;
      
      console.log('Fetching from marketplace:', marketplace, url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'Accept-Language': marketplaceInfo.language,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        credentials: 'omit'
      });

      if (!response.ok) {
        console.log('Failed to fetch from', marketplace, response.status);
        return null;
      }

      const text = await response.text();
      
      let price: number | null = null;
      for (const pattern of this.pricePatterns) {
        const match = text.match(pattern);
        if (match) {
          if (match.length === 3) { // Whole + decimal parts
            price = parseFloat(`${match[1]}.${match[2].replace(',', '.')}`);
          } else {
            price = parseFloat(match[1].replace(',', '.'));
          }
          break;
        }
      }

      if (!price) {
        console.log('No price found for', marketplace);
        return null;
      }

      const titlePattern = /"product-title"[^>]*>([^<]+)<|productTitle"[^>]*>([^<]+)</;
      const titleMatch = text.match(titlePattern);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '';

      const product = {
        asin,
        title,
        currentPrice: price,
        currency: marketplaceInfo.currency,
        marketplace,
        url
      };

      console.log('Successfully extracted product from', marketplace, product);
      return product;

    } catch (error) {
      console.error(`Error fetching from ${marketplace}:`, error);
      return null;
    }
  }
}
