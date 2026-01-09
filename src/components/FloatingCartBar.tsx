import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useCartStore } from '../store/cartStore';
import { useThemeStore, getTheme } from '../store/themeStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FloatingCartBarProps {
  visible?: boolean;
}

const FloatingCartBar: React.FC<FloatingCartBarProps> = ({ visible = true }) => {
  const navigation = useNavigation<NavigationProp>();
  const { getTotalPrice, getTotalItems } = useCartStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0 || !visible) return null;

  const styles = createStyles(theme);

  return (
    <Animated.View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.itemCount}>
            <Text style={styles.itemCountText}>{totalItems}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>₹{totalPrice.toLocaleString()}</Text>
            <Text style={styles.plusTaxes}>plus taxes</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewCartButton} 
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <Text style={styles.viewCartText}>View Cart</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
    backgroundColor: theme.primary,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  priceSection: {
    flexDirection: 'column',
  },
  priceLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  plusTaxes: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FloatingCartBar;
