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
import { AuthStackParamList } from '../../navigation/types';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// Platform-safe Apple Authentication wrapper - COMMENTED OUT FOR FREE TESTING
// import { 
//   signInWithApple, 
//   isAppleAuthAvailable, 
//   showAppleAuthUnavailableAlert,
//   AppleAuthenticationScope
// } from '../../utils/appleAuth';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

// Configure Google Sign-In - COMMENTED OUT FOR FREE TESTING
// GoogleSignin.configure({
//   webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
//   offlineAccess: true,
//   scopes: ['profile', 'email'],
// });

type LoginNav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen = () => {
  const navigation = useNavigation<LoginNav>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, loginWithCredentials, loginWithApple, redirectPath, clearRedirectPath, loading } = useAuthStore();

  React.useEffect(() => {
    console.log('[LoginScreen] Mounted');
  }, []);

  const handleLogin = async () => {
    try {
      const { user, token } = await loginWithCredentials(email, password);
      await login(user, token);
      navigateAfterLogin();
    } catch (e: any) {
      const errorMessage = e.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const navigateAfterLogin = () => {
    const currentRedirectPath = redirectPath;
    if (currentRedirectPath) {
      clearRedirectPath();
      const screenName = currentRedirectPath.name;
      const screenParams = currentRedirectPath.params || {};
      
      if (screenName === 'Library' || screenName === 'Profile' || screenName === 'Dashboard') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Main', params: { screen: screenName } }],
          })
        );
      } else {
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
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    }
  };

  const handleGoogleSignIn = async () => {
    // COMMENTED OUT FOR FREE TESTING - Will be re-enabled before App Store submission
    /*
    try {
      setGoogleLoading(true);
      console.log('[Google Auth] Starting native Google Sign-In');
      
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in and get user info
      const userInfo = await GoogleSignin.signIn();
      console.log('[Google Auth] Sign-in successful, getting tokens');
      
      // Get ID token
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }
      
      console.log('[Google Auth] Sending ID token to backend');
      
      // Send to backend for verification
      const response = await api.post('/api/auth/google', { idToken });
      
      const responseData = response.data;
      const payload = responseData?.data || responseData;
      const user = payload?.user || payload;
      const token = payload?.token || responseData?.token;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      console.log('[Google Auth] Backend verification successful');
      await login(user, token);
      navigateAfterLogin();
      
    } catch (error: any) {
      console.error('[Google Auth] Error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - don't show error
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Please wait', 'Sign in already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Google login failed';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setGoogleLoading(false);
    }
    */
  };

  const handleAppleLogin = async () => {
    // COMMENTED OUT FOR FREE TESTING - Will be re-enabled before App Store submission
    /*
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
      navigateAfterLogin();
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        return;
      }
      Alert.alert('Error', 'Apple login failed');
    }
    */
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
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
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

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtons}>
              {/* GOOGLE SIGN-IN COMMENTED OUT FOR FREE TESTING - Will be re-enabled before App Store submission */}
              {/* <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#DB4437" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#DB4437" />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </>
                )}
              </TouchableOpacity> */}

              {/* APPLE SIGN-IN COMMENTED OUT FOR FREE TESTING - Will be re-enabled before App Store submission */}
              {/* {Platform.OS === 'ios' && (
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
              )} */}
            </View>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Signup' as never)}
            >
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

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
  container: { flex: 1 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#e9d5ff' },
  form: { width: '100%' },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, color: '#1f2937' },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: { position: 'absolute', right: 16, top: 16, padding: 4 },
  button: { backgroundColor: '#1f2937', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#e9d5ff', fontSize: 14 },
  linkTextBold: { fontWeight: 'bold', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#c4b5fd' },
  dividerText: { marginHorizontal: 16, color: '#e9d5ff', fontSize: 14 },
  socialButtons: { flexDirection: 'row', gap: 12 },
  googleButton: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  appleButton: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  socialButtonText: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
});

export default LoginScreen;
