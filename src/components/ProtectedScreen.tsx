import React from 'react';
import { useAuthStore } from '../store/authStore';
import LoginRequired from './LoginRequired';

interface ProtectedScreenProps {
  children: React.ReactNode;
}

const ProtectedScreen: React.FC<ProtectedScreenProps> = ({ children }) => {
  const { user } = useAuthStore();

  if (user == null) {
    return <LoginRequired />;
  }

  return <>{children}</>;
};

export default ProtectedScreen;

