import React from 'react';
import { View, Modal, Pressable, StyleSheet, Text as RNText } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, getTheme } from '../store/themeStore';
import { Text } from './ui';

export interface AlertButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconType?: 'error' | 'success' | 'warning' | 'info';
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  icon = 'alert-circle-outline',
  iconType = 'info',
  buttons = [{ text: 'OK', onPress: () => {}, style: 'default' }],
  onDismiss,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  // Get icon and background colors based on type
  const getIconConfig = () => {
    switch (iconType) {
      case 'error':
        return {
          color: isDark ? '#FF6B6B' : '#E63946',
          bgColor: isDark ? '#3D1F1F' : '#FFE5E5',
        };
      case 'success':
        return {
          color: isDark ? '#51CF66' : '#10B981',
          bgColor: isDark ? '#1F3D1F' : '#E5F5E5',
        };
      case 'warning':
        return {
          color: isDark ? '#FFD93D' : '#F59E0B',
          bgColor: isDark ? '#3D3D1F' : '#FFF5E5',
        };
      case 'info':
      default:
        return {
          color: isDark ? '#5B5BFF' : '#5B5BFF',
          bgColor: isDark ? '#1F1F3D' : '#E5E5FF',
        };
    }
  };

  const iconConfig = getIconConfig();

  const handleButtonPress = (button: AlertButton) => {
    button.onPress();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}
        onPress={onDismiss}
      >
        <Pressable style={[styles.modalContent, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
          {/* Icon */}
          <View style={[styles.iconBox, { backgroundColor: iconConfig.bgColor }]}>
            <Ionicons name={icon} size={32} color={iconConfig.color} />
          </View>

          {/* Title */}
          <RNText style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {title}
          </RNText>

          {/* Message */}
          <RNText style={[styles.modalMessage, { color: isDark ? '#B0B0B0' : '#666666' }]}>
            {message}
          </RNText>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';

              return (
                <Pressable
                  key={index}
                  style={[
                    styles.button,
                    isDestructive && styles.destructiveButton,
                    isCancel && styles.cancelButton,
                    !isDestructive && !isCancel && styles.defaultButton,
                    buttons.length > 1 && index === 0 && styles.firstButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <RNText
                    style={[
                      styles.buttonText,
                      isDestructive && styles.destructiveButtonText,
                      isCancel && styles.cancelButtonText,
                      !isDestructive && !isCancel && styles.defaultButtonText,
                    ]}
                  >
                    {button.text}
                  </RNText>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    iconBox: {
      width: 64,
      height: 64,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    modalMessage: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 24,
    },
    buttonContainer: {
      width: '100%',
      gap: 12,
    },
    button: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    firstButton: {
      marginBottom: 4,
    },
    defaultButton: {
      backgroundColor: '#5B5BFF',
    },
    defaultButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: isDark ? '#404040' : '#E0E0E0',
    },
    cancelButtonText: {
      color: isDark ? '#FFFFFF' : '#000000',
      fontSize: 14,
      fontWeight: '600',
    },
    destructiveButton: {
      backgroundColor: '#FF6B6B',
    },
    destructiveButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default AlertModal;
