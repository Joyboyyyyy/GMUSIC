import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  packId: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  teacher: {
    name: string;
  };
}

interface CartState {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (item: CartItem) => {
        const { items } = get();
        // Prevent duplicates - check if item with same packId already exists
        const exists = items.some((cartItem) => cartItem.packId === item.packId);
        if (!exists) {
          set({ items: [...items, item] });
        }
      },
      
      removeFromCart: (id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

