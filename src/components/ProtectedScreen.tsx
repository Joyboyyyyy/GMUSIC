import React, { useEffect, useRef } from 'react';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import LoginRequired from './LoginRequired';

interface ProtectedScreenProps {
  children: React.ReactNode;
  routeName?: string; // Optional route name, will try to detect if not provided
  requireAuth?: boolean; // If false, allow unauthenticated access (default: true)
}

const ProtectedScreen: React.FC<ProtectedScreenProps> = ({ children, routeName, requireAuth = true }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, status, isLoggingOut, setRedirectPath } = useAuthStore();
  const hasNavigated = useRef(false);
  const hasSetRedirect = useRef(false);

  useEffect(() => {
    // Only set redirect path if auth is required
    if (requireAuth && status !== 'authenticated' && !hasSetRedirect.current) {
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
    if (status !== 'authenticated' && isLoggingOut && !hasNavigated.current) {
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
    } else if (status === 'authenticated') {
      // Reset navigation flag when user becomes authenticated
      hasNavigated.current = false;
      hasSetRedirect.current = false;
    }
  }, [status, isLoggingOut, navigation, route, routeName, setRedirectPath, requireAuth]);

  // If auth is required and user is not authenticated, show LoginRequired component
  // If requireAuth is false, allow access regardless of auth status
  if (requireAuth && status !== 'authenticated') {
    return <LoginRequired />;
  }

  return <>{children}</>;
};

export default ProtectedScreen;

