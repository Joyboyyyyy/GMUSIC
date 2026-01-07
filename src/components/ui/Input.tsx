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
import { SPACING, COMPONENT_SIZES, RADIUS, TYPOGRAPHY, TEXT_STYLES } from '../../theme/designSystem';
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

  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="label" style={{ marginBottom: SPACING.xs, color: theme.textSecondary }}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            height: inputHeight,
            backgroundColor: theme.inputBackground,
            borderColor: error ? theme.error : isFocused ? theme.primary : theme.border,
            borderRadius: COMPONENT_SIZES.input.borderRadius,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={iconSize}
            color={theme.textMuted}
            style={{ marginRight: SPACING.xs }}
          />
        )}
        <TextInput
          style={[
            styles.input,
            TEXT_STYLES.body,
            { color: theme.text, flex: 1 },
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={actualSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={iconSize}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress}>
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

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: SPACING.inputPadding,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});

export default Input;
