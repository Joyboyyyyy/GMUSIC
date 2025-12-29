import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';
import { deleteItem } from '../../utils/storage';

const PENDING_EMAIL_KEY = 'pendingEmail';

type VerifyEmailScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;
type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;

const VerifyEmailScreen = () => {
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const { email } = route.params;
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { fetchMe } = useAuthStore();

  const checkVerification = async () => {
    try {
      setLoading(true);
      console.log('[VerifyEmailScreen] Checking verification for email:', email);
      
      const res = await api.get(`/api/auth/check-verification?email=${encodeURIComponent(email)}`);
      const data = res.data?.data || res.data;

      console.log('[VerifyEmailScreen] Verification status response:', data);

      if (data.emailVerified || data.isVerified) {
        // Delete pending email from storage
        await deleteItem(PENDING_EMAIL_KEY);
        
        console.log('[VerifyEmailScreen] Email verified, refreshing user data');
        // Update auth state and navigate to Main
        await fetchMe(); // Refresh user data
        
        Alert.alert('Success', 'Email verified successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Main using CommonActions.reset like LoginScreen
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              );
            },
          },
        ]);
      } else {
        Alert.alert('Not Verified', 'Your email is not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      console.error('[VerifyEmailScreen] Check verification error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      setResending(true);
      console.log('[VerifyEmailScreen] Resending verification email for:', email);
      
      await api.post('/api/auth/resend-verification', { email });
      
      console.log('[VerifyEmailScreen] Verification email resent successfully');
      Alert.alert('Email Sent', 'A new verification email has been sent. Please check your inbox.');
    } catch (error: any) {
      console.error('[VerifyEmailScreen] Resend email error:', error);
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>

      <Text style={styles.message}>
        A verification email has been sent to:
      </Text>

      <Text style={styles.email}>{email}</Text>

      <Text style={styles.message}>
        Please check your inbox and click the verification link.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={checkVerification}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.buttonText}>I Have Verified</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.resendButton]}
        onPress={resendEmail}
        disabled={resending}
      >
        {resending ? <ActivityIndicator color="#000" /> : (
          <Text style={[styles.buttonText, { color: '#000' }]}>Resend Email</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VerifyEmailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  message: { fontSize: 16, textAlign: 'center', marginVertical: 4, color: '#444' },
  email: { fontSize: 18, fontWeight: '600', textAlign: 'center', color: '#6b21a8', marginBottom: 20 },
  button: { backgroundColor: '#6b21a8', padding: 16, borderRadius: 10, alignItems: 'center', marginVertical: 10 },
  resendButton: { backgroundColor: '#e5e7eb' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

