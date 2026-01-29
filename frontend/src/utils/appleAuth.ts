/**
 * Platform-safe Apple Authentication wrapper
 * Uses expo-apple-authentication on iOS only
 * Returns null/throws appropriate errors on other platforms
 */
import { Platform, Alert } from 'react-native';

let AppleAuthentication: any = null;

if (Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch (e) {
    console.warn('[AppleAuth] expo-apple-authentication not available');
  }
}

export interface AppleAuthCredential {
  user: string;
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
  identityToken: string | null;
  authorizationCode: string | null;
  realUserStatus: number;
  state: string | null;
}

export const AppleAuthenticationScope = {
  FULL_NAME: 'FULL_NAME',
  EMAIL: 'EMAIL',
} as const;

export interface AppleAuthOptions {
  requestedScopes?: string[];
}

/**
 * Check if Apple Authentication is available on the current platform
 * @returns true if Apple Authentication is available (iOS only), false otherwise
 */
export function isAppleAuthAvailable(): boolean {
  return Platform.OS === 'ios' && AppleAuthentication !== null;
}

/**
 * Sign in with Apple
 * @param options - Apple Authentication options
 * @returns Promise with Apple credential
 * @throws Error if Apple Authentication is not available or sign-in fails
 */
export async function signInWithApple(
  options: AppleAuthOptions = {}
): Promise<AppleAuthCredential> {
  if (Platform.OS !== 'ios') {
    const error = new Error('Apple Sign In is only available on iOS devices');
    (error as any).code = 'NOT_IOS';
    throw error;
  }

  if (!AppleAuthentication) {
    const error = new Error('Apple Authentication module is not available');
    (error as any).code = 'MODULE_NOT_AVAILABLE';
    throw error;
  }

  try {
    const requestedScopes = options.requestedScopes || [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ];

    return await AppleAuthentication.signInAsync({
      requestedScopes,
    });
  } catch (error: any) {
    // Re-throw with additional context
    if (error.code === 'ERR_REQUEST_CANCELED') {
      // User cancelled - this is expected behavior
      throw error;
    }
    // Other errors
    throw error;
  }
}

/**
 * Show platform-appropriate error message for Apple Auth unavailability
 */
export function showAppleAuthUnavailableAlert(): void {
  Alert.alert(
    'Not Available',
    'Apple Sign In is only available on iOS devices.',
    [{ text: 'OK' }]
  );
}

