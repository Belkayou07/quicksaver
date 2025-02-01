import { AmazonProduct } from '../types';
import { MARKETPLACES } from '../config/marketplaces';

export class ProductExtractor {
  private static readonly asinRegex = /\/([A-Z0-9]{10})(?:[\/?]|$)/;
  private static readonly priceSelectors = [
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price',
    '.a-color-price',
    'span[data-a-color="price"]'
  ];

  private static getCurrentMarketplace(): string | null {
    const hostname = window.location.hostname;
    const marketplaceDomain = hostname.replace('www.', '');
    
    // Validate that this is a known marketplace
    if (!MARKETPLACES[marketplaceDomain]) {
      console.error('Unknown marketplace:', marketplaceDomain);
      return null;
    }

    return marketplaceDomain;
  }

  private static extractASIN(): string | null {
    const matches = window.location.pathname.match(this.asinRegex);
    if (!matches) {
      console.error('Could not extract ASIN from URL:', window.location.pathname);
      return null;
    }
    return matches[1];
  }

  static extractPrice(priceElement: Element | null): number | undefined {
    if (!priceElement) {
      console.error('No price element found');
      return undefined;
    }

    const priceText = priceElement.textContent;
    if (!priceText) {
      console.error('Price element has no text content');
      return undefined;
    }

    // Remove currency symbols and non-numeric characters except . and ,
    const cleanPrice = priceText.replace(/[^0-9,\.]/g, '');
    
    // Handle different price formats
    const price = cleanPrice.includes(',') 
      ? parseFloat(cleanPrice.replace('.', '').replace(',', '.'))
      : parseFloat(cleanPrice);

    if (isNaN(price)) {
      console.error('Could not parse price from:', priceText);
      return undefined;
    }

    return price;
  }

  // New method to extract initial info before page load
  static extractInitialInfo(): Pick<AmazonProduct, 'asin' | 'marketplace' | 'url'> | null {
    console.log('Extracting initial product info...');
    
    const marketplace = this.getCurrentMarketplace();
    if (!marketplace) return null;

    const asin = this.extractASIN();
    if (!asin) return null;

    const marketplaceInfo = MARKETPLACES[marketplace];
    if (!marketplaceInfo) return null;

    return {
      asin,
      marketplace,
      url: window.location.href
    };
  }

  // Try to find price using multiple strategies
  private static findPriceElement(): Element | null {
    for (const selector of this.priceSelectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    // Try data attributes that might contain price
    const priceAttrs = ['data-price', 'data-deal-price', 'data-sale-price'];
    for (const attr of priceAttrs) {
      const element = document.querySelector(`[${attr}]`);
      if (element) return element;
    }

    return null;
  }

  static extractProductInfo(): AmazonProduct | null {
    console.log('Extracting complete product info...');
    
    const marketplace = this.getCurrentMarketplace();
    if (!marketplace) return null;

    const asin = this.extractASIN();
    if (!asin) return null;

    const marketplaceInfo = MARKETPLACES[marketplace];

    // Try to find price using multiple strategies
    const priceElement = this.findPriceElement();
    const titleElement = document.querySelector('#productTitle');
    const price = this.extractPrice(priceElement);

    if (!price) {
      console.error('Could not extract price');
      return null;
    }

    if (!titleElement?.textContent) {
      console.error('Could not extract title');
      return null;
    }

    const product = {
      asin,
      title: titleElement.textContent.trim(),
      currentPrice: price,
      currency: marketplaceInfo.currency,
      marketplace: marketplace,
      url: window.location.href
    };

    console.log('Successfully extracted product:', product);
    return product;
  }
}
