import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, "Login">;

const LoginScreen = () => {
  const navigation = useNavigation<LoginNav>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { login, loginWithCredentials, loginWithApple, redirectPath, clearRedirectPath, loading } = useAuthStore();

  React.useEffect(() => {
    console.log('[LoginScreen] Mounted');
  }, []);

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validation
    if (!email.trim()) {
      setEmailError('Email is required');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      scrollViewRef.current?.scrollTo({ y: 100, animated: true });
      return;
    }

    try {
      const { user, token } = await loginWithCredentials(email, password);
      await login(user, token);
      navigateAfterLogin();
    } catch (e: any) {
      const errorMessage = e.message || 'Login failed. Please check your credentials.';
      // Show error below email field
      setEmailError(errorMessage);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
    <LinearGradient colors={['#4840a4', '#6b5fb3', '#8b7ec4']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
          {/* Dark Mode Toggle */}
          <TouchableOpacity style={styles.darkModeToggle}>
            <Ionicons name="moon" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="musical-notes" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Gretex Music Room</Text>
            <Text style={styles.subtitle}>Learn music from the best</Text>
          </View>

          <View style={styles.formCard}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
                <Ionicons name="mail" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#a78bfa"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, passwordError && styles.inputWrapperError]}>
                <Ionicons name="lock-closed" size={20} color="#c4b5fd" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#a78bfa"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#c4b5fd"
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.button, (!email.trim() || !password.trim() || loading) && styles.buttonDisabled]}
              disabled={!email.trim() || !password.trim() || loading}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color="#4840a4" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup' as never)}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  darkModeToggle: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#e9d5ff' },
  formCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  inputWrapperError: { borderColor: '#ff0000' },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, color: '#fff' },
  errorText: { fontSize: 12, color: '#ff0000', marginTop: 6, fontWeight: '500' },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  forgotLink: { fontSize: 12, color: '#e9d5ff', fontWeight: '500' },
  button: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#4840a4', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#e9d5ff' },
  signUpLink: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
});

export default LoginScreen;
