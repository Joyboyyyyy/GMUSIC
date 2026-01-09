import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { notificationApi } from '../services/api.service';
import { Notification } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { formatDistanceToNow } from '../utils/helpers';
import { Text as DSText } from '../components/ui';
import { SPACING, RADIUS, SHADOWS, COMPONENT_SIZES } from '../theme/designSystem';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications(50, false);
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationApi.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
          } catch (error) {
            console.error('Error deleting notification:', error);
          }
        },
      },
    ]);
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'booking': return 'calendar';
      case 'payment': return 'card';
      case 'promotion': return 'star';
      case 'approval': return 'checkmark-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'booking': return '#3b82f6';
      case 'payment': return '#10b981';
      case 'promotion': return '#f59e0b';
      case 'approval': return '#8b5cf6';
      default: return theme.primary;
    }
  };

  const styles = createStyles(theme, isDark);

  const handleToggleExpand = (notificationId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(prev => prev === notificationId ? null : notificationId);
    // Also mark as read when expanding
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      handleMarkAsRead(notificationId);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
        onPress={() => handleToggleExpand(item.id)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
          <Ionicons name={iconName} size={COMPONENT_SIZES.icon.md} color={iconColor} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <DSText variant="label" numberOfLines={isExpanded ? undefined : 1} style={{ flex: 1, color: theme.text }}>{item.title}</DSText>
            <View style={styles.headerIcons}>
              {!item.isRead && <View style={styles.unreadDot} />}
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={theme.textMuted} 
                style={{ marginLeft: SPACING.xs }}
              />
            </View>
          </View>
          <DSText 
            variant="bodySmall" 
            numberOfLines={isExpanded ? undefined : 2} 
            style={[
              styles.messageText,
              { color: theme.textSecondary },
              isExpanded && styles.expandedMessage
            ]}
          >
            {item.message}
          </DSText>
          <View style={styles.footerRow}>
            <DSText variant="caption" style={{ color: theme.textMuted }}>{formatDistanceToNow(item.createdAt)}</DSText>
            {isExpanded && (
              <TouchableOpacity 
                style={[styles.deleteButton, { backgroundColor: theme.error + '15' }]}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={14} color={theme.error} />
                <DSText variant="caption" style={{ color: theme.error, marginLeft: 4 }}>Delete</DSText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <DSText variant="body" style={{ marginTop: SPACING.sm, color: theme.textSecondary }}>Loading notifications...</DSText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <DSText variant="h3" style={{ color: theme.text }}>Notifications</DSText>
          {unreadCount > 0 && (
            <DSText variant="caption" style={{ color: theme.primary, marginTop: SPACING.xxs }}>{unreadCount} unread</DSText>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done" size={18} color={theme.primary} />
            <DSText variant="caption" style={{ fontWeight: '600', color: theme.primary }}>Mark all read</DSText>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="notifications-off-outline" size={COMPONENT_SIZES.icon.xl} color={theme.textMuted} />
          </View>
          <DSText variant="h4" style={{ color: theme.text, marginBottom: SPACING.xs }}>No Notifications</DSText>
          <DSText variant="body" style={{ color: theme.textSecondary, textAlign: 'center' }}>You're all caught up! Check back later for updates.</DSText>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    gap: SPACING.xxs,
  },
  listContent: { padding: SPACING.md },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: theme.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
  },
  iconContainer: {
    width: COMPONENT_SIZES.avatar.md,
    height: COMPONENT_SIZES.avatar.md,
    borderRadius: COMPONENT_SIZES.avatar.md / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  contentContainer: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxs,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: SPACING.xs,
    height: SPACING.xs,
    borderRadius: SPACING.xxs,
    backgroundColor: theme.primary,
  },
  messageText: {
    marginBottom: SPACING.xxs,
  },
  expandedMessage: {
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.sm,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
});

export default NotificationsScreen;
