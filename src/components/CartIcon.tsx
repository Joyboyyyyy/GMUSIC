import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { COMPONENT_SIZES, SPACING } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CartIcon = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('Cart')}
      activeOpacity={0.7}
    >
      <Ionicons name="cart-outline" size={COMPONENT_SIZES.icon.md} color={theme.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: SPACING.sm,
  },
});

export default CartIcon;
