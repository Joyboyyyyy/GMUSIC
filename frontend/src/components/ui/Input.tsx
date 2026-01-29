import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, COMPONENT_SIZES, RADIUS, TEXT_STYLES, LAYOUT } from '../../theme/designSystem';
import { useThemeStore, getTheme } from '../../store/themeStore';
import Text from './Text';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  size = 'md',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  secureTextEntry,
  style,
  ...props
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const actualSecure = isPassword && !showPassword;

  const inputHeight = COMPONENT_SIZES.input.height[size];
  const iconSize = COMPONENT_SIZES.input.iconSize;

  const styles = StyleSheet.create({
    inputContainer: {
      ...LAYOUT.flex.row,
      height: inputHeight,
      backgroundColor: theme.inputBackground,
      borderColor: error ? theme.error : isFocused ? theme.primary : theme.border,
      borderRadius: COMPONENT_SIZES.input.borderRadius,
      borderWidth: 1,
      paddingHorizontal: SPACING.inputPadding,
      minHeight: COMPONENT_SIZES.touchTarget.md, // Ensure minimum touch target
    },
    input: {
      flex: 1,
      padding: 0,
      ...TEXT_STYLES.body,
      color: theme.text,
    },
  });

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="label" style={{ marginBottom: SPACING.xs, color: theme.textSecondary }}>
          {label}
        </Text>
      )}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={iconSize}
            color={theme.textMuted}
            style={{ marginRight: SPACING.xs }}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={actualSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={{ minHeight: COMPONENT_SIZES.touchTarget.sm, minWidth: COMPONENT_SIZES.touchTarget.sm, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={iconSize}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity 
            onPress={onRightIconPress} 
            disabled={!onRightIconPress}
            style={{ minHeight: COMPONENT_SIZES.touchTarget.sm, minWidth: COMPONENT_SIZES.touchTarget.sm, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name={rightIcon} size={iconSize} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text variant="caption" style={{ marginTop: SPACING.xxs, color: theme.error }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
