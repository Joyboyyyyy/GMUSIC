import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { RootStackParamList } from '../navigation/types';

const PENDING_EMAIL_KEY = 'pendingEmail';

type EmailVerifiedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmailVerified'>;

const EmailVerifiedScreen = () => {
  const navigation = useNavigation<EmailVerifiedScreenNavigationProp>();
  const route = useRoute();
  const { fetchMe } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get email from SecureStore
      const email = await SecureStore.getItemAsync(PENDING_EMAIL_KEY);

      if (!email) {
        // No pending email found, navigate to VerifyEmail or Login
        Alert.alert('No Pending Verification', 'No email verification in progress.');
        navigation.navigate('Auth', { screen: 'Login' });
        return;
      }

      // Check verification status with backend
      const res = await api.get(`/api/auth/check-verification?email=${encodeURIComponent(email)}`);
      const data = res.data?.data || res.data;

      if (data.emailVerified || data.isVerified) {
        // Email is verified
        // Delete pending email from SecureStore
        await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY);
        
        // Refresh user data
        await fetchMe();
        
        // Navigate to Main
        Alert.alert('Success', 'Email verified successfully!');
        navigation.navigate('Main', {} as any);
      } else {
        // Email not verified yet, navigate back to VerifyEmail
        navigation.navigate('Auth', { 
          screen: 'VerifyEmail', 
          params: { email } 
        });
      }
    } catch (err: any) {
      console.error('Verification check error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to check verification status');
      
      // On error, try to get email and navigate to VerifyEmail
      try {
        const email = await SecureStore.getItemAsync(PENDING_EMAIL_KEY);
        if (email) {
          navigation.navigate('Auth', { 
            screen: 'VerifyEmail', 
            params: { email } 
          });
        } else {
          navigation.navigate('Auth', { screen: 'Login' });
        }
      } catch {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Auth" as never }],
          })
        );
        navigation.navigate("Login" as never);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Checking verification status...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Processing...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  text: {
    fontSize: 16,
    color: '#1f2937',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});

export default EmailVerifiedScreen;

