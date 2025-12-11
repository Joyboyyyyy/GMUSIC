import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import api from '../utils/api';

type EmailVerifyScreenRouteProp = RouteProp<{ EmailVerify: { token?: string } }, 'EmailVerify'>;

export default function EmailVerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute<EmailVerifyScreenRouteProp>();
  const token = route?.params?.token;

  async function handleVerify(t: string) {
    try {
      await api.get(`/api/auth/verify-email/${t}`);
      Alert.alert('Success', 'Email verified successfully', [
        { text: 'OK', onPress: () => navigation.navigate('Auth' as never, { screen: 'Login' } as never) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Verification failed');
    }
  }

  useEffect(() => {
    if (token) {
      handleVerify(token);
      return;
    }

    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const t = parsed?.queryParams?.token as string;
      if (t) handleVerify(t);
    });
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Verifying...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});

