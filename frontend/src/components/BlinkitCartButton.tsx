import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, getTheme } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';

interface BlinkitCartButtonProps {
  pack: {
    id: string;
    title: string;
    price: number;
    thumbnailUrl?: string;
    teacher?: { name: string };
  };
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const BlinkitCartButton: React.FC<BlinkitCartButtonProps> = ({ 
  pack, 
  size = 'medium',
  style 
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { items, addToCart, removeFromCart } = useCartStore();
  
  const cartItem = items.find(item => item.packId === pack.id);
  const isInCart = !!cartItem;
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 50, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
  };

  const handleAdd = () => {
    animatePress();
    addToCart({
      id: pack.id,
      packId: pack.id,
      title: pack.title,
      price: pack.price,
      thumbnailUrl: pack.thumbnailUrl || '',
      teacher: { name: pack.teacher?.name || '' },
    });
  };

  const handleRemove = () => {
    animatePress();
    removeFromCart(pack.id);
  };

  const styles = createStyles(theme, size);

  if (!isInCart) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>ADD</Text>
          <View style={styles.plusIcon}>
            <Ionicons name="add" size={size === 'small' ? 12 : 14} color={theme.primary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Show "Added" state with checkmark
  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity 
        style={styles.addedButton} 
        onPress={handleRemove}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={size === 'small' ? 14 : 16} color="#fff" />
        <Text style={styles.addedButtonText}>Added</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, size: 'small' | 'medium' | 'large') => {
  const heights = { small: 32, medium: 40, large: 52 };
  const fontSizes = { small: 12, medium: 14, large: 16 };
  const paddings = { small: 12, medium: 16, large: 20 };
  
  return StyleSheet.create({
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      borderRadius: 8,
      height: heights[size],
      paddingHorizontal: paddings[size],
      borderWidth: 1,
      borderColor: theme.primary,
      gap: 4,
    },
    addButtonText: {
      color: theme.primary,
      fontSize: fontSizes[size],
      fontWeight: '700',
    },
    plusIcon: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#fff',
      borderRadius: 10,
      width: size === 'small' ? 16 : 20,
      height: size === 'small' ? 16 : 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
    },
    addedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      borderRadius: 8,
      height: heights[size],
      paddingHorizontal: paddings[size],
      gap: 4,
    },
    addedButtonText: {
      color: '#fff',
      fontSize: fontSizes[size],
      fontWeight: '700',
    },
  });
};

export default BlinkitCartButton;
