import { useContext } from 'react';
import { ToastContext, ToastType } from '../context/ToastContext';

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return {
    showToast: (message: string, type: ToastType = 'info', duration?: number) => {
      context.showToast(message, type, duration);
    },
    success: (message: string, duration?: number) => {
      context.showToast(message, 'success', duration);
    },
    error: (message: string, duration?: number) => {
      context.showToast(message, 'error', duration);
    },
    warning: (message: string, duration?: number) => {
      context.showToast(message, 'warning', duration);
    },
    info: (message: string, duration?: number) => {
      context.showToast(message, 'info', duration);
    },
  };
};
