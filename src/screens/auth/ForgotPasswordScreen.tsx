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
} from "react-native";
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
    <View style={styles.container}>
      <View style={styles.centerContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, (!email.trim() || loading) && styles.buttonDisabled]}
              disabled={!email.trim() || loading}
              onPress={handleRequestReset}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>

            {success && (
              <Text style={styles.successText}>
                If your email is registered, you will receive a reset link.
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  button: {
    backgroundColor: "#5b21b6",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  successText: {
    marginTop: 16,
    color: "#10b981",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    color: "#ef4444",
    fontSize: 12,
    textAlign: "left",
  },
});

export default ForgotPasswordScreen;
