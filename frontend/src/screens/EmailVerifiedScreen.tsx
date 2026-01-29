import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { RootStackParamList } from '../navigation/types';
import { getItem, deleteItem, setItem } from '../utils/storage';
import api, { setAuthToken as setAxiosAuthToken } from '../utils/api';

const PENDING_EMAIL_KEY = 'pendingEmail';
const TOKEN_KEY = 'auth_token';
const POST_AUTH_REDIRECT_KEY = 'postAuthRedirect';

type EmailVerifiedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailVerified'>;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry an async operation
const retryWithDelay = async <T,>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) {
        console.log(`[EmailVerifiedScreen] Retry attempt ${i + 1}/${maxRetries}`);
        await delay(delayMs * (i + 1)); // Exponential backoff
      }
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`[EmailVerifiedScreen] Attempt ${i + 1} failed:`, error);
    }
  }
  throw lastError;
};

const EmailVerifiedScreen = () => {
  const navigation = useNavigation<EmailVerifiedScreenNavigationProp>();
  const route = useRoute();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Email verified successfully!');
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  // Get params from route (from deep link)
  const routeParams = route.params as { error?: string; authToken?: string } | undefined;

  useEffect(() => {
    finalizeVerification();
  }, []);

  const finalizeVerification = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[EmailVerifiedScreen] Finalizing email verification');
      console.log('[EmailVerifiedScreen] Route params:', routeParams);

      // Check for error in URL params (from deep link)
      if (routeParams?.error) {
        console.error('[EmailVerifiedScreen] Error from deep link:', routeParams.error);
        setError(routeParams.error);
        setLoading(false);
        
        // Navigate to Login after showing error
        setTimeout(() => {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ 
                name: 'Auth',
                params: {
                  screen: 'Login',
                },
              }],
            })
          );
        }, 2000);
        return;
      }

      // Check for auth token from deep link (auto-login after verification)
      if (routeParams?.authToken) {
        console.log('[EmailVerifiedScreen] Auth token received from verification - auto-login');
        setStatusMessage('Setting up your account...');
        
        const authToken = routeParams.authToken;
        
        // Set token directly in axios first (ensure it's set before any API call)
        setAxiosAuthToken(authToken);
        console.log('[EmailVerifiedScreen] Token set in axios');
        
        // Add a buffer to ensure everything is properly set
        await delay(1000);
        
        // Fetch user data from backend with retry logic
        console.log('[EmailVerifiedScreen] Fetching user profile from backend');
        setStatusMessage('Loading your profile...');
        
        try {
          // Make direct API call instead of using fetchMe (which clears token on error)
          const response = await retryWithDelay(
            async () => {
              const res = await api.get('/api/auth/me');
              return res.data;
            },
            3, // max 3 retries
            1500 // 1.5 second delay between retries
          );
          
          // Extract user from response
          const user = response?.data || response?.user || response;
          
          if (!user) {
            throw new Error('No user data received');
          }
          
          console.log('[EmailVerifiedScreen] User profile received:', {
            id: user.id,
            email: user.email,
            name: user.name,
            isVerified: user.isVerified,
          });
          
          // Use the login function to properly set user, token, and status='authenticated'
          // This ensures the user is fully logged in and can access protected features
          await useAuthStore.getState().login(user, authToken);
          console.log('[EmailVerifiedScreen] User fully logged in via login()');
          
          // Clear pending email
          try {
            await deleteItem(PENDING_EMAIL_KEY);
          } catch (e) {
            console.warn('[EmailVerifiedScreen] Failed to delete pending email:', e);
          }
          
          setLoading(false);
          setStatusMessage(`Welcome, ${user.name || 'User'}!`);
          
          // Navigate to Main app after brief delay to show success message
          setTimeout(() => {
            console.log('[EmailVerifiedScreen] Auto-login complete, navigating to Main');
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              })
            );
          }, 1500);
          return;
          
        } catch (fetchError: any) {
          console.error('[EmailVerifiedScreen] Failed to fetch user profile after retries:', fetchError);
          
          // Even if fetchMe fails, try to save the token so user can retry later
          // Save token to storage so it persists
          try {
            await setItem(TOKEN_KEY, authToken);
            console.log('[EmailVerifiedScreen] Token saved to storage for later retry');
          } catch (e) {
            console.warn('[EmailVerifiedScreen] Failed to save token:', e);
          }
          
          // Navigate to Login - user will need to login again since we couldn't verify the token
          console.log('[EmailVerifiedScreen] Redirecting to Login due to profile fetch failure');
          setStatusMessage('Please login to continue');
          setLoading(false);
          
          setTimeout(() => {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ 
                  name: 'Auth',
                  params: { screen: 'Login' },
                }],
              })
            );
          }, 1500);
          return;
        }
      }

      // No auth token in deep link - check if user already has a token in storage
      const existingToken = await getItem(TOKEN_KEY);
      
      if (existingToken) {
        // User is logged in - refresh their data
        console.log('[EmailVerifiedScreen] User has existing token, refreshing profile');
        setStatusMessage('Updating your account...');
        
        // Set token in axios
        setAxiosAuthToken(existingToken);
        useAuthStore.getState().setAuthToken(existingToken);

        // Fetch fresh user data from backend
        try {
          const me = await useAuthStore.getState().fetchMe();
          useAuthStore.getState().setUserFromBackend(me.user);
        } catch (e) {
          console.warn('[EmailVerifiedScreen] Failed to refresh profile:', e);
        }
      }

      // Clear pending email
      try {
        await deleteItem(PENDING_EMAIL_KEY);
      } catch (e) {
        console.warn('[EmailVerifiedScreen] Failed to delete pending email:', e);
      }

      setLoading(false);

      // Check for intended destination
      const redirectData = await getItem(POST_AUTH_REDIRECT_KEY);
      
      if (redirectData) {
        try {
          const { route, screen } = JSON.parse(redirectData);
          console.log('[EmailVerifiedScreen] Restoring intended destination:', { route, screen });
          
          await deleteItem(POST_AUTH_REDIRECT_KEY);
          
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: route,
                  params: screen ? { screen } : undefined,
                },
              ],
            })
          );
          return;
        } catch (parseError) {
          console.error('[EmailVerifiedScreen] Failed to parse redirect data:', parseError);
        }
      }

      // Default navigation based on login status
      if (existingToken) {
        console.log('[EmailVerifiedScreen] User logged in, navigating to Main');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      } else {
        // No token - user needs to login
        console.log('[EmailVerifiedScreen] No token, navigating to Login');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ 
              name: 'Auth',
              params: { screen: 'Login' },
            }],
          })
        );
      }
    } catch (e: any) {
      console.error('[EmailVerifiedScreen] Post-verification failed:', e);
      setError('Failed to finalize verification. Please try logging in.');
      setLoading(false);
      
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ 
              name: 'Auth',
              params: { screen: 'Login' },
            }],
          })
        );
      }, 2000);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>{statusMessage}</Text>
        <Text style={styles.loadingSubtext}>Please wait...</Text>
      </View>
    );
  }

  if (error) {
    const isLoginMessage = error.includes('try logging in') || error.includes('Please login');
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: isLoginMessage ? theme.success : theme.error }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.successText}>{statusMessage}</Text>
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textMuted,
  },
  text: {
    fontSize: 16,
    color: theme.text,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
    textAlign: 'center',
  },
  successText: {
    fontSize: 18,
    color: theme.success,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EmailVerifiedScreen;

