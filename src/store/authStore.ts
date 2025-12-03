import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loginWithGoogle: (googleUser: any) => void;
  loginWithApple: (appleUser: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    // Mock login - in production, this would call your backend API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        name: email.split('@')[0],
        email: email,
        avatar: 'https://i.pravatar.cc/150?u=' + email,
      };

      set({ user: mockUser, isAuthenticated: true });
    } catch (error) {
      throw new Error('Login failed');
    }
  },

  signup: async (name: string, email: string, password: string) => {
    // Mock signup - in production, this would call your backend API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        avatar: 'https://i.pravatar.cc/150?u=' + email,
      };

      set({ user: mockUser, isAuthenticated: true });
    } catch (error) {
      throw new Error('Signup failed');
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (updates: Partial<User>) => {
    // Mock update - in production, this would call your backend API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      }));
    } catch (error) {
      throw new Error('Update failed');
    }
  },

  loginWithGoogle: (googleUser: any) => {
    const user: User = {
      id: googleUser.id || Date.now().toString(),
      name: googleUser.name || googleUser.email?.split('@')[0] || 'Google User',
      email: googleUser.email || '',
      avatar: googleUser.picture || `https://i.pravatar.cc/150?u=${googleUser.email}`,
    };

    set({ user, isAuthenticated: true });
  },

  loginWithApple: (appleUser: any) => {
    const user: User = {
      id: appleUser.user || Date.now().toString(),
      name: appleUser.fullName?.givenName 
        ? `${appleUser.fullName.givenName} ${appleUser.fullName.familyName || ''}`
        : 'Apple User',
      email: appleUser.email || `apple_${Date.now()}@privaterelay.com`,
      avatar: `https://i.pravatar.cc/150?u=${appleUser.user}`,
    };

    set({ user, isAuthenticated: true });
  },
}));
