import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import EmailVerifyScreen from '../screens/EmailVerifyScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="EmailVerify" component={EmailVerifyScreen} />
      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmailScreen}
        options={{
          headerShown: true,
          headerTitle: 'Verify Email',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#1f2937',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

