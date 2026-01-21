import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import { requireAuth } from '../utils/auth';
import { Text, Card, Button } from '../components/ui';
import { SPACING, RADIUS, SHADOWS, COMPONENT_SIZES } from '../theme/designSystem';
import * as Haptics from 'expo-haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CartScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { items, removeFromCart, getTotalPrice, getTotalItems } = useCartStore();
  const { status } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }
    requireAuth(status, navigation, () => navigation.navigate('Checkout', { items }), 'Please login to proceed to checkout', { name: 'Checkout', params: { items } });
  };

  const handleRemoveItem = (packId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeFromCart(packId);
  };

  const styles = createStyles(theme);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={COMPONENT_SIZES.icon.xl} color={theme.primary} />
          </View>
          <Text variant="h4" style={{ color: theme.text, marginBottom: SPACING.xs }}>Your cart is empty</Text>
          <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center', marginBottom: SPACING.xl }}>Add some music courses to get started</Text>
          <Button 
            title="Browse Courses" 
            onPress={() => navigation.navigate('Browse')}
            icon="arrow-forward"
            iconPosition="right"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="h3" style={{ color: theme.text, marginBottom: SPACING.xxs }}>Shopping Cart</Text>
          <Text variant="body" style={{ color: theme.textSecondary }}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
        </View>

        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <Card key={item.id} style={styles.itemCard} elevation="sm">
              <Image source={{ uri: item.thumbnailUrl }} style={styles.itemThumbnail} />
              <View style={styles.itemInfo}>
                <Text variant="label" numberOfLines={2} style={{ color: theme.text, marginBottom: SPACING.xxs }}>{item.title}</Text>
                {item.teacher && <Text variant="caption" style={{ color: theme.textSecondary, marginBottom: SPACING.xs }}>{item.teacher.name}</Text>}
                <Text variant="h4" style={{ color: theme.primary }}>₹{item.price}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => handleRemoveItem(item.packId)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        <Card style={styles.summaryCard} elevation="sm">
          <Text variant="label" style={{ color: theme.text, marginBottom: SPACING.md }}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text variant="body" style={{ color: theme.textSecondary }}>Subtotal ({totalItems} items)</Text>
            <Text variant="body" style={{ color: theme.text, fontWeight: '500' }}>₹{totalPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text variant="label" style={{ color: theme.text }}>Total</Text>
            <Text variant="h4" style={{ color: theme.primary }}>₹{totalPrice}</Text>
          </View>
        </Card>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text variant="caption" style={{ color: theme.textSecondary }}>Total</Text>
          <Text variant="h3" style={{ color: theme.primary }}>₹{totalPrice}</Text>
        </View>
        <Button title="Checkout" onPress={handleCheckout} icon="arrow-forward" iconPosition="right" size="lg" />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollView: { flex: 1 },
  header: { padding: SPACING.screenPadding, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  itemsContainer: { padding: SPACING.md, gap: SPACING.sm },
  itemCard: { flexDirection: 'row', padding: SPACING.sm },
  itemThumbnail: { width: 140, height: 140, borderRadius: RADIUS.md, backgroundColor: theme.surfaceVariant, marginRight: SPACING.sm },
  itemInfo: { flex: 1, justifyContent: 'center', paddingVertical: SPACING.xxs },
  removeButton: { width: SPACING.xl, height: SPACING.xl, borderRadius: SPACING.md, backgroundColor: theme.surfaceVariant, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  summaryCard: { margin: SPACING.md, padding: SPACING.screenPadding },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: SPACING.sm },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, paddingBottom: SPACING.screenPadding, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border, ...SHADOWS.xl },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
});

export default CartScreen;
