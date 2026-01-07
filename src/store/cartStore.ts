import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string;
  packId: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  quantity: number;
  teacher: {
    name: string;
  };
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (packId: string) => void;
  incrementQuantity: (packId: string) => void;
  decrementQuantity: (packId: string) => void;
  getQuantity: (packId: string) => number;
  isInCart: (packId: string) => boolean;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (item) => {
        const { items } = get();
        const existingIndex = items.findIndex((cartItem) => cartItem.packId === item.packId);
        
        if (existingIndex >= 0) {
          // Increment quantity if already exists
          const newItems = [...items];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems });
        } else {
          // Add new item with quantity 1
          set({ items: [...items, { ...item, quantity: 1 }] });
        }
      },
      
      removeFromCart: (packId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.packId !== packId),
        }));
      },

      incrementQuantity: (packId: string) => {
        const { items } = get();
        const newItems = items.map((item) =>
          item.packId === packId ? { ...item, quantity: item.quantity + 1 } : item
        );
        set({ items: newItems });
      },

      decrementQuantity: (packId: string) => {
        const { items } = get();
        const item = items.find((i) => i.packId === packId);
        
        if (item && item.quantity <= 1) {
          // Remove item if quantity becomes 0
          set({ items: items.filter((i) => i.packId !== packId) });
        } else {
          // Decrement quantity
          const newItems = items.map((i) =>
            i.packId === packId ? { ...i, quantity: i.quantity - 1 } : i
          );
          set({ items: newItems });
        }
      },

      getQuantity: (packId: string) => {
        const item = get().items.find((i) => i.packId === packId);
        return item?.quantity || 0;
      },

      isInCart: (packId: string) => {
        return get().items.some((item) => item.packId === packId);
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
