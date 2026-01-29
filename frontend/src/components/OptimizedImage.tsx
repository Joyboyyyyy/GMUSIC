import React, { useState } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, getTheme } from '../store/themeStore';
import { SPACING } from '../theme/designSystem';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  width?: number;
  height?: number;
  showLoader?: boolean;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  uri, 
  width = 400, 
  height, 
  showLoader = true,
  fallbackIcon = 'image-outline',
  style,
  ...props 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  // Add image optimization parameters
  const optimizedUri = uri && uri.includes('http') 
    ? uri.includes('?') 
      ? `${uri}&w=${width}&q=80&f=webp`
      : `${uri}?w=${width}&q=80&f=webp`
    : uri;

  const imageStyle = [
    style,
    width && height ? { width, height } : {},
  ];

  if (error) {
    return (
      <View style={[styles.fallback, imageStyle, { backgroundColor: theme.surfaceVariant }]}>
        <Ionicons name={fallbackIcon} size={32} color={theme.textMuted} />
      </View>
    );
  }

  return (
    <View style={imageStyle}>
      <Image
        source={{ uri: optimizedUri }}
        style={[StyleSheet.absoluteFill, imageStyle]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        // Performance optimizations
        resizeMode="cover"
        fadeDuration={300}
        {...props}
      />
      
      {loading && showLoader && (
        <View style={[styles.loader, imageStyle]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});