import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../../store/authStore';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithCredentials, loginWithGoogle, loginWithApple, redirectPath, clearRedirectPath, loading } = useAuthStore();

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleLogin(response.authentication?.accessToken);
    }
  }, [response]);

  const handleLogin = async () => {
    try {
      const { user, token } = await loginWithCredentials(email, password);
      
      // Call login to store in SecureStore and set axios token
      await login(user, token);
      
      // Handle redirect to originally requested screen
      const currentRedirectPath = redirectPath;
      if (currentRedirectPath) {
        clearRedirectPath();
        
        const screenName = currentRedirectPath.name;
        const screenParams = currentRedirectPath.params || {};
        
        // Protected tab screens (Library, Profile, Dashboard) are in MainNavigator
        // Stack screens (Checkout, Chat, etc.) need to be navigated after Main
        if (screenName === 'Library' || screenName === 'Profile' || screenName === 'Dashboard') {
          // Navigate to Main tab navigator, then to the specific tab
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { 
                  name: 'Main', 
                  params: { screen: screenName } 
                }
              ],
            })
          );
        } else {
          // For stack screens, navigate to Main first, then to the screen with params
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'Main' },
                { name: screenName as never, params: screenParams as never }
              ],
            })
          );
        }
      } else {
        // No redirect path: navigate to Main (Home tab)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
    }
  };

  const handleGoogleLogin = async (accessToken?: string) => {
    if (!accessToken) return;

    try {
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const googleUser = await userInfoResponse.json();
      loginWithGoogle(googleUser);
      
      // Handle redirect if exists
      const currentRedirectPath = redirectPath;
      if (currentRedirectPath) {
        clearRedirectPath();
        
        const screenName = currentRedirectPath.name;
        const screenParams = currentRedirectPath.params || {};
        
        // Protected tab screens (Library, Profile, Dashboard) are in MainNavigator
        if (screenName === 'Library' || screenName === 'Profile' || screenName === 'Dashboard') {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { 
                  name: 'Main', 
                  params: { screen: screenName } 
                }
              ],
            })
          );
        } else {
          // For stack screens, navigate to Main first, then to the screen with params
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'Main' },
                { name: screenName as never, params: screenParams as never }
              ],
            })
          );
        }
      } else {
        // Navigate to Home after successful Google login
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Google login failed');
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      loginWithApple(credential);
      
      // Handle redirect if exists
      const currentRedirectPath = redirectPath;
      if (currentRedirectPath) {
        clearRedirectPath();
        
        const screenName = currentRedirectPath.name;
        const screenParams = currentRedirectPath.params || {};
        
        // Protected tab screens (Library, Profile, Dashboard) are in MainNavigator
        if (screenName === 'Library' || screenName === 'Profile' || screenName === 'Dashboard') {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { 
                  name: 'Main', 
                  params: { screen: screenName } 
                }
              ],
            })
          );
        } else {
          // For stack screens, navigate to Main first, then to the screen with params
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                { name: 'Main' },
                { name: screenName as never, params: screenParams as never }
              ],
            })
          );
        }
      } else {
        // Navigate to Home after successful Apple login
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          })
        );
      }
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return;
      }
      Alert.alert('Error', 'Apple login failed');
    }
  };

  const handleGoogleSignIn = () => {
    if (promptAsync) {
      promptAsync();
    } else {
      Alert.alert('Error', 'Google Sign In is not available');
    }
  };

  return (
    <LinearGradient colors={['#5b21b6', '#7c3aed', '#a78bfa']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🎵</Text>
          <Text style={styles.title}>Gretex Music Room</Text>
          <Text style={styles.subtitle}>Learn music from the best</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!email.trim() || !password.trim()) && { opacity: 0.5 },
            ]}
            disabled={!email.trim() || !password.trim() || loading}
            onPress={() => {
              if (!email.trim() || !password.trim()) {
                return Alert.alert('Login Error', 'Please enter email and password.');
              }
              handleLogin();
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={!request || loading}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleLogin}
                disabled={loading}
              >
                <Ionicons name="logo-apple" size={20} color="#000" />
                <Text style={[styles.socialButtonText, { color: '#000' }]}>
                  Apple
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Signup' as never)}
          >
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e9d5ff',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#e9d5ff',
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c4b5fd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#e9d5ff',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default LoginScreen;
