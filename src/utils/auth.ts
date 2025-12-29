import { Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { useAuthStore, RedirectPath } from '../store/authStore';

/**
 * Helper function to require authentication before performing an action
 * @param status - Auth status ('unauthenticated' | 'pending_verification' | 'authenticated')
 * @param navigation - Navigation object
 * @param onAuthenticated - Callback to execute if user is authenticated
 * @param message - Optional custom message for login prompt
 * @param redirectPath - Optional route name (string) or redirect object ({ name, params }) to redirect to after login
 */
export function requireAuth(
  status: 'unauthenticated' | 'pending_verification' | 'authenticated',
  navigation: NavigationProp<any>,
  onAuthenticated: () => void,
  message: string = 'Please login to continue',
  redirectPath?: string | RedirectPath
): void {
  if (status !== 'authenticated') {
    const { setRedirectPath } = useAuthStore.getState();
    
    // Store redirect path if provided
    if (redirectPath) {
      setRedirectPath(redirectPath);
    } else {
      // If no redirect path provided, try to get current route info from navigation state
      try {
        const navState = (navigation as any).getState?.();
        if (navState) {
          const currentRoute = navState.routes?.[navState.index];
          if (currentRoute) {
            setRedirectPath({
              name: currentRoute.name,
              params: currentRoute.params || {},
            });
          }
        }
      } catch (error) {
        // If we can't get route info, that's okay - user will just go to Main after login
        console.warn('Could not extract route info for redirect:', error);
      }
    }
    
    Alert.alert(
      'Login Required',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Login',
          onPress: () => {
            navigation.navigate('Auth' as never, { screen: 'Login' } as never);
          },
        },
      ]
    );
    return;
  }

  // User is authenticated, proceed with action
  onAuthenticated();
}

