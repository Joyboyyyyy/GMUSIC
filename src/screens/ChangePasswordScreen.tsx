import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore, getTheme } from '../store/themeStore';
import api from '../utils/api';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) return Alert.alert('Error', 'Please enter your current password');
    if (!isPasswordValid) return Alert.alert('Error', 'Please ensure your new password meets all requirements');
    if (!passwordsMatch) return Alert.alert('Error', 'New passwords do not match');
    setLoading(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword: currentPassword.trim(), newPassword: newPassword.trim() });
      Alert.alert('Success', 'Your password has been changed successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      console.error('[ChangePassword] Error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  const styles = createStyles(theme, isDark);

  const renderPasswordCheck = (label: string, isValid: boolean) => (
    <View style={styles.checkRow}>
      <Ionicons name={isValid ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={isValid ? theme.success : theme.textMuted} />
      <Text style={[styles.checkText, isValid && styles.checkTextValid]}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="lock-closed-outline" size={48} color={theme.primary} />
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Enter your current password and choose a new secure password.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Enter current password" placeholderTextColor={theme.textMuted} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry={!showCurrentPassword} autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                <Ionicons name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Enter new password" placeholderTextColor={theme.textMuted} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNewPassword} autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <View style={styles.checksContainer}>
                {renderPasswordCheck('At least 6 characters', hasMinLength)}
                {renderPasswordCheck('One uppercase letter', hasUppercase)}
                {renderPasswordCheck('One lowercase letter', hasLowercase)}
                {renderPasswordCheck('One number', hasNumber)}
                {renderPasswordCheck('One special character', hasSpecialChar)}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <TextInput style={styles.input} placeholder="Confirm new password" placeholderTextColor={theme.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoCapitalize="none" autoCorrect={false} />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && <Text style={styles.errorText}>Passwords do not match</Text>}
            {confirmPassword.length > 0 && passwordsMatch && <Text style={styles.successText}>Passwords match</Text>}
          </View>

          <TouchableOpacity style={[styles.submitButton, (!currentPassword || !isPasswordValid || !passwordsMatch || loading) && styles.submitButtonDisabled]} onPress={handleChangePassword} disabled={!currentPassword || !isPasswordValid || !passwordsMatch || loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitButtonText}>Change Password</Text><Ionicons name="shield-checkmark" size={20} color="#fff" /></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
  input: { flex: 1, padding: 16, fontSize: 16, color: theme.text },
  eyeButton: { padding: 16 },
  checksContainer: { marginTop: 12, backgroundColor: theme.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkText: { fontSize: 13, color: theme.textMuted },
  checkTextValid: { color: theme.success },
  errorText: { fontSize: 12, color: theme.error, marginTop: 8 },
  successText: { fontSize: 12, color: theme.success, marginTop: 8 },
  submitButton: { flexDirection: 'row', backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default ChangePasswordScreen;
