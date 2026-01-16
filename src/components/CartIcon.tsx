import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { useCartStore } from '../store/cartStore';
import { COMPONENT_SIZES, SPACING, TYPOGRAPHY } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CartIcon = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { getTotalItems } = useCartStore();
  const itemCount = getTotalItems();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Cart')}
      activeOpacity={0.7}
    >
      <View>
        <Ionicons name="cart-outline" size={COMPONENT_SIZES.icon.md} color={theme.text} />
        {itemCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>{itemCount > 99 ? '99+' : itemCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: SPACING.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    lineHeight: 14,
  },
});

export default CartIcon;
