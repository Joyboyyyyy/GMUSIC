import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../hooks/useToast';

const ToastTestScreen = () => {
  const { success, error, warning, info, showToast } = useToast();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="notifications" size={32} color="#7c3aed" />
          <Text style={styles.title}>Toast Test Screen</Text>
          <Text style={styles.subtitle}>Click buttons to test different toast types</Text>
        </View>

        {/* Success Toast */}
        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={() => success('✅ Profile updated successfully!')}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Success Toast</Text>
        </TouchableOpacity>

        {/* Error Toast */}
        <TouchableOpacity
          style={[styles.button, styles.errorButton]}
          onPress={() => error('❌ Failed to load courses')}
        >
          <Ionicons name="close-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Error Toast</Text>
        </TouchableOpacity>

        {/* Warning Toast */}
        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={() => warning('⚠️ Network connection slow')}
        >
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.buttonText}>Warning Toast</Text>
        </TouchableOpacity>

        {/* Info Toast */}
        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={() => info('ℹ️ Item added to cart')}
        >
          <Ionicons name="information-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>Info Toast</Text>
        </TouchableOpacity>

        {/* Custom Duration */}
        <TouchableOpacity
          style={[styles.button, styles.customButton]}
          onPress={() => success('This toast lasts 5 seconds', 5000)}
        >
          <Ionicons name="time" size={20} color="#fff" />
          <Text style={styles.buttonText}>Custom Duration (5s)</Text>
        </TouchableOpacity>

        {/* Multiple Toasts */}
        <TouchableOpacity
          style={[styles.button, styles.multiButton]}
          onPress={() => {
            success('First toast');
            setTimeout(() => warning('Second toast'), 500);
            setTimeout(() => info('Third toast'), 1000);
          }}
        >
          <Ionicons name="layers" size={20} color="#fff" />
          <Text style={styles.buttonText}>Multiple Toasts</Text>
        </TouchableOpacity>

        {/* Long Message */}
        <TouchableOpacity
          style={[styles.button, styles.longButton]}
          onPress={() => 
            success('This is a longer message to test how toasts handle multi-line text and wrapping')
          }
        >
          <Ionicons name="document-text" size={20} color="#fff" />
          <Text style={styles.buttonText}>Long Message</Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>How to Use Toast in Your App:</Text>
          <Text style={styles.infoBoxText}>
            1. Import: {'\n'}
            <Text style={styles.code}>import {'{useToast}'} from './hooks/useToast'</Text>
          </Text>
          <Text style={styles.infoBoxText}>
            2. Use in component: {'\n'}
            <Text style={styles.code}>const {'{success, error}'} = useToast()</Text>
          </Text>
          <Text style={styles.infoBoxText}>
            3. Call methods: {'\n'}
            <Text style={styles.code}>success('Message')</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  infoButton: {
    backgroundColor: '#3b82f6',
  },
  customButton: {
    backgroundColor: '#8b5cf6',
  },
  multiButton: {
    backgroundColor: '#ec4899',
  },
  longButton: {
    backgroundColor: '#06b6d4',
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed',
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  code: {
    fontFamily: 'Courier New',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: '#7c3aed',
    fontWeight: '600',
  },
});

export default ToastTestScreen;
