import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PackDetailScreen from '../screens/PackDetailScreen';
import TrackPlayerScreen from '../screens/TrackPlayerScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';
import CartScreen from '../screens/CartScreen';
import EmailVerifyScreen from '../screens/EmailVerifyScreen';
import EmailVerifiedScreen from '../screens/EmailVerifiedScreen';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      
      // Handle email-verified deep link
      if (url.includes('email-verified')) {
        navigation.navigate('EmailVerified' as never);
        return;
      }
      
      // Handle old token-based verification
      if (parsed?.queryParams?.token) {
        navigation.navigate('EmailVerify' as never, { token: parsed.queryParams.token as string } as never);
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
            backgroundColor: '#fff',
          },
          headerTintColor: '#1f2937',
        }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#1f2937',
        }}
      />
      <Stack.Screen 
        name="NotificationSettings" 
        component={NotificationSettingsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notification Settings',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#1f2937',
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
    </Stack.Navigator>
  );
};

export default RootNavigator;
