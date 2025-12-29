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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from '../../navigation/types';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
// Platform-safe Apple Authentication wrapper
import { 
  signInWithApple, 
  isAppleAuthAvailable, 
  showAppleAuthUnavailableAlert,
  AppleAuthCredential,
  AppleAuthenticationScope
} from '../../utils/appleAuth';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

WebBrowser.maybeCompleteAuthSession();

type LoginNav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen = () => {
  const navigation = useNavigation<LoginNav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, loginWithCredentials, loginWithGoogle, loginWithApple, redirectPath, clearRedirectPath, loading } = useAuthStore();

  // Google OAuth configuration - uses Web Client ID only
  // Backend verifies the ID token using google-auth-library
  // useProxy: true REQUIRED for Web Client ID to avoid "Custom scheme URIs not allowed" error
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // WEB client ID only
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
    useProxy: true, // 🔥 REQUIRED - Use Expo Auth Proxy (https://auth.expo.io)
    // Do NOT set redirectUri - Expo proxy handles this automatically
    // Do NOT use makeRedirectUri({ scheme }) - Not needed with useProxy: true
  } as any); // Type assertion needed for useProxy property

  useEffect(() => {
    if (response?.type === 'success') {
      // Extract idToken from response
      const idToken = response.authentication?.idToken;
      if (idToken) {
        console.log('[Google Auth] ID token received, sending to backend for verification');
        handleGoogleLogin(idToken);
      } else {
        console.error('[Google Auth] No idToken in response:', response);
        Alert.alert('Error', 'Failed to get ID token from Google');
      }
    } else if (response?.type === 'error') {
      console.error('[Google Auth] OAuth error:', response.error);
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
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
      // Show clear error message
      const errorMessage = e.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    if (!idToken) {
      Alert.alert('Error', 'No ID token received from Google');
      return;
    }

    try {
      console.log('[Google Auth] Sending ID token to backend for verification');
      
      // Send idToken to backend for verification
      // Backend will verify using google-auth-library and return { user, token }
      const response = await api.post('/api/auth/google', { idToken });
      
      const responseData = response.data;
      const payload = responseData?.data || responseData;
      const user = payload?.user || payload;
      const token = payload?.token || responseData?.token;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      if (!user) {
        throw new Error('No user data received from server');
      }
      
      console.log('[Google Auth] Backend verification successful, logging in user');
      
      // Persist token and update state
      await login(user, token);
      
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
    } catch (error: any) {
      console.error('[Google Auth] Backend verification failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Google login failed';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleAppleLogin = async () => {
    if (!isAppleAuthAvailable()) {
      showAppleAuthUnavailableAlert();
      return;
    }
    try {
      const credential = await signInWithApple({
        requestedScopes: [
          AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationScope.EMAIL,
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

  const handleGoogleSignIn = async () => {
    try {
      if (!request) {
        Alert.alert('Error', 'Google Sign In is not ready. Please wait a moment and try again.');
        return;
      }
      
      if (!promptAsync) {
        Alert.alert('Error', 'Google Sign In is not available');
        return;
      }

      console.log('[Google Auth] Starting Google Sign-In flow');
      await promptAsync();
    } catch (error: any) {
      console.error('[Google Auth] Error starting sign-in:', error);
      Alert.alert('Error', error.message || 'Failed to start Google Sign-In');
    }
  };

  return (
    <LinearGradient colors={['#5b21b6', '#7c3aed', '#a78bfa']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
          showsVerticalScrollIndicator={false}
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

            {/* Forgot Password - Moved below Sign Up */}
            <TouchableOpacity
              style={{ marginTop: 16, alignItems: "center" }}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={{ color: "#d8b4fe", fontSize: 15, fontWeight: "600" }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    // Removed paddingBottom so Forgot Password is not cramped under input
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
