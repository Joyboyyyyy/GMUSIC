import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import ProtectedScreen from '../components/ProtectedScreen';
import { Text, Card, Container, Row, Spacer } from '../components/ui';
import { SPACING, COMPONENT_SIZES, RADIUS, SHADOWS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { purchasedPacks } = useLibraryStore();
  const { isDark, toggleTheme } = useThemeStore();
  const theme = getTheme(isDark);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', subtitle: 'Update your personal information', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'library-outline', title: 'My Library', subtitle: 'View your purchased lessons', onPress: () => navigation.navigate('Library') },
    { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage your payment options', onPress: () => Alert.alert('Coming Soon', 'This feature is under development') },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'View your notifications', onPress: () => navigation.navigate('Notifications') },
    { icon: 'shield-checkmark-outline', title: 'Privacy & Security', subtitle: 'Manage your privacy settings', onPress: () => Alert.alert('Coming Soon', 'This feature is under development') },
    { icon: 'lock-closed-outline', title: 'Change Password', subtitle: 'Update your account password', onPress: () => navigation.navigate('ChangePassword') },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get help or contact support', onPress: () => Alert.alert('Coming Soon', 'This feature is under development') },
    { icon: 'chatbubble-ellipses-outline', title: 'Feedback', subtitle: 'Share your thoughts and suggestions', onPress: () => navigation.navigate('Feedback') },
    { icon: 'information-circle-outline', title: 'About', subtitle: 'App version and information', onPress: () => Alert.alert('Gretex Music Room', 'Version 1.0.0\n\nLearn music from the best') },
  ];

  const styles = createStyles(theme);

  return (
    <ProtectedScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.header}>
            <Image source={{ uri: user?.profilePicture || user?.avatar || 'https://i.pravatar.cc/300' }} style={styles.avatar} />
            <Text variant="h3" style={{ color: theme.text, marginBottom: SPACING.xxs }}>{user?.name}</Text>
            <Text variant="body" style={{ color: theme.textSecondary }}>{user?.email}</Text>
          </View>

          {/* Stats */}
          <Card style={styles.statsContainer} elevation="sm">
            <Row style={{ justifyContent: 'space-around' }}>
              <View style={styles.statItem}>
                <Text variant="h3" style={{ color: theme.primary }}>{purchasedPacks.length}</Text>
                <Text variant="caption" style={{ color: theme.textSecondary }}>Packs</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text variant="h3" style={{ color: theme.primary }}>0</Text>
                <Text variant="caption" style={{ color: theme.textSecondary }}>Completed</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text variant="h3" style={{ color: theme.primary }}>{Math.floor(purchasedPacks.reduce((acc, pack) => acc + pack.duration, 0) / 60)}</Text>
                <Text variant="caption" style={{ color: theme.textSecondary }}>Hours</Text>
              </View>
            </Row>
          </Card>

          {/* Dark Mode Toggle */}
          <Card style={styles.themeContainer} elevation="sm">
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ alignItems: 'center', flex: 1 }}>
                <View style={styles.iconContainer}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={COMPONENT_SIZES.icon.sm} color={theme.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text variant="label" style={{ color: theme.text }}>Dark Mode</Text>
                  <Text variant="caption" style={{ color: theme.textMuted }}>{isDark ? 'Dark theme enabled' : 'Light theme enabled'}</Text>
                </View>
              </Row>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? '#fff' : '#f4f3f4'}
              />
            </Row>
          </Card>

          {/* Menu Items */}
          <Card style={styles.menuContainer} elevation="sm" noPadding>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <Row style={{ alignItems: 'center', flex: 1 }}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={COMPONENT_SIZES.icon.sm} color={theme.primary} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text variant="label" style={{ color: theme.text }}>{item.title}</Text>
                    <Text variant="caption" style={{ color: theme.textMuted }}>{item.subtitle}</Text>
                  </View>
                </Row>
                <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={COMPONENT_SIZES.icon.sm} color={theme.error} />
            <Text variant="label" style={{ color: theme.error }}>Logout</Text>
          </TouchableOpacity>

          <Spacer size="xl" />
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { alignItems: 'center', paddingVertical: SPACING.xl, backgroundColor: theme.card, marginBottom: SPACING.md },
  avatar: { width: COMPONENT_SIZES.avatar.xxl, height: COMPONENT_SIZES.avatar.xxl, borderRadius: COMPONENT_SIZES.avatar.xxl / 2, marginBottom: SPACING.md, borderWidth: 3, borderColor: theme.primary },
  statsContainer: { marginHorizontal: SPACING.screenPadding, marginBottom: SPACING.md, padding: SPACING.screenPadding },
  statItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: theme.border },
  themeContainer: { marginHorizontal: SPACING.screenPadding, marginBottom: SPACING.md, padding: SPACING.md },
  menuContainer: { marginHorizontal: SPACING.screenPadding, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: theme.border },
  iconContainer: { width: COMPONENT_SIZES.touchTarget.md, height: COMPONENT_SIZES.touchTarget.md, borderRadius: COMPONENT_SIZES.touchTarget.md / 2, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  menuTextContainer: { flex: 1 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, marginHorizontal: SPACING.screenPadding, padding: SPACING.lg, borderRadius: RADIUS.md, gap: SPACING.xs, borderWidth: 1, borderColor: theme.error },
});

export default ProfileScreen;
