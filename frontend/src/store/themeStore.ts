import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// Get system preference
const getSystemTheme = () => Appearance.getColorScheme() === 'dark';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isDark: getSystemTheme(),
      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'system' ? getSystemTheme() : mode === 'dark';
        set({ mode, isDark });
      },
      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        set({ mode: newMode, isDark: newMode === 'dark' });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate isDark based on mode after rehydration
          if (state.mode === 'system') {
            state.isDark = getSystemTheme();
          }
        }
      },
    }
  )
);

// Enhanced theme colors with improved light mode visibility
export const lightTheme = {
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceVariant: '#f1f3f4', // Stronger contrast
  primary: '#7c3aed',
  primaryLight: '#ede9fe',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  border: '#d1d5db', // Stronger border for better visibility
  borderStrong: '#9ca3af', // For emphasis
  borderSubtle: '#e5e7eb', // Original border for minimal cases
  error: '#ef4444',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  card: '#ffffff',
  cardElevated: '#fefefe', // Slightly elevated cards
  cardBorder: '#e1e5e9', // Stronger card border
  cardShadow: '#000000', // Pure black for shadows
  inputBackground: '#f3f4f6',
  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  statusBar: 'dark-content' as const,
};

export const darkTheme = {
  background: '#1e1e1e',
  surface: '#2d2d2d',
  surfaceVariant: '#3d3d3d',
  primary: '#a78bfa',
  primaryLight: '#312e81',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#3d3d3d',
  error: '#f87171',
  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  card: '#2d2d2d',
  inputBackground: '#3d3d3d',
  tabBar: '#2d2d2d',
  tabBarBorder: '#3d3d3d',
  statusBar: 'light-content' as const,
};

export type Theme = typeof lightTheme | typeof darkTheme;

export const getTheme = (isDark: boolean) => isDark ? darkTheme : lightTheme;
