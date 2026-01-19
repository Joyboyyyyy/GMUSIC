import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useThemeStore, getTheme } from '../store/themeStore';
import { Text } from './ui';
import { SPACING } from '../theme/designSystem';

export const OfflineBanner = () => {
  const { isConnected } = useNetworkStatus();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  if (isConnected) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.error }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text variant="caption" style={styles.text}>No Internet Connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});
