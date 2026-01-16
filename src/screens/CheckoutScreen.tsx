import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// Platform-safe Razorpay wrapper
import { 
  openRazorpayCheckout, 
  isRazorpayAvailable, 
  showRazorpayUnavailableAlert,
  RazorpayOptions,
  RazorpayResponse
} from '../utils/razorpay';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import { useCartStore, CartItem } from '../store/cartStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import { getApiUrl } from '../config/api';
import { MusicPack } from '../types';
import { requireAuth } from '../utils/auth';

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CheckoutScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CheckoutScreenRouteProp>();
  const { pack, items } = route.params || {};
  const { user, status } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  // User must exist for checkout
  if (!user) {
    return null;
  }

  const { addPack } = useLibraryStore();
  const { addPurchasedCourse, addPurchasedCourses } = usePurchasedCoursesStore();
  const { clearCart, items: cartItems, getTotalPrice } = useCartStore();
  const [processing, setProcessing] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  // Determine items to process
  const checkoutItems: CartItem[] = items || (pack ? [{
    id: pack.id,
    packId: pack.id,
    title: pack.title,
    price: pack.price,
    thumbnailUrl: pack.thumbnailUrl,
    quantity: 1,
    teacher: { name: pack.teacher.name },
  }] : cartItems);

  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  // Mark payment as failed in backend
  const markPaymentAsFailed = async (paymentId: string, reason: string) => {
    try {
      const token = useAuthStore.getState().token;
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;

      await fetch(getApiUrl('api/payments/razorpay/fail'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ paymentId, reason }),
      });
      console.log('[Checkout] Payment marked as failed:', paymentId);
    } catch (err) {
      console.error('[Checkout] Failed to mark payment as failed:', err);
    }
  };

  const handlePayment = async () => {
    if (checkoutItems.length === 0) {
      Alert.alert('Error', 'No items to checkout');
      return;
    }

    requireAuth(
      status,
      navigation,
      async () => {
        setProcessing(true);

    try {
      const token = useAuthStore.getState().token;
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;

      const userId = user?.id;
      const firstItem = checkoutItems[0];
      const courseId = firstItem.packId;
      
      if (!userId) throw new Error('User ID is required for payment');
      if (!courseId) throw new Error('Course ID is required for payment');
      
      const isNumericId = /^\d+$/.test(courseId);
      
      if (isNumericId) {
        Alert.alert(
          'Test Mode Payment',
          'This is a demo course. Payment will be simulated.',
          [
            {
              text: 'Simulate Success',
              onPress: () => {
                const purchasedPackIds = checkoutItems.map((item) => item.packId).filter(Boolean);
                if (pack) addPack(pack);
                else checkoutItems.forEach((item) => {
                  if (item.packId) addPack({ id: item.packId, title: item.title, price: item.price, thumbnailUrl: item.thumbnailUrl, teacher: item.teacher } as MusicPack);
                });
                if (purchasedPackIds.length > 0) addPurchasedCourses(purchasedPackIds);
                if (items || cartItems.length > 0) clearCart();
                navigation.navigate('Library');
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        setProcessing(false);
        return;
      }
      
      console.log(`[Checkout] Creating Razorpay order - userId: ${userId}, courseId: ${courseId}`);
      
      const orderResponse = await fetch(getApiUrl('api/payments/razorpay/order'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ userId, courseId }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      const { key, order, enrollmentId } = orderData;
      
      if (!key || !order || !enrollmentId) throw new Error('Invalid response from server');

      // Store payment ID for failure handling
      setCurrentPaymentId(enrollmentId);

      const description = checkoutItems.length > 1 ? `${checkoutItems.length} Music Packs` : checkoutItems[0].title;
      
      const options = {
        description,
        image: checkoutItems[0].thumbnailUrl,
        currency: 'INR',
        key,
        amount: order.amount,
        name: 'Gretex Music Room',
        order_id: order.id,
        prefill: { 
          email: user.email || '', 
          contact: user.phone || '9999999999', 
          name: user.name || '' 
        },
        theme: { color: '#7c3aed' },
        readonly: {
          contact: true,
          email: true,
        },
      };

      if (!isRazorpayAvailable()) throw new Error('WEB_PLATFORM');
      
      let razorpayData: RazorpayResponse;
      
      try {
        razorpayData = await openRazorpayCheckout(options);
      } catch (razorpayError: any) {
        console.warn('[Checkout] Razorpay error:', razorpayError);
        
        // Mark payment as failed when user cancels or payment fails
        if (enrollmentId) {
          const reason = razorpayError?.description || razorpayError?.code || 'Payment cancelled by user';
          await markPaymentAsFailed(enrollmentId, reason);
        }
        
        if (razorpayError?.code === 'MODULE_NOT_AVAILABLE') {
          showRazorpayUnavailableAlert();
          setProcessing(false);
          return;
        }
        
        // User cancelled or payment failed
        if (razorpayError?.code === 'BAD_REQUEST_ERROR' || 
            razorpayError?.code === 'USER_CANCELLED' ||
            razorpayError?.description === 'userCancelled' ||
            razorpayError?.description?.includes('cancelled')) {
          Alert.alert(
            'Payment Cancelled',
            'You cancelled the payment. Please try again when ready.',
            [{ text: 'OK' }]
          );
          setProcessing(false);
          return;
        }
        
        // Other payment failure
        Alert.alert(
          'Payment Failed',
          'Payment could not be completed. Please try again.',
          [{ text: 'Try Again', onPress: () => setProcessing(false) }]
        );
        setProcessing(false);
        return;
      }

      // Payment successful - verify with backend
      const razorpay_payment_id = razorpayData.razorpay_payment_id;
      const razorpay_order_id = razorpayData.razorpay_order_id;
      const razorpay_signature = razorpayData.razorpay_signature;

      const verifyResponse = await fetch(getApiUrl('api/payments/razorpay/verify'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ razorpay_payment_id, razorpay_order_id, razorpay_signature, enrollmentId }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      setProcessing(false);

      if (verifyData.success === true) {
        const purchasedPackIds = checkoutItems.map((item) => item.packId).filter(Boolean);
        if (purchasedPackIds.length > 0) addPurchasedCourses(purchasedPackIds);
        if (items || cartItems.length > 0) clearCart();

        if (purchasedPackIds.length === 1) {
          navigation.navigate('PaymentSuccess', { packId: purchasedPackIds[0] });
        } else if (purchasedPackIds.length > 1) {
          navigation.navigate('PaymentSuccess', { packIds: purchasedPackIds });
        } else {
          navigation.navigate('PaymentSuccess', {});
        }
      } else {
        Alert.alert('Verification Failed', 'Please try again.');
      }
    } catch (error: any) {
      setProcessing(false);

      // Mark payment as failed for any error
      if (currentPaymentId) {
        await markPaymentAsFailed(currentPaymentId, error.message || 'Unknown error');
      }

      if (error.code === 'BAD_REQUEST_ERROR' || error.code === 'USER_CANCELLED' || error.description === 'userCancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment. Please try again when ready.');
        return;
      }

      Alert.alert('Payment Error', error.message || 'Payment failed. Please try again.');
      console.error('[Checkout] Payment error:', error);
    }
      },
      'Please login to continue with payment'
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.userCard}>
            <Image source={{ uri: user?.profilePicture || user?.avatar || 'https://i.pravatar.cc/300' }} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'})</Text>
          {checkoutItems.map((item) => (
            <View key={item.id} style={styles.orderCard}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.packThumbnail} />
              <View style={styles.packInfo}>
                <Text style={styles.packTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.packTeacher}>{item.teacher.name}</Text>
                <Text style={styles.packPrice}>₹{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'})</Text>
              <Text style={styles.priceValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{tax}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{total}</Text>
            </View>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={20} color={theme.success} />
          <Text style={styles.securityText}>Secure payment powered by industry-standard encryption</Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total Payable</Text>
          <Text style={styles.bottomPrice}>₹{total}</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handlePayment} disabled={processing}>
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>Complete Payment</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: theme.textSecondary },
  orderCard: { flexDirection: 'row', backgroundColor: theme.card, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 12 },
  packThumbnail: { width: 100, height: 100, borderRadius: 8, marginRight: 12, backgroundColor: theme.surfaceVariant },
  packInfo: { flex: 1, justifyContent: 'center' },
  packTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 6 },
  packTeacher: { fontSize: 13, color: theme.textSecondary, marginBottom: 8 },
  packPrice: { fontSize: 16, fontWeight: 'bold', color: theme.primary, marginTop: 4 },
  priceCard: { backgroundColor: theme.card, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontSize: 15, color: theme.textSecondary },
  priceValue: { fontSize: 15, color: theme.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: theme.primary },
  securityNotice: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.successLight, padding: 16, marginHorizontal: 20, marginBottom: 20, borderRadius: 12, gap: 12 },
  securityText: { flex: 1, fontSize: 13, color: theme.success },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: theme.card, borderTopWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  bottomLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  bottomPrice: { fontSize: 24, fontWeight: 'bold', color: theme.primary },
  payButton: { flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center', gap: 8 },
  payButtonText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
});

export default CheckoutScreen;
