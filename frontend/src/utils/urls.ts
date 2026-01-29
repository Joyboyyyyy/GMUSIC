/**
 * Platform-aware URL utilities for mobile deep links
 */
import * as Linking from 'expo-linking';

// Get the app scheme from environment or default
const APP_SCHEME = 'gretexmusicroom';

/**
 * Generate a URL for email verification completion
 * @param error - Optional error message
 * @returns Deep link
 */
export function getEmailVerifiedUrl(error?: string): string {
  const deepLink = `${APP_SCHEME}://email-verified`;
  if (error) {
    return `${deepLink}?error=${encodeURIComponent(error)}`;
  }
  return deepLink;
}

/**
 * Generate a URL for password reset
 * @param token - Password reset token
 * @returns Deep link
 */
export function getResetPasswordUrl(token: string): string {
  return `${APP_SCHEME}://reset-password?token=${encodeURIComponent(token)}`;
}

/**
 * Generate a URL for email verification (manual retry)
 * @param token - Verification token
 * @returns Deep link
 */
export function getVerifyEmailUrl(token: string): string {
  return `${APP_SCHEME}://verify-email?token=${encodeURIComponent(token)}`;
}

/**
 * Check if a URL is a deep link (custom scheme)
 */
export function isDeepLink(url: string): boolean {
  return url.startsWith(`${APP_SCHEME}://`);
}

/**
 * Check if a URL is a web URL
 */
export function isWebUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Normalize a URL to extract the path and query params
 * Works for both deep links and web URLs
 */
export function normalizeUrl(url: string): { path: string; params: Record<string, string> } {
  const parsed = Linking.parse(url);
  
  // Extract path (remove scheme and host)
  let path = '';
  if (isDeepLink(url)) {
    // Deep link: gretexmusicroom://email-verified -> email-verified
    path = url.replace(`${APP_SCHEME}://`, '').split('?')[0];
  } else if (isWebUrl(url)) {
    // Web URL: https://example.com/email-verified -> /email-verified
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname.replace(/^\/+/, ''); // Remove leading slashes
    } catch (e) {
      // Fallback parsing
      path = url.split('://')[1]?.split('/').slice(1).join('/').split('?')[0] || '';
    }
  }
  
  // Extract query params
  const params: Record<string, string> = {};
  if (parsed.queryParams) {
    Object.entries(parsed.queryParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        params[key] = value;
      }
    });
  }
  
  return { path, params };
}

