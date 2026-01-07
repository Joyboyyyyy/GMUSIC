import React from 'react';
import { View, ViewStyle, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING, RADIUS, SHADOWS, COMPONENT_SIZES } from '../../theme/designSystem';
import { useThemeStore, getTheme } from '../../store/themeStore';

type CardSize = 'sm' | 'md' | 'lg';
type CardElevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  size?: CardSize;
  elevation?: CardElevation;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  noPadding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  size = 'md',
  elevation = 'md',
  onPress,
  style,
  padding,
  noPadding = false,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: COMPONENT_SIZES.card.borderRadius[size],
    padding: noPadding ? 0 : (padding ?? SPACING.cardPadding),
    ...SHADOWS[elevation],
    ...(isDark && elevation !== 'none' && {
      shadowOpacity: SHADOWS[elevation].shadowOpacity * 2,
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[cardStyle, style]}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
};

export default Card;
