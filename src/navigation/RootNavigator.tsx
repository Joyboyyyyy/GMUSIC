import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import { normalizeUrl, isDeepLink, isWebUrl } from '../utils/urls';
import { AuthNavigator } from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PackDetailScreen from '../screens/PackDetailScreen';
import TrackPlayerScreen from '../screens/TrackPlayerScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import PaymentInvoicesScreen from '../screens/PaymentInvoicesScreen';
import CartScreen from '../screens/CartScreen';
import EmailVerifyScreen from '../screens/EmailVerifyScreen';
import EmailVerifiedScreen from '../screens/EmailVerifiedScreen';
import SelectBuildingScreen from '../screens/booking/SelectBuildingScreen';
import SelectSlotScreen from '../screens/booking/SelectSlotScreen';
import BookingSuccessScreen from '../screens/booking/BookingSuccessScreen';
import LibraryScreen from '../screens/LibraryScreen';
import BuildingCoursesScreen from '../screens/BuildingCoursesScreen';
import AllBuildingsScreen from '../screens/AllBuildingsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import SearchScreen from '../screens/SearchScreen';
import BuildingMapScreen from '../screens/BuildingMapScreen';
import TrinityInfoScreen from '../screens/TrinityInfoScreen';
import BrowseScreen from '../screens/BrowseScreen';
import TeacherDetailScreen from '../screens/TeacherDetailScreen';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getTheme } from '../store/themeStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const RootNavigator = () => {
  const navigation = useNavigation<RootNav>();
  const { user, status } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  // Centralized deep link / web URL handler
  // Supports both deep links (mobile) and web URLs (web platform)
  const handleDeepLink = (url: string) => {
    console.log('[Navigation] Handling URL:', url, `(platform: ${Platform.OS})`);
    
    // Normalize URL to extract path and params (works for both deep links and web URLs)
    const { path, params } = normalizeUrl(url);
    
    // PRIMARY: Handle email-verified (from backend GET /api/auth/verify-email)
    // This is the ONLY entry point for email verification flow
    // Backend already verified the email, app will use authToken for auto-login
    if (path.includes('email-verified')) {
      const error = params?.error;
      const authToken = params?.authToken;
      console.log('[Navigation] Email verified URL received', error ? `(error: ${error})` : authToken ? '(with auth token)' : '(success)');
      navigation.navigate('EmailVerified', { error, authToken });
      return;
    }
    
    // Handle reset-password - navigate to ResetPassword screen directly
    if (path.includes('reset-password') && params?.token) {
      const token = params.token;
      console.log('[Navigation] Reset password URL received');
      navigation.navigate('Auth', { 
        screen: 'ResetPassword',
        params: { token }
      });
      return;
    }
    
    // Legacy: Handle verify-email (only for manual retry/resend flows)
    // This should NOT be used for email link clicks (backend redirects to email-verified)
    // Keeping for backward compatibility but should not be reached from email links
    if (path.includes('verify-email') && params?.token) {
      const token = params.token;
      console.warn('[Navigation] Legacy verify-email URL received - this should not happen from email links');
      // Still navigate to EmailVerify for manual retry flows, but log warning
      navigation.navigate('EmailVerify', { token });
      return;
    }
  };

  useEffect(() => {
    // Handle URL changes (deep links on mobile, URL changes on web)
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL (when app opens from deep link or web URL)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => sub.remove();
  }, [navigation]);

  // Always show MainNavigator first - public screens (Home, Browse) are accessible
  // Protected screens (Library, Profile, Dashboard, Checkout, Chat) will redirect to Login if needed
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen 
        name="PackDetail" 
        component={PackDetailScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="TrackPlayer" 
        component={TrackPlayerScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Checkout" 
        component={CheckoutScreen}
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
          headerStyle: {
            backgroundColor: '#5b21b6',
          },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen 
        name="Cart" 
        component={CartScreen}
        options={{
          headerShown: true,
          headerTitle: 'Shopping Cart',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notification Settings',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PaymentSuccess" 
        component={PaymentSuccessScreen}
        options={{
          headerShown: true,
          headerTitle: 'Payment Success',
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerLeft: () => null, // Disable back button
        }}
      />
      <Stack.Screen 
        name="PaymentInvoices" 
        component={PaymentInvoicesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EmailVerify" 
        component={EmailVerifyScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="EmailVerified" 
        component={EmailVerifiedScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="SelectBuilding" 
        component={SelectBuildingScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="SelectSlot" 
        component={SelectSlotScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="BookingSuccess" 
        component={BookingSuccessScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Prevent going back from success screen
        }}
      />
      <Stack.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{
          headerShown: true,
          headerTitle: 'My Library',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="BuildingCourses" 
        component={BuildingCoursesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="AllBuildings" 
        component={AllBuildingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{
          headerShown: true,
          headerTitle: 'Feedback',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{
          headerShown: true,
          headerTitle: 'Change Password',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="BuildingMap" 
        component={BuildingMapScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="TrinityInfo" 
        component={TrinityInfoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Browse" 
        component={BrowseScreen}
        options={{
          headerShown: true,
          headerTitle: 'Browse Lessons',
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
        }}
      />
      <Stack.Screen 
        name="TeacherDetail" 
        component={TeacherDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
