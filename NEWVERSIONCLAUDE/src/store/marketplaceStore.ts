import { create } from 'zustand';
import { MARKETPLACES } from '../config/marketplaces';

interface MarketplaceState {
  selectedMarketplaces: string[];
  setSelectedMarketplaces: (marketplaces: string[]) => void;
  toggleMarketplace: (marketplace: string) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  selectedMarketplaces: Object.keys(MARKETPLACES),
  setSelectedMarketplaces: (marketplaces) => set({ selectedMarketplaces: marketplaces }),
  toggleMarketplace: (marketplace) =>
    set((state) => ({
      selectedMarketplaces: state.selectedMarketplaces.includes(marketplace)
        ? state.selectedMarketplaces.filter((m) => m !== marketplace)
        : [...state.selectedMarketplaces, marketplace],
    })),
}));
