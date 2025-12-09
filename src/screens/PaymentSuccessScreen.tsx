import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
          </View>

          <Text style={styles.title}>Payment Successful! 🎉</Text>
          
          <Text style={styles.message}>
            Your payment has been verified and processed successfully.
          </Text>

          <Text style={styles.subMessage}>
            You now have access to all lessons in this pack.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            }}
          >
            <Text style={styles.buttonText}>Go to Library</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    minWidth: 200,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PaymentSuccessScreen;

