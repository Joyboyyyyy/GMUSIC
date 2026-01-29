import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore, getTheme } from '../store/themeStore';
import AlertModal from '../components/AlertModal';
import { useAlert } from '../hooks/useAlert';
import api from '../utils/api';

type FeedbackType = 'general_inquiry' | 'feature_request' | 'bug_report';
const feedbackTypes: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'general_inquiry', label: 'General Inquiry', icon: 'help-circle-outline' },
  { value: 'feature_request', label: 'Feature Request', icon: 'bulb-outline' },
  { value: 'bug_report', label: 'Bug Report', icon: 'bug-outline' },
];

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [selectedType, setSelectedType] = useState<FeedbackType>('general_inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) { showAlert('Error', 'Please enter your feedback message', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'alert-circle-outline', 'error'); return; }
    setLoading(true);
    try {
      await api.post('/api/feedback', { type: selectedType, subject: subject.trim() || null, message: message.trim() });
      showAlert('Thank You!', 'Your feedback has been submitted successfully.', [{ text: 'OK', onPress: () => { hideAlert(); navigation.goBack(); }, style: 'default' }], 'checkmark-circle', 'success');
    } catch (error: any) {
      console.error('[Feedback] Submit error:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to submit feedback.', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'alert-circle-outline', 'error');
    } finally { setLoading(false); }
  };

  const selectedTypeData = feedbackTypes.find(t => t.value === selectedType);
  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={theme.primary} />
            <Text style={styles.title}>Submit Feedback</Text>
            <Text style={styles.subtitle}>We value your input! Let us know if you have any suggestions, found a bug, or just want to share your thoughts.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Feedback Type</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
              <View style={styles.dropdownContent}>
                <Ionicons name={selectedTypeData?.icon as any} size={20} color={theme.primary} />
                <Text style={styles.dropdownText}>{selectedTypeData?.label}</Text>
              </View>
              <Ionicons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {feedbackTypes.map((type) => (
                  <TouchableOpacity key={type.value} style={[styles.dropdownItem, selectedType === type.value && styles.dropdownItemSelected]} onPress={() => { setSelectedType(type.value); setShowDropdown(false); }}>
                    <Ionicons name={type.icon as any} size={20} color={selectedType === type.value ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.dropdownItemText, selectedType === type.value && styles.dropdownItemTextSelected]}>{type.label}</Text>
                    {selectedType === type.value && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Subject (Optional)</Text>
            <TextInput style={styles.input} placeholder="Brief summary of your feedback" placeholderTextColor={theme.textMuted} value={subject} onChangeText={setSubject} maxLength={100} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Message</Text>
            <TextInput style={styles.textArea} placeholder="Tell us what's on your mind..." placeholderTextColor={theme.textMuted} value={message} onChangeText={setMessage} multiline numberOfLines={6} textAlignVertical="top" />
            <Text style={styles.charCount}>{message.length}/1000</Text>
          </View>

          <TouchableOpacity style={[styles.submitButton, (!message.trim() || loading) && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={!message.trim() || loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Text style={styles.submitButtonText}>Submit Feedback</Text><Ionicons name="send" size={20} color="#fff" /></>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        icon={alertState.icon as any}
        iconType={alertState.iconType}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
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
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
  dropdownContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownText: { fontSize: 16, color: theme.text },
  dropdownMenu: { backgroundColor: theme.card, borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  dropdownItemSelected: { backgroundColor: theme.primaryLight },
  dropdownItemText: { flex: 1, fontSize: 16, color: theme.textSecondary },
  dropdownItemTextSelected: { color: theme.primary, fontWeight: '600' },
  input: { backgroundColor: theme.card, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, borderWidth: 1, borderColor: theme.border },
  textArea: { backgroundColor: theme.card, borderRadius: 12, padding: 16, fontSize: 16, color: theme.text, borderWidth: 1, borderColor: theme.border, minHeight: 150 },
  charCount: { fontSize: 12, color: theme.textMuted, textAlign: 'right', marginTop: 8 },
  submitButton: { flexDirection: 'row', backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default FeedbackScreen;
