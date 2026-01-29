import React from 'react';
import { View, ViewStyle, StyleSheet, Dimensions } from 'react-native';
import { useThemeStore, getTheme } from '../../store/themeStore';
import { getEnhancedShadow, GRID, RADIUS } from '../../theme/designSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EnhancedCardProps {
  children: React.ReactNode;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elevated' | 'outlined';
  borderStyle?: 'none' | 'subtle' | 'strong';
  style?: ViewStyle;
  fullWidth?: boolean;
  responsive?: boolean;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  elevation = 'md',
  variant = 'default',
  borderStyle = 'none',
  style,
  fullWidth = false,
  responsive = true,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  
  const cardDimensions = responsive ? GRID.getResponsiveCardDimensions() : null;
  
  // Convert percentage strings to actual pixel values for React Native
  const getPixelValue = (value: string | number): number => {
    if (typeof value === 'string' && value.includes('%')) {
      const percentage = parseFloat(value.replace('%', ''));
      return (SCREEN_WIDTH * percentage) / 100;
    }
    return typeof value === 'number' ? value : 0;
  };
  
  const cardStyles: ViewStyle = {
    backgroundColor: variant === 'elevated' ? (theme as any).cardElevated || theme.card : theme.card,
    borderRadius: RADIUS.md,
    // Apply enhanced shadows based on elevation
    ...(elevation !== 'none' && getEnhancedShadow(elevation, isDark)),
    // Apply border styling
    ...(borderStyle !== 'none' && {
      borderWidth: borderStyle === 'strong' ? 2 : 1,
      borderColor: borderStyle === 'strong' 
        ? (theme as any).borderStrong || theme.border
        : (theme as any).cardBorder || (theme as any).borderSubtle || theme.border,
    }),
    // Apply responsive width if enabled
    ...(responsive && !fullWidth && cardDimensions && {
      width: getPixelValue(cardDimensions.width),
      marginHorizontal: getPixelValue(cardDimensions.marginHorizontal),
    }),
    // Full width override
    ...(fullWidth && {
      width: '100%',
      marginHorizontal: 0,
    }),
    // Fallback border for light mode when card background matches screen background
    ...((!isDark && borderStyle === 'none' && theme.card === theme.background) && {
      borderWidth: 1,
      borderColor: (theme as any).cardBorder || theme.border,
    }),
  };
  
  return (
    <View style={[cardStyles, style]}>
      {children}
    </View>
  );
};

// Preset card variants for common use cases
export const PackageCard: React.FC<Omit<EnhancedCardProps, 'elevation' | 'variant'>> = (props) => (
  <EnhancedCard elevation="md" variant="default" borderStyle="subtle" {...props} />
);

export const BuildingCard: React.FC<Omit<EnhancedCardProps, 'elevation' | 'variant'>> = (props) => (
  <EnhancedCard elevation="md" variant="default" borderStyle="subtle" {...props} />
);

export const CategoryCard: React.FC<Omit<EnhancedCardProps, 'elevation' | 'variant'>> = (props) => (
  <EnhancedCard elevation="sm" variant="default" borderStyle="none" {...props} />
);

export const TeacherCard: React.FC<Omit<EnhancedCardProps, 'elevation' | 'variant'>> = (props) => (
  <EnhancedCard elevation="sm" variant="default" borderStyle="subtle" {...props} />
);

export default EnhancedCard;