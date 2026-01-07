import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import api from '../utils/api';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';

type EmailVerifyScreenRouteProp = RouteProp<{ EmailVerify: { token?: string } }, 'EmailVerify'>;

export default function EmailVerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute<EmailVerifyScreenRouteProp>();
  const token = route?.params?.token;
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  // REMOVED: Automatic API verification call
  // Email verification happens in backend GET /api/auth/verify-email
  // This screen is now ONLY for manual retry/resend flows
  // If user reaches here with a token, they can manually trigger verification
  
  async function handleManualVerify(t: string) {
    try {
      console.log('[EmailVerifyScreen] Manual verification triggered');
      // POST to verify-email endpoint with token in body (for manual retry only)
      const response = await api.post('/api/auth/verify-email', { token: t });
      
      console.log('[EmailVerifyScreen] Manual verification successful:', response.data);
      
      // On success, redirect to EmailVerified screen (same as email link flow)
      navigation.navigate('EmailVerified' as never);
    } catch (e: any) {
      console.error('[EmailVerifyScreen] Manual verification failed:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Verification failed. Please try again.';
      Alert.alert(
        'Verification Failed', 
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Login screen so user can try again or resend email
              navigation.navigate('Auth' as never, { screen: 'Login' } as never);
            },
          },
        ]
      );
    }
  }

  // REMOVED: Automatic verification on mount
  // This screen should NOT auto-verify tokens from deep links
  // Backend GET endpoint already verified the email
  // This screen is only for manual retry/resend flows
  useEffect(() => {
    // Do NOT auto-verify - backend already did it
    // If user manually navigates here with a token, they can trigger verification manually
    console.log('[EmailVerifyScreen] Screen loaded - no automatic verification (backend already verified)');
  }, [token]);

  // This screen is for manual retry/resend flows only
  // Email verification from email links goes directly to EmailVerifiedScreen
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Email verification screen</Text>
      <Text style={styles.subtext}>
        This screen is for manual verification only.
      </Text>
      <Text style={styles.subtext}>
        Email links automatically verify and redirect.
      </Text>
    </View>
  );
}

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  subtext: {
    marginTop: 8,
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

