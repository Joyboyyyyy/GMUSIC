import { useState, useEffect } from 'react';
// import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);

  useEffect(() => {
    // For Expo Go compatibility, we'll assume connected
    // In production/dev build, uncomment NetInfo code below
    
    /* 
    // Uncomment this for development build or production
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
    });

    return () => unsubscribe();
    */
    
    // For now, always assume connected for Expo Go testing
    setIsConnected(true);
    setIsInternetReachable(true);
  }, []);

  return { isConnected, isInternetReachable };
};
