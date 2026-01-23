import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import Input from "../../components/ui/Input";
import api from "../../utils/api";

type ResetPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
type ResetPasswordRouteProp = RouteProp<AuthStackParamList, "ResetPassword">;

const ResetPasswordScreen = () => {
  const route = useRoute<ResetPasswordRouteProp>();
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const tokenFromLink = route.params?.token;
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/;
  const isPasswordValid = passwordRegex.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Handle password reset
  const handleResetPassword = async () => {
    if (!password.trim()) {
      return Alert.alert("Error", "Please enter a new password.");
    }

    if (!isPasswordValid) {
      return Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters with uppercase, lowercase, number, and special character."
      );
    }

    if (!passwordsMatch) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    if (!tokenFromLink) {
      return Alert.alert("Error", "Reset token is missing.");
    }

    setLoading(true);

    try {
      await api.post("/api/auth/reset-password", {
        token: tokenFromLink,
        password: password.trim(),
      });

      Alert.alert(
        "Password Reset Successful",
        "Your password has been reset. Please login with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => {
              navigation.navigate("Login");
            },
          },
        ]
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Password reset failed. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below.
            </Text>

            <Input
              placeholder="New Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              containerStyle={{ marginBottom: 16 }}
            />

            <Input
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              containerStyle={{ marginBottom: 16 }}
            />

            {password.length > 0 && !isPasswordValid && (
              <Text style={styles.errorText}>
                Password must be at least 6 characters with uppercase, lowercase, number, and special character.
              </Text>
            )}

            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                (!isPasswordValid || !passwordsMatch || loading) && styles.buttonDisabled,
              ]}
              disabled={!isPasswordValid || !passwordsMatch || loading}
              onPress={handleResetPassword}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
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
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    color: "#ef4444",
    fontSize: 12,
    textAlign: "left",
  },
});

export default ResetPasswordScreen;

