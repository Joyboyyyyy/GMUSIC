import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { TEXT_STYLES, TYPOGRAPHY } from '../../theme/designSystem';
import { useThemeStore, getTheme } from '../../store/themeStore';

type TextVariant = keyof typeof TEXT_STYLES;

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: keyof typeof TYPOGRAPHY.fontWeight;
}

const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align = 'left',
  weight,
  style,
  children,
  ...props
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  
  const textStyle = TEXT_STYLES[variant];
  
  return (
    <RNText
      style={[
        textStyle,
        {
          color: color || theme.text,
          textAlign: align,
          ...(weight && { fontWeight: TYPOGRAPHY.fontWeight[weight] }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text;
