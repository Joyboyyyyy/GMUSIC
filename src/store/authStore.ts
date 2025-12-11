import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import api, { setAuthToken as setAxiosToken } from '../utils/api';

export interface RedirectPath {
  name: string;
  params?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  redirectPath: RedirectPath | null;
  isLoggingOut: boolean; // Flag to track logout state
  login: (user: User, token: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ user: User; token: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ token: string; email: string; emailVerified: boolean }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  loginWithGoogle: (googleUser: any) => void;
  loginWithApple: (appleUser: any) => void;
  setRedirectPath: (path: string | RedirectPath) => void;
  clearRedirectPath: () => void;
  init: () => Promise<void>;
  setAuthToken: (token: string | null) => void;
  setIsLoggingOut: (value: boolean) => void;
}

const TOKEN_KEY = 'auth_token';
const PENDING_EMAIL_KEY = 'pendingEmail';

export const useAuthStore = create<AuthState>((set, get) => {
  // Reusable token persistence helper
  const persistToken = async (token: string): Promise<string> => {
    if (!token) {
      throw new Error('Token missing');
    }
    
    const stringToken = typeof token === 'string' ? token : JSON.stringify(token);
    await SecureStore.setItemAsync(TOKEN_KEY, stringToken);
    get().setAuthToken(stringToken);
    
    return stringToken;
  };

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    initialized: false,
    redirectPath: null,
    isLoggingOut: false,

    // Set auth token in axios and state
    setAuthToken: (token: string | null) => {
      setAxiosToken(token);
      set({ token: token || null });
    },

    // Login with user and token (called after API success)
    login: async (user: User, token: string) => {
      try {
        const tokenString = await persistToken(token);
        
        // Update state
        set({
          user,
          token: tokenString,
          isAuthenticated: true,
          loading: false,
        });
      } catch (error) {
        console.error('Error storing auth token:', error);
        set({ loading: false });
        throw error;
      }
    },

    // Login with credentials (calls API and then login)
    loginWithCredentials: async (email: string, password: string) => {
      set({ loading: true });
      try {
        const response = await api.post('/api/auth/login', { email, password });
        
        // Handle different response structures: response.data.data or response.data
        const payload = response.data?.data || response.data;
        const user = payload.user || payload;
        const token = payload.token || response.data?.token;
        
        // Ensure token exists
        if (!token) {
          throw new Error('No token received from server');
        }
        
        // Persist token using helper
        const tokenString = await persistToken(token);
        
        // Update state
        set({
          user,
          token: tokenString,
          isAuthenticated: true,
          loading: false,
        });
        
        return { user, token: tokenString };
      } catch (e: any) {
        set({ loading: false });
        throw new Error(e.response?.data?.message || e.message || 'Login failed');
      }
    },

    signup: async (name: string, email: string, password: string) => {
      set({ loading: true });
      try {
        const response = await api.post('/api/auth/register', { name, email, password });
        
        // Handle different response structures: response.data.data or response.data
        const payload = response.data?.data || response.data;
        const user = payload.user || payload;
        const token = payload.token || response.data?.token;
        const emailVerified = payload.emailVerified ?? payload.isVerified ?? user?.isVerified ?? false;
        const userEmail = payload.email ?? user?.email ?? email;
        
        // Ensure token exists
        if (!token) {
          throw new Error('No token received from server');
        }
        
        // Persist token using helper
        const tokenString = await persistToken(token);
        
        // Save email to SecureStore for email verification flow
        await SecureStore.setItemAsync(PENDING_EMAIL_KEY, userEmail);
        
        // Only set authenticated state if email is verified
        // If not verified, user can still have token but should verify email first
        if (emailVerified) {
          // If verified, delete pending email
          await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY);
          set({
            user,
            token: tokenString,
            isAuthenticated: true,
            loading: false,
          });
        } else {
          // Store token but don't mark as fully authenticated until email is verified
          set({
            user,
            token: tokenString,
            isAuthenticated: false, // Not fully authenticated until email verified
            loading: false,
          });
        }
        
        // Return the signup result
        return {
          token: tokenString,
          email: userEmail,
          emailVerified: emailVerified,
        };
      } catch (e: any) {
        set({ loading: false });
        throw new Error(e.response?.data?.message || e.message || 'Signup failed');
      }
    },

    setIsLoggingOut: (value: boolean) => {
      set({ isLoggingOut: value });
    },

    logout: async () => {
      try {
        // Set logout flag before clearing user
        set({ isLoggingOut: true });
        
        // Remove token from SecureStore
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        
        // Clear token from axios and state
        get().setAuthToken(null);
        
        // Clear state (keep isLoggingOut flag temporarily for ProtectedScreen to detect)
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          redirectPath: null,
          isLoggingOut: true, // Keep flag set
        });
        
        // Reset logout flag after a short delay to allow ProtectedScreen to handle navigation
        setTimeout(() => {
          set({ isLoggingOut: false });
        }, 100);
      } catch (error) {
        console.error('Error during logout:', error);
        // Still clear state even if SecureStore fails
        get().setAuthToken(null);
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          redirectPath: null,
          isLoggingOut: true,
        });
        setTimeout(() => {
          set({ isLoggingOut: false });
        }, 100);
      }
    },

    fetchMe: async () => {
      try {
        const response = await api.get('/api/auth/me');
        const user = response.data?.user || response.data;
        
        set({ 
          user,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('fetchMe error:', error);
        // Token invalid, clear everything
        try {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (e) {
          console.warn('Failed to delete token from SecureStore:', e);
        }
        get().setAuthToken(null);
        set({ 
          user: null, 
          isAuthenticated: false, 
          token: null,
        });
      }
    },

    setRedirectPath: (path: string | RedirectPath) => {
      // Support both string (backward compatibility) and object format
      const redirectPath: RedirectPath | null = typeof path === 'string' 
        ? { name: path } 
        : path;
      set({ redirectPath });
    },

    clearRedirectPath: () => {
      set({ redirectPath: null });
    },

    updateUser: async (updates: Partial<User>) => {
      try {
        const response = await api.put('/api/auth/me', updates);
        const updatedUser = response.data?.user || response.data;
        
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
        }));
      } catch (error: any) {
        console.error('Update user error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Update failed');
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

    // Initialize auth state on app start
    init: async () => {
      try {
        set({ loading: true });
        
        // Load token from SecureStore
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        
        if (token) {
          // Set token in axios using get().setAuthToken to prevent ReferenceError
          get().setAuthToken(token);
          
          // Try to fetch user info
          try {
            const response = await api.get('/api/auth/me');
            const user = response.data?.user || response.data;
            
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
              initialized: true,
            });
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token invalid, clear everything
            try {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
            } catch (e) {
              console.warn('Failed to delete invalid token:', e);
            }
            get().setAuthToken(null);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              initialized: true,
            });
          }
        } else {
          // No token found
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Ensure we always set initialized to true, even on error
        get().setAuthToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          initialized: true,
        });
      }
    },
  };
});
