export interface MarketplacePrice {
  marketplace: string;
  price: number;
  shipping: number | null;
  currency: string;
  available: boolean;
  affiliateLink: string;
  originalPrice: number;
  originalShipping: number | null;
  originalCurrency: string;
}

export interface AmazonMarketplace {
  domain: string;
  currency: string;
  region: string;
  name: string;
}
