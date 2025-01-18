// Fonction pour optimiser les images
function optimizeImage(url, maxWidth = 250) {
  if (!url) return 'placeholder.png';
  // Créer une URL optimisée pour la taille souhaitée
  return url.replace(/\._[^\.]*_\./, `._SX${maxWidth}_.`);
}

class ProductHistory {
  constructor() {
    this.MAX_HISTORY = 10;
    this.cache = null;
  }

  async getHistory() {
    if (this.cache) return this.cache;

    try {
      const { history = [] } = await chrome.storage.local.get('history');
      this.cache = history;
      return history;
    } catch (error) {
      console.error('Erreur de récupération de l\'historique:', error);
      return [];
    }
  }

  async addProduct(product) {
    try {
      const history = await this.getHistory();
      const existingIndex = history.findIndex(p => p.asin === product.asin);
      
      if (existingIndex !== -1) {
        history.splice(existingIndex, 1);
      }

      const optimizedProduct = {
        ...product,
        image: optimizeImage(product.image, 50),
        timestamp: Date.now()
      };

      history.unshift(optimizedProduct);
      
      if (history.length > this.MAX_HISTORY) {
        history.pop();
      }

      this.cache = history;
      await chrome.storage.local.set({ history });
      
      return history;
    } catch (error) {
      console.error('Erreur d\'ajout à l\'historique:', error);
      return [];
    }
  }

  async clearHistory() {
    try {
      await chrome.storage.local.remove('history');
      this.cache = null;
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
      return false;
    }
  }
} 