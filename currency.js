class CurrencyConverter {
  constructor() {
    this.CACHE_DURATION = 3600000; // 1 heure
    this.rates = null;
    this.lastUpdate = null;
    this.initCache();
  }

  async initCache() {
    try {
      const { rates, timestamp } = await chrome.storage.local.get(['rates', 'ratesTimestamp']);
      if (rates && timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
        this.rates = rates;
        this.lastUpdate = timestamp;
        console.log('Cache des taux de change initialisé:', this.rates);
      } else {
        await this.updateRates();
      }
    } catch (error) {
      console.error('Erreur d\'initialisation du cache:', error);
      await this.updateRates();
    }
  }

  async updateRates() {
    try {
      console.log('Mise à jour des taux de change...');
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      this.rates = data.rates;
      this.lastUpdate = Date.now();
      
      await chrome.storage.local.set({
        rates: this.rates,
        ratesTimestamp: this.lastUpdate
      });
      
      console.log('Taux de change mis à jour:', this.rates);
      return this.rates;
    } catch (error) {
      console.error('Erreur de mise à jour des taux:', error);
      // Si on a des taux en cache, on les utilise même s'ils sont périmés
      if (this.rates) {
        return this.rates;
      }
      throw error;
    }
  }

  async convert(amount, fromCurrency, toCurrency) {
    try {
      console.log(`Conversion de ${amount} ${fromCurrency} vers ${toCurrency}`);
      
      // S'assurer que nous avons des taux de change
      if (!this.rates || !this.lastUpdate || (Date.now() - this.lastUpdate) > this.CACHE_DURATION) {
        await this.updateRates();
      }

      // Vérifier que les devises sont supportées
      if (!this.rates[fromCurrency] || !this.rates[toCurrency]) {
        throw new Error(`Devise non supportée: ${!this.rates[fromCurrency] ? fromCurrency : toCurrency}`);
      }

      // Nettoyer le montant
      const cleanAmount = this.extractNumber(amount);
      if (isNaN(cleanAmount)) {
        throw new Error('Montant invalide');
      }
      
      if (fromCurrency === toCurrency) {
        return this.formatCurrency(cleanAmount, toCurrency);
      }

      // Convertir en EUR d'abord si nécessaire
      let inEUR = fromCurrency === 'EUR' 
        ? cleanAmount 
        : cleanAmount / this.rates[fromCurrency];

      // Puis convertir dans la devise cible
      let converted = toCurrency === 'EUR' 
        ? inEUR 
        : inEUR * this.rates[toCurrency];

      console.log(`Résultat de la conversion: ${converted} ${toCurrency}`);
      return this.formatCurrency(converted, toCurrency);
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      throw error;
    }
  }

  extractNumber(amount) {
    if (typeof amount === 'number') return amount;
    if (typeof amount !== 'string') return NaN;
    
    // Supprimer tous les caractères sauf les chiffres, points et virgules
    const cleaned = amount.replace(/[^0-9.,]/g, '');
    // Remplacer la virgule par un point pour la conversion
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized);
  }

  formatCurrency(amount, currency) {
    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency
      });
      return formatter.format(amount);
    } catch (error) {
      console.error('Erreur de formatage:', error);
      // Fallback simple si le formatage échoue
      return `${amount.toFixed(2)} ${currency}`;
    }
  }
} 