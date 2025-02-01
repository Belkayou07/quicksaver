export interface AmazonProduct {
  asin: string;
  title: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  marketplace: string;
  url: string;
  seller?: string;
  shippingCost?: number;
  condition?: string;
  rating?: number;
  reviewCount?: number;
  prime?: boolean;
}

export interface MarketplaceInfo {
  currency: string;
  language: string;
  region: string;
}

export interface PriceComparison {
  product: AmazonProduct;
  alternatives: AmazonProduct[];
  bestPrice: AmazonProduct;
  potentialSavings: number;
  timestamp: number;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export interface UserSettings {
  preferredCurrency: string;
  targetMarketplaces: string[];
  includeUsedProducts: boolean;
  includePrimeOnly: boolean;
  autoConvertPrices: boolean;
  showShippingCosts: boolean;
  notifyOnPriceDrops: boolean;
  priceDropThreshold: number;
}

export interface ComparisonResult {
  original: AmazonProduct;
  alternatives: (AmazonProduct & { convertedPrice: number })[];
  bestPrice: (AmazonProduct & { convertedPrice: number }) | null;
  priceDifference: number;
  lastUpdated: number;
}

export type MessageType = 
  | 'COMPARE_PRICES'
  | 'UPDATE_SETTINGS'
  | 'GET_EXCHANGE_RATES';
