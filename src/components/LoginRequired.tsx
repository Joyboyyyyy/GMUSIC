import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginRequired = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { setRedirectPath } = useAuthStore();

  const handleLoginPress = () => {
    // Set redirect path with current screen name and params
    const screenName = route.name;
    const routeParams = (route.params as any) || {};
    
    setRedirectPath({
      name: screenName,
      params: routeParams,
    });
    
    navigation.navigate('Auth', { screen: 'Login' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={80} color="#7c3aed" />
        </View>

        {/* Message */}
        <Text style={styles.title}>Login Required</Text>
        <Text style={styles.message}>
          Please login or signup to continue
        </Text>

        {/* Login Button */}
        <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
          <Text style={styles.buttonText}>Login or Signup</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: 400,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default LoginRequired;

