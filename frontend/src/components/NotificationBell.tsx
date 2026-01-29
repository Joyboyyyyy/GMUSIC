import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { notificationApi } from '../services/api.service';
import { useThemeStore, getTheme } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Text } from './ui';
import { SPACING, COMPONENT_SIZES } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationBell: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getNotifications(1, true);
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      // Silently fail - don't show errors for notification count
    }
  };

  const handlePress = () => {
    navigation.navigate('Notifications');
  };

  // Use white color in dark mode for better visibility
  const iconColor = isDark ? '#ffffff' : theme.text;

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <Ionicons name="notifications-outline" size={COMPONENT_SIZES.icon.md} color={iconColor} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text variant="captionSmall" style={{ color: '#fff', fontWeight: 'bold' }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: SPACING.md,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxs,
  },
});

export default NotificationBell;
