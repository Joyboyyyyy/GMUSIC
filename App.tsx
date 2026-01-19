import React, { useEffect, useState, ErrorInfo, ReactNode } from 'react';
import { NavigationContainer, LinkingOptions, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore, getTheme } from './src/store/themeStore';
import { RootStackParamList } from './src/navigation/types';
import { navigationRef } from './src/navigation/navigationRef';
// import { OfflineBanner } from './src/components/OfflineBanner'; // Disabled for Expo Go compatibility

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('App Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message || 'Unknown error'}</Text>
          <Text style={styles.errorHint}>Check the console for more details</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);
  const { init } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[App] Initializing auth...');
        await init();
        console.log('[App] Auth initialized successfully');
      } catch (error: any) {
        console.error('[App] Failed to initialize auth:', error);
        setInitError(error);
      } finally {
        setIsInitializing(false);
      }
    };
    initializeAuth();
  }, [init]);

  // Custom navigation theme based on dark mode
  const navigationTheme = isDark ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (initError) console.error('[App] Initialization error:', initError);

  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['gretexmusicroom://'],
    config: {
      screens: {
        EmailVerify: { path: 'verify-email', parse: { token: (token: string) => token } },
        EmailVerified: { path: 'email-verified', parse: { error: (error: string) => error } },
        Auth: { screens: { ResetPassword: { path: 'reset-password', parse: { token: (token: string) => token } } } },
      },
    },
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        {/* <OfflineBanner /> */}
        <NavigationContainer 
          ref={navigationRef} 
          linking={linking}
          theme={navigationTheme}
          onReady={() => console.log('[App] Navigation ready')}
          onStateChange={() => console.log('[App] Navigation state changed')}
        >
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  errorTitle: { fontSize: 24, fontWeight: 'bold', color: '#ef4444', marginBottom: 12 },
  errorText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  errorHint: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
