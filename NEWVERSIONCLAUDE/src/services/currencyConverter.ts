interface ExchangeRates {
  [key: string]: number;
}

export class CurrencyConverter {
  private static instance: CurrencyConverter;
  private rates: ExchangeRates = {};
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 3600000; // 1 hour

  private constructor() {
    this.initializeDefaultRates();
  }

  public static getInstance(): CurrencyConverter {
    if (!CurrencyConverter.instance) {
      CurrencyConverter.instance = new CurrencyConverter();
    }
    return CurrencyConverter.instance;
  }

  private initializeDefaultRates() {
    // Base currency is EUR
    this.rates = {
      EUR: 1.0,
      USD: 1.09,    // US Dollar
      GBP: 0.85,    // British Pound
      JPY: 158.0,   // Japanese Yen
      AUD: 1.65,    // Australian Dollar
      CAD: 1.46,    // Canadian Dollar
      CHF: 0.93,    // Swiss Franc
      CNY: 7.82,    // Chinese Yuan
      INR: 90.5,    // Indian Rupee
      BRL: 5.35,    // Brazilian Real
      MXN: 18.5,    // Mexican Peso
      PLN: 4.33,    // Polish Złoty
      SEK: 11.3,    // Swedish Krona
      TRY: 33.2,    // Turkish Lira
      AED: 4.0,     // UAE Dirham
      SAR: 4.1,     // Saudi Riyal
      SGD: 1.46,    // Singapore Dollar
      EGP: 33.6     // Egyptian Pound
    };
  }

  private async updateRates() {
    try {
      // Check if we need to update
      const now = Date.now();
      if (now - this.lastUpdate < this.UPDATE_INTERVAL) {
        return;
      }

      // In a production environment, you would use a real exchange rate API
      // For example:
      // const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      // const data = await response.json();
      // this.rates = data.rates;

      // For now, we'll use our default rates
      this.initializeDefaultRates();
      this.lastUpdate = now;

      // Store the rates in chrome.storage for persistence
      await chrome.storage.local.set({ 
        exchangeRates: this.rates,
        lastRatesUpdate: this.lastUpdate 
      });

    } catch (error) {
      console.error('Error updating exchange rates:', error);
      // Fallback to stored rates if available
      const { exchangeRates, lastRatesUpdate } = await chrome.storage.local.get([
        'exchangeRates',
        'lastRatesUpdate'
      ]);

      if (exchangeRates) {
        this.rates = exchangeRates;
        this.lastUpdate = lastRatesUpdate;
      }
    }
  }

  public async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    await this.updateRates();

    // If currencies are the same, return original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Convert to EUR first (our base currency)
    const amountInEUR = fromCurrency === 'EUR' 
      ? amount 
      : amount / (this.rates[fromCurrency] || 1);

    // Convert from EUR to target currency
    const result = toCurrency === 'EUR'
      ? amountInEUR
      : amountInEUR * (this.rates[toCurrency] || 1);

    // Round to 2 decimal places
    return Math.round(result * 100) / 100;
  }

  public async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    await this.updateRates();

    if (fromCurrency === toCurrency) {
      return 1;
    }

    const fromRate = this.rates[fromCurrency] || 1;
    const toRate = this.rates[toCurrency] || 1;

    return toRate / fromRate;
  }

  public getSupportedCurrencies(): string[] {
    return Object.keys(this.rates);
  }
}
