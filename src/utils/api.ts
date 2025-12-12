import axios from 'axios';
import Constants from 'expo-constants';

// Get API URL from environment variable or use fallback for local development
const BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://192.168.100.40:3000'; // fallback during local dev

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set auth token in axios defaults
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// Export axios instance for use in other files
export default api;

// Helper functions for backward compatibility
export async function apiGet(path: string) {
  const response = await api.get(path);
  return response.data;
}

export async function apiPost(path: string, body?: any) {
  const response = await api.post(path, body);
  return response.data;
}

// Legacy setToken function for backward compatibility
export function setToken(token: string | null) {
  setAuthToken(token);
}
