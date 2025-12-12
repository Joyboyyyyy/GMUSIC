import React, { useState } from "react";
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

type ResetPasswordScreenRouteProp = RouteProp<AuthStackParamList, "ResetPassword">;
type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;

const ResetPasswordScreen = () => {
  const route = useRoute<ResetPasswordScreenRouteProp>();
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const token = route.params?.token;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (pwd: string): boolean => {
    // Strong password requirements
    if (pwd.length < 6) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert("Error", "Invalid or expired reset link. Please request a new one.");
      navigation.navigate("ForgotPassword");
      return;
    }

    if (!password.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters and contain uppercase, lowercase, number, and special character");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", { token, password });
      Alert.alert(
        "Success",
        "Your password has been reset successfully!",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || "Invalid or expired reset link";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = token && isPasswordValid && passwordsMatch && !loading;

  return (
    <LinearGradient colors={["#5b21b6", "#7c3aed", "#a78bfa"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password to secure your account.
            </Text>
          </View>

          {!token && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>
                Invalid or expired reset link. Please request a new one.
              </Text>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.linkText}>Request New Reset Link</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && token && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {token && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      password.length > 0 && !isPasswordValid && styles.inputError,
                      password.length > 0 && isPasswordValid && styles.inputSuccess,
                    ]}
                    secureTextEntry={!showPassword}
                    placeholder="Enter new password"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {password.length > 0 && !isPasswordValid && (
                  <Text style={styles.helpText}>
                    Password must be at least 6 characters and contain uppercase, lowercase, number, and special character
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      confirmPassword.length > 0 && !passwordsMatch && styles.inputError,
                      confirmPassword.length > 0 && passwordsMatch && styles.inputSuccess,
                    ]}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9ca3af"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setError(null);
                    }}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={22}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Text style={styles.errorText}>Passwords do not match</Text>
                )}
                {confirmPassword.length > 0 && passwordsMatch && (
                  <Text style={styles.successText}>Passwords match</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, !canSubmit && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={!canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <Text style={styles.backText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#e9d5ff",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  passwordInputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#1f2937",
    borderWidth: 2,
    borderColor: "transparent",
    flex: 1,
  },
  passwordInput: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  inputSuccess: {
    borderColor: "#10b981",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
  helpText: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 6,
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    flex: 1,
  },
  successText: {
    color: "#10b981",
    fontSize: 13,
    marginTop: 6,
  },
  button: {
    backgroundColor: "#1f2937",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    alignItems: "center",
    marginTop: 8,
  },
  backText: {
    color: "#d8b4fe",
    fontSize: 15,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 8,
    width: "100%",
  },
  linkText: {
    color: "#d8b4fe",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});

export default ResetPasswordScreen;
