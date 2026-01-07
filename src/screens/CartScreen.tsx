import React from 'react';
import {
  View,
  Text,
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
            <Ionicons name="cart-outline" size={64} color={theme.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some music courses to get started</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Main', { screen: 'Browse' })}>
            <Text style={styles.browseButtonText}>Browse Courses</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.itemCount}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</Text>
        </View>

        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.itemThumbnail} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemTeacher}>{item.teacher.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton} 
                onPress={() => handleRemoveItem(item.packId)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
            <Text style={styles.summaryValue}>₹{totalPrice}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{totalPrice}</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomTotalPrice}>₹{totalPrice}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollView: { flex: 1 },
  header: { padding: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  itemCount: { fontSize: 14, color: theme.textSecondary },
  itemsContainer: { padding: 16, gap: 12 },
  itemCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  itemThumbnail: { width: 140, height: 140, borderRadius: 12, backgroundColor: theme.surfaceVariant, marginRight: 14 },
  itemInfo: { flex: 1, justifyContent: 'center', paddingVertical: 4 },
  itemTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 6 },
  itemTeacher: { fontSize: 14, color: theme.textSecondary, marginBottom: 8 },
  itemPrice: { fontSize: 18, fontWeight: '700', color: theme.primary },
  removeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceVariant, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  summaryCard: { backgroundColor: theme.card, margin: 16, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: theme.textSecondary },
  summaryValue: { fontSize: 14, color: theme.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: theme.text },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: theme.primary },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 20, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  bottomLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 2 },
  bottomTotalPrice: { fontSize: 24, fontWeight: 'bold', color: theme.primary },
  checkoutButton: { flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, alignItems: 'center', gap: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  checkoutButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 },
  browseButton: { flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, alignItems: 'center', gap: 8 },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default CartScreen;
