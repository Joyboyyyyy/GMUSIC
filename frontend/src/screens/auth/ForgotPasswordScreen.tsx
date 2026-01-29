import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import api from "../../utils/api";

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;

type ForgotPasswordRouteProp = RouteProp<AuthStackParamList, "ForgotPassword">;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle forgot password request (request reset link)
  const handleRequestReset = async () => {
    if (!email.trim()) {
      return Alert.alert("Error", "Please enter your email address.");
    }

    setLoading(true);
    setSuccess(false);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSuccess(true);
      Alert.alert(
        "Success",
        "If your email is registered, you will receive a reset link."
      );
    } catch (error: any) {
      // Always show success to prevent email enumeration
      setSuccess(true);
      Alert.alert(
        "Success",
        "If your email is registered, you will receive a reset link."
      );
    } finally {
      setLoading(false);
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
            <Text style={styles.subtitle}>Reset Your Password</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                (!email.trim() || loading) && { opacity: 0.5 },
              ]}
              disabled={!email.trim() || loading}
              onPress={handleRequestReset}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.successText}>
                  If your email is registered, you will receive a reset link.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("Login" as never)}
            >
              <Text style={styles.linkText}>
                Remember your password?{' '}
                <Text style={styles.linkTextBold}>Login</Text>
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
  button: { backgroundColor: '#1f2937', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#e9d5ff', fontSize: 14 },
  linkTextBold: { fontWeight: 'bold', color: '#fff' },
  successContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#d1fae5', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 16,
    gap: 8,
  },
  successText: { 
    color: '#10b981', 
    fontSize: 13, 
    flex: 1,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
