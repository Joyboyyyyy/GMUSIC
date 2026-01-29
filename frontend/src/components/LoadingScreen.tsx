import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingAnimation } from './LoadingAnimation';
import { useThemeStore, getTheme } from '../store/themeStore';

interface LoadingScreenProps {
  message?: string;
  type?: 'spinner' | 'dots' | 'pulse';
}

/**
 * Full-screen loading component with centered animation and message
 * Matches the design from the mockup with icon and "Loading Music." text
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Music.',
  type = 'spinner',
}) => {
  const isDark = useThemeStore((state) => state.isDark);
  const colors = getTheme(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LoadingAnimation
        type={type}
        size="xl"
        color={colors.primary}
        showMessage
        message={message}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
