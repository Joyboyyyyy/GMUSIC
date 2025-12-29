import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import EmailVerifyScreen from '../screens/EmailVerifyScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// IMPORTANT: Use named export so React Navigation mounts it as a Navigator correctly
export const AuthNavigator = () => {
  console.log("AUTH NAVIGATOR MOUNTED"); // Debug: ensure navigator actually mounts

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="EmailVerify" component={EmailVerifyScreen} />
      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmailScreen}
        options={{
          headerShown: true,
          headerTitle: "Verify Email",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#1f2937",
        }}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen}
        options={{
          headerShown: true,
          headerTitle: "Reset Password",
          headerStyle: { backgroundColor: "#fff" },
          headerTintColor: "#1f2937",
        }}
      />
    </Stack.Navigator>
  );
};

// REMOVE default export — this was the cause of LoginScreen being mounted incorrectly

