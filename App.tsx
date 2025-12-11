import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { init } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      await init();
      setIsInitializing(false);
    };

    initializeAuth();
  }, [init]);

  if (isInitializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5b21b6" />
        </View>
      </SafeAreaProvider>
    );
  }

  const linking = {
    prefixes: ['gretexmusicroom://'],
    config: {
      screens: {
        EmailVerified: 'email-verified',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
