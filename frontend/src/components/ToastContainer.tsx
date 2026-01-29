import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useRef } from 'react';
import { ToastContext, ToastType } from '../context/ToastContext';

const getToastStyles = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { backgroundColor: '#10b981', icon: 'checkmark-circle', color: '#fff' };
    case 'error':
      return { backgroundColor: '#ef4444', icon: 'close-circle', color: '#fff' };
    case 'warning':
      return { backgroundColor: '#f59e0b', icon: 'warning', color: '#fff' };
    case 'info':
      return { backgroundColor: '#3b82f6', icon: 'information-circle', color: '#fff' };
    default:
      return { backgroundColor: '#6b7280', icon: 'information-circle', color: '#fff' };
  }
};

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, message, type, onRemove }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const { backgroundColor, icon, color } = getToastStyles(type);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [slideAnim]);

  const handleDismiss = () => {
    Animated.spring(slideAnim, {
      toValue: 300,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(() => {
      onRemove(id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor }]}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={[styles.message, { color }]} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={color} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);

  if (!context) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={removeToast}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastWrapper: {
    marginBottom: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
});
