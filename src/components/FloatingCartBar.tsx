import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useCartStore } from '../store/cartStore';
import { Text } from './ui';
import { SPACING, RADIUS, SHADOWS, COMPONENT_SIZES } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FloatingCartBarProps {
  visible?: boolean;
}

const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ visible = true }) => {
  const navigation = useNavigation<NavigationProp>();
  const { getTotalPrice, getTotalItems } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  
  const slideAnim = useRef(new Animated.Value(100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (totalItems > 0 && visible) {
      // Slide up and scale in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
      ]).start();
    } else {
      // Slide down and scale out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [totalItems, visible]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.bar}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.95}
      >
        <View style={styles.leftSection}>
          <View style={styles.itemCountBadge}>
            <Text variant="label" style={{ color: '#7c3aed', fontWeight: '800' }}>{totalItems}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </Text>
            <Text variant="label" style={{ color: '#fff', fontWeight: '700' }}>₹{totalPrice.toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Text variant="label" style={{ color: '#fff', fontWeight: '700' }}>View Cart</Text>
          <Ionicons name="arrow-forward" size={COMPONENT_SIZES.icon.xs} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: 84,
    right: 84,
    zIndex: 1000,
  },
  bar: {
    backgroundColor: '#7c3aed',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...SHADOWS.xl,
    shadowColor: '#7c3aed',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemCountBadge: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    minWidth: SPACING.xl,
    alignItems: 'center',
  },
  textContainer: {
    gap: SPACING.xxs,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
});

export default FloatingCartBar;
