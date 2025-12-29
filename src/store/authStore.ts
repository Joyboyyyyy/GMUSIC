import { create } from 'zustand';
import { User } from '../types';
import api, { setAuthToken as setAxiosToken } from '../utils/api';
import { setItem, getItem, deleteItem } from '../utils/storage';

export interface RedirectPath {
  name: string;
  params?: any;
}

export type AuthStatus = 'unauthenticated' | 'pending_verification' | 'authenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  loading: boolean;
  initialized: boolean;
  redirectPath: RedirectPath | null;
  isLoggingOut: boolean; // Flag to track logout state
  login: (user: User, token: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<{ user: User; token: string }>;
  signup: (name: string, email: string, password: string, dateOfBirth?: string | null, address?: string | null) => Promise<{ email: string }>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<{ user: User }>;
  setUserFromBackend: (user: User) => void;
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
  // NOTE: This only stores token and sets it in axios
  // Status must be set separately together with token in state
  const persistToken = async (token: string): Promise<string> => {
    if (!token) {
      throw new Error('Token missing');
    }
    
    const stringToken = typeof token === 'string' ? token : JSON.stringify(token);
    await setItem(TOKEN_KEY, stringToken);
    setAxiosToken(stringToken); // Set in axios for API calls
    
    return stringToken;
  };

  return {
    user: null,
    token: null,
    status: 'unauthenticated',
    loading: false,
    initialized: false,
    redirectPath: null,
    isLoggingOut: false,

    // Set auth token in axios only (for API calls)
    // NOTE: Never set token in state without also setting status='authenticated'
    // Token in state should only be set together with status in login() or init()
    setAuthToken: (token: string | null) => {
      setAxiosToken(token);
      // DO NOT set token in state here - it must be set together with status
    },

    // Login with user and token (called after API success)
    login: async (user: User, token: string) => {
      try {
        const tokenString = await persistToken(token);
        
        // Update state - only authenticated status when we have both user and token
        set({
          user,
          token: tokenString,
          status: 'authenticated',
          loading: false,
        });
      } catch (error) {
        console.error('Error storing auth token:', error);
        set({ loading: false, status: 'unauthenticated' });
        throw error;
      }
    },

    // Login with credentials (calls API and then login)
    loginWithCredentials: async (email: string, password: string) => {
      set({ loading: true });
      try {
        // Log API configuration for debugging
        const { API_BASE_URL } = await import('../config/api');
        console.log('[AuthStore] API BASE URL:', API_BASE_URL);
        console.log('[AuthStore] Attempting login to:', `${API_BASE_URL}/api/auth/login`);
        
        const response = await api.post('/api/auth/login', { email, password });
        
        // Backend returns: { success: true, message: "...", data: { user, token } }
        const responseData = response.data;
        const payload = responseData?.data || responseData;
        const user = payload?.user || payload;
        const token = payload?.token || responseData?.token;
        
        // Ensure token exists
        if (!token) {
          console.error('[AuthStore] No token in login response:', responseData);
          throw new Error('No token received from server');
        }
        
        // Ensure user exists
        if (!user) {
          console.error('[AuthStore] No user in login response:', responseData);
          throw new Error('No user data received from server');
        }
        
        // Persist token using helper
        const tokenString = await persistToken(token);
        
        // Update state - authenticated only after successful login
        set({
          user,
          token: tokenString,
          status: 'authenticated',
          loading: false,
        });
        
        return { user, token: tokenString };
      } catch (e: any) {
        set({ loading: false });
        
        // Enhanced error logging for network errors
        if (e.message === 'Network Error' || e.code === 'ERR_NETWORK' || !e.response) {
          const { API_BASE_URL } = await import('../config/api');
          console.error('[AuthStore] Network Error Details:');
          console.error('  - API Base URL:', API_BASE_URL);
          console.error('  - Request URL:', `${API_BASE_URL}/api/auth/login`);
          console.error('  - Error Code:', e.code);
          console.error('  - Error Message:', e.message);
          console.error('  - Full Error:', e);
          
          // Provide helpful error message
          const errorMessage = `Cannot connect to server. Please check:\n1. Backend server is running\n2. API URL is correct: ${API_BASE_URL}\n3. Network connection is active`;
          throw new Error(errorMessage);
        }
        
        // Return clear error message for invalid credentials
        const errorMessage = e.response?.data?.message || e.message || 'Login failed';
        console.error('[AuthStore] Login error:', errorMessage, e.response?.data);
        throw new Error(errorMessage);
      }
    },

    signup: async (name: string, email: string, password: string, dateOfBirth?: string | null, address?: string | null) => {
      set({ loading: true });
      try {
        console.log('[AuthStore] Starting signup for:', email);
        const response = await api.post('/api/auth/register', { 
          name, 
          email, 
          password,
          dateOfBirth,
          address,
        });
        
        // Backend returns: { success: true, message: "Verification email sent" }
        const responseData = response.data;
        
        console.log('[AuthStore] Signup response:', responseData);
        
        // Save email to storage for email verification flow
        await setItem(PENDING_EMAIL_KEY, email);
        
        // Set status to pending_verification - NO token storage
        set({
          user: null,
          token: null,
          status: 'pending_verification',
          loading: false,
        });
        
        console.log('[AuthStore] Signup completed - verification email sent');
        
        // Return only email - no token
        return {
          email: email,
        };
      } catch (e: any) {
        set({ loading: false });
        
        // Enhanced error handling with network diagnostics
        let errorMessage = 'Signup failed';
        
        if (e.message === 'Network Error' || e.code === 'ERR_NETWORK' || !e.response) {
          // Network error - server unreachable
          const { API_BASE_URL } = await import('../config/api');
          errorMessage = `Cannot connect to server at ${API_BASE_URL}. Please ensure:\n1. Backend server is running\n2. Network connection is active\n3. Server is accessible from this device`;
          console.error('[AuthStore] Network Error Details:');
          console.error('  - API Base URL:', API_BASE_URL);
          console.error('  - Request URL:', '/api/auth/register');
          console.error('  - Full URL:', `${API_BASE_URL}/api/auth/register`);
          console.error('  - Error Code:', e.code);
          console.error('  - Error Message:', e.message);
        } else if (e.response?.data?.message) {
          // Server returned an error message
          errorMessage = e.response.data.message;
        } else if (e.message) {
          // Use the error message
          errorMessage = e.message;
        }
        
        console.error('[AuthStore] Signup error:', errorMessage);
        console.error('[AuthStore] Full error:', e);
        
        throw new Error(errorMessage);
      }
    },

    setIsLoggingOut: (value: boolean) => {
      set({ isLoggingOut: value });
    },

    logout: async () => {
      try {
        // Set logout flag before clearing user
        set({ isLoggingOut: true });
        
        // Remove token from storage
        await deleteItem(TOKEN_KEY);
        
        // Clear token from axios and state
        get().setAuthToken(null);
        
        // Clear state (keep isLoggingOut flag temporarily for ProtectedScreen to detect)
        set({ 
          user: null, 
          token: null, 
          status: 'unauthenticated',
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
          status: 'unauthenticated',
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
        // Backend returns: { success: true, message: "...", data: user }
        // Extract user from response.data.data (backend wraps user in data field)
        const user = response.data?.data || response.data?.user || response.data;
        
        if (!user) {
          throw new Error('No user data received from server');
        }
        
        // Return user object - DO NOT merge or partially update
        // This is the complete user profile from backend (name, email, avatar, isVerified, etc.)
        return { user };
      } catch (error) {
        console.error('fetchMe error:', error);
        // Token invalid, clear everything
        try {
          await deleteItem(TOKEN_KEY);
        } catch (e) {
          console.warn('Failed to delete token from storage:', e);
        }
        get().setAuthToken(null);
        set({ 
          user: null, 
          status: 'unauthenticated',
          token: null,
        });
        throw error;
      }
    },

    // Set user from backend - single source of truth
    setUserFromBackend: (user: User) => {
      set({
        user,
        status: 'authenticated', // Only set authenticated if we have user and token
        loading: false,
      });
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

    // loginWithGoogle is now handled in LoginScreen by sending idToken to backend
    // Backend verifies and returns user + JWT token
    // This method is kept for backward compatibility but should not be called directly
    loginWithGoogle: (googleUser: any) => {
      console.warn('[AuthStore] loginWithGoogle called directly - this should be handled via backend');
      const user: User = {
        id: googleUser.id || Date.now().toString(),
        name: googleUser.name || googleUser.email?.split('@')[0] || 'Google User',
        email: googleUser.email || '',
        avatar: googleUser.picture || `https://i.pravatar.cc/150?u=${googleUser.email}`,
      };

      set({ user, status: 'authenticated' });
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

      set({ user, status: 'authenticated' });
    },

    // Initialize auth state on app start
    init: async () => {
      try {
        set({ loading: true });
        
        // Load token from storage
        const token = await getItem(TOKEN_KEY);
        
        if (token) {
          // Set token in axios for API calls
          setAxiosToken(token);
          
          // Try to fetch user info
          try {
            const response = await api.get('/api/auth/me');
            const user = response.data?.user || response.data;
            
            // Set token and status together - NEVER set token without status='authenticated'
            set({
              user,
              token,
              status: 'authenticated',
              loading: false,
              initialized: true,
            });
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token invalid, clear everything
            try {
              await deleteItem(TOKEN_KEY);
            } catch (e) {
              console.warn('Failed to delete invalid token:', e);
            }
            get().setAuthToken(null);
            set({
              user: null,
              token: null,
              status: 'unauthenticated',
              loading: false,
              initialized: true,
            });
          }
        } else {
          // No token found
          set({
            user: null,
            token: null,
            status: 'unauthenticated',
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
          status: 'unauthenticated',
          loading: false,
          initialized: true,
        });
      }
    },
  };
});
