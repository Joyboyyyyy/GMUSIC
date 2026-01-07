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
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';

type PaymentSuccessScreenRouteProp = RouteProp<RootStackParamList, 'PaymentSuccess'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PaymentSuccessScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PaymentSuccessScreenRouteProp>();
  const { packId, packIds } = route.params || {};
  const { addPurchasedCourse, addPurchasedCourses } = usePurchasedCoursesStore();
  const { fetchMe, setUserFromBackend } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  useEffect(() => {
    // Add purchased course(s) to store when screen loads
    if (packIds && packIds.length > 0) {
      // Multiple courses purchased - use bulk operation for better performance
      const validIds = packIds.filter((id) => id); // Filter out any undefined/null values
      if (validIds.length > 0) {
        addPurchasedCourses(validIds);
      }
    } else if (packId) {
      // Single course purchased
      addPurchasedCourse(packId);
    } else {
      // Fallback: packId not provided
      console.warn('[PaymentSuccessScreen] No packId or packIds provided');
      Alert.alert(
        'Warning',
        'Purchase recorded, but course ID was not provided. Please contact support if you do not see your course in the library.',
        [{ text: 'OK' }]
      );
    }
    
    // Refresh user data to get updated building assignment
    const refreshUserData = async () => {
      try {
        const { user } = await fetchMe();
        if (user) {
          setUserFromBackend(user);
          console.log('[PaymentSuccessScreen] User data refreshed, buildingId:', user.buildingId);
        }
      } catch (error) {
        console.error('[PaymentSuccessScreen] Error refreshing user data:', error);
      }
    };
    refreshUserData();
  }, [packId, packIds, addPurchasedCourse, addPurchasedCourses, fetchMe, setUserFromBackend]);

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

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    color: theme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
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
    color: theme.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PaymentSuccessScreen;

