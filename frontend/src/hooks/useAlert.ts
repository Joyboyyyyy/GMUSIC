import { useState } from 'react';
import { AlertButton } from '../components/AlertModal';

export interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconType?: 'error' | 'success' | 'warning' | 'info';
  buttons?: AlertButton[];
}

export const useAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    icon: 'alert-circle-outline',
    iconType: 'info',
    buttons: [{ text: 'OK', onPress: () => {}, style: 'default' }],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons?: AlertButton[],
    icon?: string,
    iconType?: 'error' | 'success' | 'warning' | 'info'
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      icon: icon || 'alert-circle-outline',
      iconType: iconType || 'info',
      buttons: buttons || [{ text: 'OK', onPress: () => {}, style: 'default' }],
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  return {
    alertState,
    showAlert,
    hideAlert,
  };
};
