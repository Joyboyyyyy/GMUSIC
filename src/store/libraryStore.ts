import { create } from 'zustand';
import { MusicPack } from '../types';

interface LibraryState {
  purchasedPacks: MusicPack[];
  addPack: (pack: MusicPack) => void;
  hasPack: (packId: string) => boolean;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  purchasedPacks: [],

  addPack: (pack: MusicPack) => {
    set((state) => ({
      purchasedPacks: [...state.purchasedPacks, { ...pack, isPurchased: true }],
    }));
  },

  hasPack: (packId: string) => {
    return get().purchasedPacks.some((pack) => pack.id === packId);
  },
}));

