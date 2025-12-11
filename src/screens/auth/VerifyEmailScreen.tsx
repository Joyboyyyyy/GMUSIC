import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const PENDING_EMAIL_KEY = 'pendingEmail';

type VerifyEmailScreenRouteProp = RouteProp<AuthStackParamList, 'VerifyEmail'>;
type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;

interface Props {
  route: VerifyEmailScreenRouteProp;
  navigation: VerifyEmailScreenNavigationProp;
}

const VerifyEmailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { fetchMe } = useAuthStore();

  const checkVerification = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/auth/check-verification?email=${encodeURIComponent(email)}`);
      const data = res.data?.data || res.data;

      if (data.emailVerified || data.isVerified) {
        // Delete pending email from SecureStore
        await SecureStore.deleteItemAsync(PENDING_EMAIL_KEY);
        
        Alert.alert('Success', 'Email verified successfully!');
        // Update auth state and navigate to Main
        await fetchMe(); // Refresh user data
        navigation.navigate('Main' as never);
      } else {
        Alert.alert('Not Verified', 'Your email is not verified yet. Please check your inbox.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      setResending(true);
      await api.post('/api/auth/resend-verification', { email });
      Alert.alert('Email Sent', 'A new verification email has been sent.');
    } catch (error: any) {
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

