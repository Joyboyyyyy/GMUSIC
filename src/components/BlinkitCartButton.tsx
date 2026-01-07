import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCartStore, CartItem } from '../store/cartStore';

interface BlinkitCartButtonProps {
  pack: {
    id: string;
    title: string;
    price: number;
    thumbnailUrl: string;
    teacher: {
      name: string;
    };
  };
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const BlinkitCartButton: React.FC<BlinkitCartButtonProps> = ({ 
  pack, 
  size = 'medium',
  style 
}) => {
  const { addToCart, removeFromCart, isInCart } = useCartStore();
  const inCart = isInCart(pack.id);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();
  };

  const handleAdd = () => {
    triggerHaptic();
    animatePress();
    
    const cartItem: Omit<CartItem, 'quantity'> = {
      id: `${pack.id}-${Date.now()}`,
      packId: pack.id,
      title: pack.title,
      price: pack.price,
      thumbnailUrl: pack.thumbnailUrl,
      teacher: {
        name: pack.teacher.name,
      },
    };
    addToCart(cartItem);
  };

  const handleRemove = () => {
    triggerHaptic();
    animatePress();
    removeFromCart(pack.id);
  };

  const sizeStyles = {
    small: {
      height: 42,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
    },
    medium: {
      height: 50,
      paddingHorizontal: 20,
      fontSize: 15,
      iconSize: 18,
    },
    large: {
      height: 58,
      paddingHorizontal: 24,
      fontSize: 17,
      iconSize: 22,
    },
  };

  const currentSize = sizeStyles[size];

  if (!inCart) {
    // ADD button state
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          style={[
            styles.addButton,
            { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal }
          ]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, { fontSize: currentSize.fontSize }]}>ADD</Text>
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={12} color="#7c3aed" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ADDED state - show checkmark with option to remove
  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[
          styles.addedButton,
          { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal }
        ]}
        onPress={handleRemove}
        activeOpacity={0.8}
      >
        <Ionicons name="checkmark" size={currentSize.iconSize} color="#fff" />
        <Text style={[styles.addedButtonText, { fontSize: currentSize.fontSize }]}>ADDED</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  addButtonText: {
    color: '#7c3aed',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  plusBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#7c3aed',
  },
  addedButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addedButtonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default BlinkitCartButton;
