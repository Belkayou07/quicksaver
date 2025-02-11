import create from 'zustand';

interface MarketplaceState {
  selectedCountries: string[];
  currency: string;
  showPriceComparison: boolean;
  showShippingCalculation: boolean;
  showFlags: boolean;
  showPriceIndicator: boolean;
  toggleCountry: (code: string) => void;
  setCurrency: (currency: string) => void;
  togglePriceComparison: () => void;
  toggleShippingCalculation: () => void;
  toggleFlags: () => void;
  togglePriceIndicator: () => void;
}

export const useStore = create<MarketplaceState>((set) => ({
  selectedCountries: ['US', 'GB'],
  currency: 'USD',
  showPriceComparison: true,
  showShippingCalculation: true,
  showFlags: true,
  showPriceIndicator: true,
  toggleCountry: (code) => set((state) => ({
    selectedCountries: state.selectedCountries.includes(code)
      ? state.selectedCountries.filter(c => c !== code)
      : [...state.selectedCountries, code]
  })),
  setCurrency: (currency) => set({ currency }),
  togglePriceComparison: () => set((state) => ({ showPriceComparison: !state.showPriceComparison })),
  toggleShippingCalculation: () => set((state) => ({ showShippingCalculation: !state.showShippingCalculation })),
  toggleFlags: () => set((state) => ({ showFlags: !state.showFlags })),
  togglePriceIndicator: () => set((state) => ({ showPriceIndicator: !state.showPriceIndicator }))
}));
