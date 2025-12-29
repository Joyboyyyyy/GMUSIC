/**
 * API Configuration
 * 
 * Single source of truth: EXPO_PUBLIC_API_URL environment variable
 * 
 * Set in .env file:
 * EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  console.error('❌ EXPO_PUBLIC_API_URL is missing');
  console.error('   Set EXPO_PUBLIC_API_URL in .env file');
  throw new Error('EXPO_PUBLIC_API_URL is missing');
}

// Remove trailing slashes
const API_BASE_URL = API_URL.replace(/\/+$/, '');

// Log ONCE at startup
console.log('🔗 API Base URL:', API_BASE_URL);

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

