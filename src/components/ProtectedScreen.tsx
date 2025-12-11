import React, { useEffect, useRef } from 'react';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import LoginRequired from './LoginRequired';

interface ProtectedScreenProps {
  children: React.ReactNode;
  routeName?: string; // Optional route name, will try to detect if not provided
}

const ProtectedScreen: React.FC<ProtectedScreenProps> = ({ children, routeName }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isLoggingOut, setRedirectPath } = useAuthStore();
  const hasNavigated = useRef(false);
  const hasSetRedirect = useRef(false);

  useEffect(() => {
    // Set redirect path when user is not authenticated and tries to access protected screen
    if (user == null && !hasSetRedirect.current) {
      hasSetRedirect.current = true;
      const screenName = routeName || route.name;
      const routeParams = (route.params as any) || {};
      
      // Set redirect path with screen name and params
      setRedirectPath({
        name: screenName,
        params: routeParams,
      });
    }

    // Only handle logout scenario - navigate to Home
    // Do NOT auto-redirect for initial access (let user see LoginRequired screen)
    if (user == null && isLoggingOut && !hasNavigated.current) {
      hasNavigated.current = true;
      
      // If logging out, navigate to Home tab (public screen)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ 
            name: 'Main', 
            params: { screen: 'Home' } 
          }],
        })
      );
      
      // Reset flag after navigation
      setTimeout(() => {
        hasNavigated.current = false;
      }, 100);
    } else if (user != null) {
      // Reset navigation flag when user becomes authenticated
      hasNavigated.current = false;
      hasSetRedirect.current = false;
    }
  }, [user, isLoggingOut, navigation, route, routeName, setRedirectPath]);

  // If user is not authenticated, show LoginRequired component
  // This allows users to see the screen but prompts them to login
  if (user == null) {
    return <LoginRequired />;
  }

  return <>{children}</>;
};

export default ProtectedScreen;

