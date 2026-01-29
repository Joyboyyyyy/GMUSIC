/**
 * Google OAuth Configuration
 * Uses ONLY the Web OAuth Client ID for all platforms (iOS, Android, Web)
 * Backend verifies the ID token using google-auth-library
 */
/**
 * Get Google Client ID from environment variable
 * MUST be the Web OAuth Client ID for backend verification
 */
export const getGoogleClientId = (): string => {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error(
      'EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set. ' +
      'Please set it to your Web OAuth Client ID in .env file.'
    );
  }
  
  console.log('[Google Auth] Using Web OAuth Client ID from EXPO_PUBLIC_GOOGLE_CLIENT_ID');
  return clientId;
};

