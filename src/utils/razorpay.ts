/**
 * Razorpay wrapper for mobile platforms
 * Uses react-native-razorpay on iOS/Android
 */
import { Alert, Platform } from 'react-native';

// Dynamically import Razorpay to handle cases where it's not available
let RazorpayCheckout: any = null;

try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  console.warn('[Razorpay] react-native-razorpay not available:', e);
}

export interface RazorpayOptions {
  description?: string;
  image?: string;
  currency?: string;
  key: string;
  amount: number;
  name?: string;
  order_id?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: {
    [key: string]: string;
  };
  [key: string]: any;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  [key: string]: any;
}

/**
 * Check if Razorpay is available on the current platform
 * @returns true if Razorpay is available
 */
export function isRazorpayAvailable(): boolean {
  return RazorpayCheckout !== null && RazorpayCheckout !== undefined;
}

/**
 * Open Razorpay checkout
 * @param options - Razorpay checkout options
 * @returns Promise with Razorpay payment response
 * @throws Error if payment fails
 */
export async function openRazorpayCheckout(options: RazorpayOptions): Promise<RazorpayResponse> {
  // Check if Razorpay is available
  if (!isRazorpayAvailable()) {
    const error = new Error('Razorpay module is not available. Please build a standalone app.');
    (error as any).code = 'MODULE_NOT_AVAILABLE';
    throw error;
  }

  // Validate required options
  if (!options.key) {
    throw new Error('Razorpay key is required');
  }
  if (!options.order_id) {
    throw new Error('Razorpay order_id is required');
  }
  if (!options.amount || options.amount <= 0) {
    throw new Error('Valid amount is required');
  }

  console.log('[Razorpay] Opening checkout with options:', {
    key: options.key ? '***' + options.key.slice(-4) : 'missing',
    order_id: options.order_id,
    amount: options.amount,
    currency: options.currency,
    name: options.name,
    description: options.description,
  });

  try {
    const result = await RazorpayCheckout.open(options);
    console.log('[Razorpay] Payment successful:', {
      payment_id: result.razorpay_payment_id,
      order_id: result.razorpay_order_id,
    });
    return result;
  } catch (error: any) {
    console.error('[Razorpay] Payment error:', error);
    
    // Handle user cancellation
    if (error.code === 'BAD_REQUEST_ERROR' || 
        error.description === 'userCancelled' ||
        error.code === 2 || // iOS cancellation code
        error.message?.includes('cancelled') ||
        error.message?.includes('canceled')) {
      const cancelError = new Error('Payment cancelled by user');
      (cancelError as any).code = 'USER_CANCELLED';
      (cancelError as any).description = 'userCancelled';
      throw cancelError;
    }
    
    // Handle network errors
    if (error.message?.includes('network') || error.message?.includes('Network')) {
      const networkError = new Error('Network error. Please check your connection and try again.');
      (networkError as any).code = 'NETWORK_ERROR';
      throw networkError;
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Show error message for Razorpay unavailability
 */
export function showRazorpayUnavailableAlert(): void {
  const message = Platform.OS === 'ios' 
    ? 'Payment processing requires the standalone app. Please download from the App Store.'
    : 'Payment processing requires the standalone app. Please download from the Play Store.';
    
  Alert.alert(
    'Payment Not Available',
    message,
    [{ text: 'OK' }]
  );
}

