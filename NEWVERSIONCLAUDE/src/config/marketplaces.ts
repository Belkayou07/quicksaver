import { AmazonMarketplace } from '../types/marketplace';

export const MARKETPLACES: { [key: string]: AmazonMarketplace } = {
  'amazon.com.be': { domain: 'amazon.com.be', currency: 'EUR', region: 'Europe', name: 'Belgium' },
  'amazon.fr': { domain: 'amazon.fr', currency: 'EUR', region: 'Europe', name: 'France' },
  'amazon.de': { domain: 'amazon.de', currency: 'EUR', region: 'Europe', name: 'Germany' },
  'amazon.it': { domain: 'amazon.it', currency: 'EUR', region: 'Europe', name: 'Italy' },
  'amazon.nl': { domain: 'amazon.nl', currency: 'EUR', region: 'Europe', name: 'Netherlands' },
  'amazon.pl': { domain: 'amazon.pl', currency: 'PLN', region: 'Europe', name: 'Poland' },
  'amazon.es': { domain: 'amazon.es', currency: 'EUR', region: 'Europe', name: 'Spain' },
  'amazon.se': { domain: 'amazon.se', currency: 'SEK', region: 'Europe', name: 'Sweden' },
  'amazon.co.uk': { domain: 'amazon.co.uk', currency: 'GBP', region: 'Europe', name: 'UK' }
};

export const marketplaceToCountry: { [key: string]: string } = {
  'amazon.com.au': 'AU',
  'amazon.com.be': 'BE',
  'amazon.com.br': 'BR',
  'amazon.ca': 'CA',
  'amazon.cn': 'CN',
  'amazon.eg': 'EG',
  'amazon.fr': 'FR',
  'amazon.de': 'DE',
  'amazon.in': 'IN',
  'amazon.it': 'IT',
  'amazon.co.jp': 'JP',
  'amazon.com.mx': 'MX',
  'amazon.nl': 'NL',
  'amazon.pl': 'PL',
  'amazon.sa': 'SA',
  'amazon.sg': 'SG',
  'amazon.es': 'ES',
  'amazon.se': 'SE',
  'amazon.ae': 'AE',
  'amazon.co.uk': 'GB',
  'amazon.com': 'US'
};
