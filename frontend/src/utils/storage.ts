/**
 * Platform-aware storage utility
 * - Native (iOS/Android): Uses SecureStore for encrypted storage
 * - Web: Uses localStorage for persistent storage
 * 
 * This module provides a unified storage API across platforms.
 * All storage operations should use this abstraction instead of direct SecureStore/AsyncStorage/localStorage calls.
 */
export { setItem, getItem, deleteItem, isAvailable as isSecureStoreAvailable } from './secureStore';

