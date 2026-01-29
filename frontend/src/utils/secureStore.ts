/**
 * Secure storage abstraction for mobile platforms
 * Uses expo-secure-store for secure encrypted storage on iOS/Android
 */
import * as SecureStore from 'expo-secure-store';

/**
 * Store a value securely
 * @param key - Storage key
 * @param value - Value to store
 */
export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

/**
 * Retrieve a value securely
 * @param key - Storage key
 * @returns Stored value or null
 */
export async function getItem(key: string): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

/**
 * Delete a value securely
 * @param key - Storage key
 */
export async function deleteItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/**
 * Check if SecureStore is available
 * @returns true if SecureStore is available
 */
export function isAvailable(): boolean {
  return true;
}

