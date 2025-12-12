import React, { useState } from 'react';
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
import { useAuthStore } from '../../store/authStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, RootStackParamList } from '../../navigation/types';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, loading } = useAuthStore();

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/;

  const rules = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&._-]/.test(password),
    hasLength: password.length >= 6,
  };

  const passwordValid =
    rules.hasLower &&
    rules.hasUpper &&
    rules.hasNumber &&
    rules.hasSpecial &&
    rules.hasLength;

  const handleSignup = async () => {
    try {
      const result = await signup(name, email, password);
      
      if (!result.emailVerified) {
        // Navigate to VerifyEmail screen if email is not verified
        (navigation as any).navigate('VerifyEmail', { email: result.email });
        return;
      }
      
      // Email is verified, navigate to Main
      (navigation as any).navigate('Main');
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message);
    }
  };

  return (
    <LinearGradient colors={['#5b21b6', '#7c3aed', '#a78bfa']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🎵</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your musical journey today</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
              />
            </View>

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
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeWrapper}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <Text style={rules.hasLower ? styles.ruleOk : styles.ruleBad}>
                  {rules.hasLower ? '✔' : '✘'}  1 lowercase letter
                </Text>
                <Text style={rules.hasUpper ? styles.ruleOk : styles.ruleBad}>
                  {rules.hasUpper ? '✔' : '✘'}  1 uppercase letter
                </Text>
                <Text style={rules.hasNumber ? styles.ruleOk : styles.ruleBad}>
                  {rules.hasNumber ? '✔' : '✘'}  1 number
                </Text>
                <Text style={rules.hasSpecial ? styles.ruleOk : styles.ruleBad}>
                  {rules.hasSpecial ? '✔' : '✘'}  1 special character (@$!%*?&._-)
                </Text>
                <Text style={rules.hasLength ? styles.ruleOk : styles.ruleBad}>
                  {rules.hasLength ? '✔' : '✘'}  Minimum 6 characters
                </Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="Confirm password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeWrapper}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!name.trim() ||
                  !email.trim() ||
                  !passwordValid ||
                  confirmPassword !== password) && { opacity: 0.5 },
              ]}
              disabled={
                !name.trim() ||
                !email.trim() ||
                !passwordValid ||
                confirmPassword !== password ||
                loading
              }
              onPress={() => {
                if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
                  return Alert.alert('Signup Error', 'All fields are required.');
                }

                if (!passwordRegex.test(password)) {
                  return Alert.alert(
                    'Weak Password',
                    'Password must contain:\n• 1 uppercase\n• 1 lowercase\n• 1 number\n• 1 special character\n• Minimum 6 characters'
                  );
                }

                if (password !== confirmPassword) {
                  return Alert.alert('Signup Error', 'Passwords do not match.');
                }

                handleSignup();
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                (navigation as any).navigate("Auth", {
                  screen: "Login",
                } as never)
              }
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkTextBold}>Login</Text>
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
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
    marginBottom: 18,
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
  inputWrapper: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  eyeWrapper: {
    position: 'absolute',
    right: 12,
    padding: 6,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  ruleOk: {
    color: '#10b981',
    fontSize: 13,
    marginBottom: 2,
  },
  ruleBad: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 2,
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
    color: '#fff',
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: 'bold',
  },
});

export default SignupScreen;

