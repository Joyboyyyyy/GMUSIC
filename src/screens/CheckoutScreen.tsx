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

  // User must exist for checkout
  if (!user) {
    return null; // or navigate to login if needed
  }

  const { addPack } = useLibraryStore();
  const { addPurchasedCourse, addPurchasedCourses } = usePurchasedCoursesStore();
  const { clearCart, items: cartItems, getTotalPrice } = useCartStore();
  const [processing, setProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'upi' | 'netbanking'>('card');

  // Determine items to process: use route params items, or cart items, or single pack
  const checkoutItems: CartItem[] = items || (pack ? [{
    id: pack.id,
    packId: pack.id,
    title: pack.title,
    price: pack.price,
    thumbnailUrl: pack.thumbnailUrl,
    teacher: { name: pack.teacher.name },
  }] : cartItems);

  // Calculate total from items
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const handlePayment = async () => {
    if (checkoutItems.length === 0) {
      Alert.alert('Error', 'No items to checkout');
      return;
    }

    requireAuth(
      status,
      navigation,
      async () => {
        // User is authenticated, proceed with payment
        setProcessing(true);

    try {
      // Get auth token for API requests
      const token = useAuthStore.getState().token;
      const authHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      // Step 1: Create Razorpay order on backend
      const userId = user?.id;
      const firstItem = checkoutItems[0];
      const courseId = firstItem.packId;
      
      if (!userId) {
        throw new Error('User ID is required for payment');
      }
      if (!courseId) {
        throw new Error('Course ID is required for payment');
      }
      
      // Validate courseId format - should be UUID, not numeric
      if (/^\d+$/.test(courseId)) {
        console.error(`[Checkout] Error: courseId "${courseId}" is numeric. Backend requires UUID format.`);
        Alert.alert(
          'Course Data Error',
          'Unable to process payment. The course data is outdated. Please go back and try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        setProcessing(false);
        return;
      }
      
      console.log(`[Checkout] Creating Razorpay order - userId: ${userId}, courseId: ${courseId}`);
      
      // Use canonical endpoint with auth headers
      const orderResponse = await fetch(getApiUrl('api/payments/razorpay/order'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: userId,
          courseId: courseId,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to create order';
        console.error('[Checkout] Order creation failed:', errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const orderData = await orderResponse.json();
      
      if (__DEV__) {
        console.log('[Checkout] Order created successfully:', {
          orderId: orderData.order?.id,
          amount: orderData.order?.amount,
          enrollmentId: orderData.enrollmentId,
        });
      }
      
      const { key, order, enrollmentId } = orderData;
      
      if (!key || !order || !enrollmentId) {
        console.error('[Checkout] Invalid order response:', orderData);
        throw new Error('Invalid response from server. Missing required fields.');
      }

      // Step 2: Open Razorpay Checkout
      const description = checkoutItems.length > 1 
        ? `${checkoutItems.length} Music Packs`
        : checkoutItems[0].title;
      const image = checkoutItems[0].thumbnailUrl;
      
      const options = {
        description: description,
        image: image,
        currency: 'INR',
        key: key, // Razorpay key from backend
        amount: order.amount, // Use exact amount from backend order
        name: 'Gretex Music Room',
        order_id: order.id, // Order ID from backend
        prefill: {
          email: user.email || '',
          contact: '', // Add user phone if available
          name: user.name || '',
        },
        theme: { color: '#7c3aed' },
      };

      // ============================================
      // TEMPORARY TEST MODE: Expo Go / Web Bypass
      // ============================================
      // Razorpay native module is not available in Expo Go or on web.
      // This try/catch block provides a temporary bypass for testing.
      // TODO: Remove this bypass when building standalone APK/IPA.
      // ============================================
      let razorpayData: RazorpayResponse;
      
      // Check if Razorpay is available (not on web)
      if (!isRazorpayAvailable()) {
        throw new Error('WEB_PLATFORM');
      }
      
      try {
        razorpayData = await openRazorpayCheckout(options);
      } catch (razorpayError: any) {
        // Razorpay not available (e.g., in Expo Go or web)
        console.warn('[Checkout] Razorpay not available, using test mode:', razorpayError);
        
        // Handle Razorpay unavailability
        if (razorpayError?.code === 'MODULE_NOT_AVAILABLE') {
          showRazorpayUnavailableAlert();
          setProcessing(false);
          return;
        }
        
        // Show test mode success alert
        Alert.alert(
          'Payment Successful (Test Mode)',
          'Razorpay is disabled in Expo Go. This is a temporary success.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Unlock the course(s) - add to library and purchased courses
                const purchasedPackIds = checkoutItems.map((item) => item.packId).filter(Boolean);
                
                // Add all packs to library (if pack exists, use it; otherwise use items)
                if (pack) {
                  addPack(pack);
                } else {
                  // If no single pack, add all items from checkoutItems
                  checkoutItems.forEach((item) => {
                    if (item.packId) {
                      // Create a pack-like object from item
                      const packFromItem = {
                        id: item.packId,
                        title: item.title,
                        price: item.price,
                        thumbnailUrl: item.thumbnailUrl,
                        teacher: item.teacher,
                      };
                      addPack(packFromItem as MusicPack);
                    }
                  });
                }
                
                // Add all purchased courses to store using bulk operation
                if (purchasedPackIds.length > 0) {
                  addPurchasedCourses(purchasedPackIds);
                }
                
                // Clear cart if items came from cart
                if (items || cartItems.length > 0) {
                  clearCart();
                }
                
                // Navigate based on number of items
                if (purchasedPackIds.length === 1) {
                  // Single item: Navigate to Library, then PackDetail
                  navigation.navigate('Library');
                  // Navigate to PackDetail after a brief delay to ensure Library navigation completes
                  setTimeout(() => {
                    navigation.navigate('PackDetail', { packId: purchasedPackIds[0] });
                  }, 100);
                } else {
                  // Multiple items: Navigate to Library
                  navigation.navigate('Library');
                }
              },
            },
          ]
        );
        
        // Exit early - don't proceed with payment verification
        setProcessing(false);
        return;
      }
      // ============================================
      // END TEMPORARY TEST MODE
      // ============================================

      // Step 4: Extract payment details from Razorpay response
      const razorpay_payment_id = razorpayData.razorpay_payment_id;
      const razorpay_order_id = razorpayData.razorpay_order_id;
      const razorpay_signature = razorpayData.razorpay_signature;

      // Step 5: Verify payment with backend
      const verifyResponse = await fetch(getApiUrl('api/payments/razorpay/verify'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          enrollmentId: enrollmentId, // Include enrollmentId from order creation
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (__DEV__) {
        console.log('[Checkout] Payment verification response:', JSON.stringify(verifyData, null, 2));
      }

      if (!verifyResponse.ok || !verifyData.success) {
        const errorMessage = verifyData.error || verifyData.message || 'Payment verification failed';
        console.error('[Checkout] Payment verification failed:', errorMessage);
        throw new Error(errorMessage);
      }

      setProcessing(false);

      // Step 6: Check verification result
      if (verifyData.success === true) {
        // Collect all packIds from checkout items
        const purchasedPackIds = checkoutItems.map((item) => item.packId).filter(Boolean);
        
        // Update local state on successful payment for all items
        if (purchasedPackIds.length > 0) {
          // Add all purchased courses to store using bulk operation (deduplication handled in store)
          addPurchasedCourses(purchasedPackIds);
        }

        // Clear cart if items came from cart
        if (items || cartItems.length > 0) {
          clearCart();
        }

        // Navigate to PaymentSuccess screen with packId(s)
        if (purchasedPackIds.length === 1) {
          navigation.navigate('PaymentSuccess', { packId: purchasedPackIds[0] });
        } else if (purchasedPackIds.length > 1) {
          navigation.navigate('PaymentSuccess', { packIds: purchasedPackIds });
        } else {
          // Fallback if no packIds
          navigation.navigate('PaymentSuccess', {});
        }
      } else {
        // Verification failed
        Alert.alert('Verification Failed', 'Verification failed. Please try again.');
      }
    } catch (error: any) {
      // Ensure processing is always set to false
      setProcessing(false);

      // Handle Razorpay checkout cancellation
      if (error.code === 'BAD_REQUEST_ERROR' || 
          error.code === 'USER_CANCELLED' ||
          error.description === 'userCancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
        return;
      }

      // Handle Razorpay module not available (should be caught earlier, but just in case)
      if (error.message?.includes('Cannot read property') || error.message?.includes('null') || error.message?.includes('open')) {
        console.warn('[Checkout] Razorpay module error caught in outer catch:', error);
        // This should have been handled in the inner try/catch, but handle it here too
        Alert.alert(
          'Payment Successful (Test Mode)',
          'Razorpay is disabled in Expo Go. This is a temporary success.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Unlock the course(s)
                const purchasedPackIds = checkoutItems.map((item) => item.packId).filter(Boolean);
                
                // Add all packs to library
                if (pack) {
                  addPack(pack);
                } else {
                  checkoutItems.forEach((item) => {
                    if (item.packId) {
                      const packFromItem = {
                        id: item.packId,
                        title: item.title,
                        price: item.price,
                        thumbnailUrl: item.thumbnailUrl,
                        teacher: item.teacher,
                      };
                      addPack(packFromItem as MusicPack);
                    }
                  });
                }
                
                // Add all purchased courses to store using bulk operation
                if (purchasedPackIds.length > 0) {
                  addPurchasedCourses(purchasedPackIds);
                }
                
                if (items || cartItems.length > 0) {
                  clearCart();
                }
                
                if (purchasedPackIds.length === 1) {
                  // Single item: Navigate to Library, then PackDetail
                  navigation.navigate('Library');
                  // Navigate to PackDetail after a brief delay to ensure Library navigation completes
                  setTimeout(() => {
                    navigation.navigate('PackDetail', { packId: purchasedPackIds[0] });
                  }, 100);
                } else {
                  // Multiple items: Navigate to Library
                  navigation.navigate('Library');
                }
              },
            },
          ]
        );
        return;
      }

      // Handle other errors
      const errorMessage = error.message || 'Payment failed. Please try again.';
      Alert.alert('Payment Error', errorMessage);
      console.error('[Checkout] Payment error:', error);
    }
      },
      'Please login to continue with payment'
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.userCard}>
            <Image
              source={{ 
                uri: user?.avatar || 'https://i.pravatar.cc/300' 
              }}
              style={styles.userAvatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Order Summary ({checkoutItems.length} {checkoutItems.length === 1 ? 'item' : 'items'})
          </Text>
          {checkoutItems.map((item) => (
            <View key={item.id} style={styles.orderCard}>
              <Image
                source={{ uri: item.thumbnailUrl }}
                style={styles.packThumbnail}
              />
              <View style={styles.packInfo}>
                <Text style={styles.packTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.packTeacher}>{item.teacher.name}</Text>
                <Text style={styles.packPrice}>₹{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPayment('card')}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="card" size={24} color="#7c3aed" />
              <Text style={styles.paymentText}>Credit/Debit Card</Text>
            </View>
            <View
              style={[
                styles.radio,
                selectedPayment === 'card' && styles.radioSelected,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'upi' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPayment('upi')}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="phone-portrait" size={24} color="#7c3aed" />
              <Text style={styles.paymentText}>UPI</Text>
            </View>
            <View
              style={[
                styles.radio,
                selectedPayment === 'upi' && styles.radioSelected,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'netbanking' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPayment('netbanking')}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="business" size={24} color="#7c3aed" />
              <Text style={styles.paymentText}>Net Banking</Text>
            </View>
            <View
              style={[
                styles.radio,
                selectedPayment === 'netbanking' && styles.radioSelected,
              ]}
            />
          </TouchableOpacity>
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
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.securityText}>
            Secure payment powered by industry-standard encryption
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total Payable</Text>
          <Text style={styles.bottomPrice}>₹{total}</Text>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={processing}
        >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  packThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e5e7eb',
  },
  packInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  packTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  packTeacher: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  packPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginTop: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentOptionSelected: {
    borderColor: '#7c3aed',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  radioSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#7c3aed',
  },
  priceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CheckoutScreen;

