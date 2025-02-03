import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MARKETPLACES } from '../config/marketplaces';

interface MarketplaceState {
  enabledMarketplaces: string[];
  toggleMarketplace: (marketplace: string) => void;
  setEnabledMarketplaces: (marketplaces: string[]) => void;
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set) => ({
      enabledMarketplaces: Object.keys(MARKETPLACES), // All marketplaces enabled by default
      toggleMarketplace: (marketplace) =>
        set((state) => ({
          enabledMarketplaces: state.enabledMarketplaces.includes(marketplace)
            ? state.enabledMarketplaces.filter((m) => m !== marketplace)
            : [...state.enabledMarketplaces, marketplace],
        })),
      setEnabledMarketplaces: (marketplaces) =>
        set({ enabledMarketplaces: marketplaces }),
    }),
    {
      name: 'marketplace-storage',
    }
  )
);
