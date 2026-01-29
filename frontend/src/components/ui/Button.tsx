import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, COMPONENT_SIZES, SHADOWS, TEXT_STYLES, LAYOUT } from '../../theme/designSystem';
import { useThemeStore, getTheme } from '../../store/themeStore';

type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  size?: ButtonSize;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  size = 'md',
  variant = 'primary',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const getButtonStyles = (): ViewStyle => {
    const base: ViewStyle = {
      height: COMPONENT_SIZES.button.height[size],
      borderRadius: COMPONENT_SIZES.button.borderRadius[size],
      paddingHorizontal: size === 'sm' ? SPACING.md : SPACING.lg,
      ...LAYOUT.flex.row,
      justifyContent: 'center',
      gap: SPACING.xs,
      minHeight: COMPONENT_SIZES.touchTarget[size], // Ensure minimum touch target
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: theme.primary, ...SHADOWS.md };
      case 'secondary':
        return { ...base, backgroundColor: theme.primaryLight };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      default:
        return base;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'primary': return '#fff';
      case 'secondary': return theme.primary;
      case 'outline': return theme.primary;
      case 'ghost': return theme.primary;
      default: return '#fff';
    }
  };

  const textStyleVariant = size === 'lg' ? TEXT_STYLES.buttonLarge : size === 'sm' ? TEXT_STYLES.buttonSmall : TEXT_STYLES.button;
  const iconSize = COMPONENT_SIZES.button.iconSize[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[getButtonStyles(), disabled && { opacity: 0.5 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={getTextColor()} />
          )}
          <Text style={[textStyleVariant, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={getTextColor()} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
