import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';

type PaymentSuccessScreenRouteProp = RouteProp<RootStackParamList, 'PaymentSuccess'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PaymentSuccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentSuccessScreenRouteProp>();
  const { packId, packIds } = route.params || {};
  const { addPurchasedCourse, addPurchasedCourses } = usePurchasedCoursesStore();

  useEffect(() => {
    // Add purchased course(s) to store when screen loads
    if (packIds && packIds.length > 0) {
      // Multiple courses purchased
      packIds.forEach((id) => {
        if (id) {
          addPurchasedCourse(id);
        }
      });
    } else if (packId) {
      // Single course purchased
      addPurchasedCourse(packId);
    } else {
      // Fallback: packId not provided
      console.warn('PaymentSuccessScreen: No packId or packIds provided');
      Alert.alert(
        'Warning',
        'Purchase recorded, but course ID was not provided. Please contact support if you do not see your course in the library.',
        [{ text: 'OK' }]
      );
    }
  }, [packId, packIds, addPurchasedCourse]);

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
              // Navigate to Dashboard to see purchased courses
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'Main' as never, params: { screen: 'Dashboard' } },
                ],
              });
            }}
          >
            <Text style={styles.buttonText}>Go to Dashboard</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          {packId && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                // Navigate to the purchased pack detail
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Main' as never },
                    { name: 'PackDetail' as never, params: { packId } },
                  ],
                });
              }}
            >
              <Text style={styles.secondaryButtonText}>View Course</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' as never }],
              });
            }}
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

