/**
 * API Configuration
 * 
 * Single source of truth: EXPO_PUBLIC_API_URL environment variable
 * For standalone builds, this comes from app.config.js extra.apiUrl
 * 
 * Set in .env file for development:
 * EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
 */

import Constants from 'expo-constants';

// Try to get API URL from multiple sources
const API_URL = 
  process.env.EXPO_PUBLIC_API_URL || // Development with .env
  Constants.expoConfig?.extra?.apiUrl || // Standalone build
  'https://gmusic-ivdh.onrender.com'; // Fallback to production

if (!API_URL) {
  console.error('❌ API_URL could not be determined');
  console.error('   Falling back to production URL');
}

// Remove trailing slashes
const API_BASE_URL = API_URL.replace(/\/+$/, '');

// Log ONCE at startup
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 Source:', process.env.EXPO_PUBLIC_API_URL ? 'env' : Constants.expoConfig?.extra?.apiUrl ? 'config' : 'fallback');

/**
 * Get full API URL for a given path
 * @param path - API path (e.g., 'api/payments/razorpay/order')
 * @returns Full URL (e.g., 'https://example.com/api/payments/razorpay/order')
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanPath}`;
}

export { API_BASE_URL };

