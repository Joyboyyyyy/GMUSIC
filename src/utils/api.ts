import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Block requests if API_BASE_URL is invalid
if (!API_BASE_URL || API_BASE_URL === '') {
  console.error('❌ API_BASE_URL is invalid - API requests will fail');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`[API] Full URL: ${config.baseURL}${config.url}`);
      console.log(`[API] Request body:`, config.data);
      console.log(`[API] Content-Type:`, config.headers['Content-Type']);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      console.error('[API] Network Error - Cannot reach server');
      console.error('[API] Base URL:', API_BASE_URL);
      console.error('[API] Request URL:', error.config?.url);
      console.error('[API] Full URL:', `${API_BASE_URL}${error.config?.url}`);
      console.error('[API] Error Code:', error.code);
      console.error('[API] Error Message:', error.message);
      
      // Provide helpful troubleshooting info
      console.error('[API] Troubleshooting:');
      console.error('  1. Ensure backend server is running');
      console.error('  2. Check if backend is accessible at:', API_BASE_URL);
      console.error('  3. Verify EXPO_PUBLIC_API_URL in .env matches backend URL');
      console.error('  4. Restart Expo dev server after changing .env');
      console.error('  5. Clear Expo cache: npx expo start --clear');
      
      // Enhance error message for better user feedback
      error.userMessage = `Cannot connect to server at ${API_BASE_URL}. Please ensure the backend server is running.`;
    }
    return Promise.reject(error);
  }
);

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
