import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  openRazorpayCheckout, 
  isRazorpayAvailable, 
  showRazorpayUnavailableAlert,
  RazorpayOptions,
  RazorpayResponse
} from '../utils/razorpay';
import { getApiUrl } from '../config/api';

const PaymentTestScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    setLoading(true);

    try {
      // Step 1: Call backend to create Razorpay order
      console.log('Creating Razorpay order...');
      
      // Test UUIDs - Replace these with actual IDs from your database
      // Valid UUID format for PostgreSQL
      const TEST_USER_ID = 'd211d2e3-32a0-412f-910d-0fa92ecbfde8';
      const TEST_COURSE_ID = '7503bea9-90ba-450e-b052-687a7fef41bc';
      
      const response = await fetch(getApiUrl('api/payments/razorpay/order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          courseId: TEST_COURSE_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();
      console.log('Order created:', JSON.stringify(data, null, 2));

      // Step 2: Extract fields from response
      const { key, order, enrollmentId } = data;

      // Step 3: Prepare options object (using exact structure as requested)
      const options: RazorpayOptions = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Test Payment',
        description: 'React Native Razorpay Test Transaction',
        order_id: data.order.id,
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        theme: { color: '#3399cc' },
      };

      console.log('Opening Razorpay checkout with options:', JSON.stringify(options, null, 2));

      // Check if Razorpay is available
      if (!isRazorpayAvailable()) {
        showRazorpayUnavailableAlert();
        setLoading(false);
        return;
      }

      // Step 4: Open Razorpay Checkout
      const razorpayResponse = await openRazorpayCheckout(options);

      // Step 5: Extract payment details
      const razorpay_payment_id = razorpayResponse.razorpay_payment_id;
      const razorpay_order_id = razorpayResponse.razorpay_order_id;
      const razorpay_signature = razorpayResponse.razorpay_signature;

      console.log('Payment Success:', JSON.stringify(razorpayResponse, null, 2));

      // Step 6: Verify payment with backend
      console.log('Verifying payment with backend...');
      const verifyResponse = await fetch(getApiUrl('api/payments/razorpay/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          enrollmentId: enrollmentId, // Include enrollmentId from order creation
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log('Verification response:', JSON.stringify(verifyData, null, 2));

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      if (verifyData.success === true) {
        navigation.navigate('PaymentSuccess' as never);
      } else {
        Alert.alert('Verification Failed', 'Verification failed. Please try again.');
      }

    } catch (error: any) {
      console.error('Payment Error:', error);

      // Handle Razorpay cancellation
      if (error.code === 'BAD_REQUEST_ERROR' || error.description === 'userCancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
        return;
      }

      // Handle other errors
      const errorMessage = error.message || 'Payment failed. Please try again.';
      Alert.alert('Payment Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Razorpay Payment Test</Text>
          <Text style={styles.subtitle}>
            Test Razorpay integration with test mode
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Backend API:</Text>
            <Text style={styles.infoText}>{getApiUrl('api/payments/razorpay/order')}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Platform:</Text>
            <Text style={styles.infoText}>{Platform.OS}</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3399cc" />
              <Text style={styles.loadingText}>Processing payment...</Text>
            </View>
          ) : (
            <Button title="Pay Now" onPress={startPayment} color="#3399cc" />
          )}

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>Test Instructions:</Text>
            <Text style={styles.instructionsText}>
              • Use test card: 4111 1111 1111 1111{'\n'}
              • Any future expiry date{'\n'}
              • Any 3-digit CVV{'\n'}
              • Check console logs for detailed response
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3399cc',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  instructionsBox: {
    marginTop: 30,
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
});

export default PaymentTestScreen;

