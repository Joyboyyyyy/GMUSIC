import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * Automatically detects if running on real device or simulator/emulator
 * - Real device: Uses LAN IP address (update LAN_IP below)
 * - Simulator/Emulator: Uses localhost
 * 
 * To find your computer's LAN IP:
 * - Windows: Run `ipconfig` and look for IPv4 Address
 * - Mac/Linux: Run `ifconfig` and look for inet address
 * 
 * For production, set the production URL below
 */

// Update this with your computer's LAN IP address for device testing
const LAN_IP = '192.168.100.40'; // Change this to your computer's IP

// Determine if running on real device
// On simulators, Platform.constants.systemName often differs
const isRealDevice = (): boolean => {
  // Simple heuristic: check if running on physical device
  // This works for most cases, but may need adjustment based on your setup
  if (Platform.OS === 'android') {
    // Android emulator typically reports 'sdk' as the product
    // Real devices have actual product names
    return Platform.constants.Brand !== 'generic';
  } else if (Platform.OS === 'ios') {
    // iOS simulator reports 'iPhone Simulator'
    return Platform.constants.systemName !== 'iOS';
  }
  // Default: assume real device if we can't determine
  return true;
};

// Get base URL based on environment
const getBaseURL = (): string => {
  if (!__DEV__) {
    // Production
    return 'https://your-production-api.com';
  }
  
  // Development mode
  // For real devices, use LAN IP; for simulators, use localhost
  // Note: You can also manually set this by checking if device connects
  // via USB/network and adjusting accordingly
  
  // Option 1: Auto-detect (may need adjustment)
  // Uncomment below if you want auto-detection
  // if (isRealDevice()) {
  //   return `http://${LAN_IP}:3000`;
  // } else {
  //   return 'http://localhost:3000';
  // }
  
  // Option 2: Manual detection via environment variable or config
  // For now, defaulting to LAN IP for device testing
  // Change to 'localhost' if testing on simulator
  const USE_LAN_IP = true; // Set to false for simulator testing
  
  if (USE_LAN_IP) {
    return `http://${LAN_IP}:3000`;
  } else {
    return 'http://localhost:3000';
  }
};

export const API_BASE_URL = getBaseURL();

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove ALL leading slashes to prevent double slashes
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  // Ensure API_BASE_URL doesn't have trailing slash and cleanEndpoint doesn't have leading slash
  const baseUrl = API_BASE_URL.replace(/\/+$/, ''); // Remove trailing slashes
  return `${baseUrl}/${cleanEndpoint}`;
};

// Export utility functions for debugging
export const getApiConfig = () => ({
  baseURL: API_BASE_URL,
  platform: Platform.OS,
  isDev: __DEV__,
  lanIP: LAN_IP,
});

