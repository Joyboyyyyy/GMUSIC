import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import ProtectedScreen from '../components/ProtectedScreen';
import NotificationBell from '../components/NotificationBell';
import CartIcon from '../components/CartIcon';
import AlertModal from '../components/AlertModal';
import { Text, Card, Row, Spacer } from '../components/ui';
import { SPACING, COMPONENT_SIZES, RADIUS } from '../theme/designSystem';
import { useAlert } from '../hooks/useAlert';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { purchasedPacks } = useLibraryStore();
  const { purchasedCourseIds } = usePurchasedCoursesStore();
  const { isDark, toggleTheme } = useThemeStore();
  const theme = getTheme(isDark);
  const { alertState, showAlert, hideAlert } = useAlert();
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  // Use purchasedCourseIds count as the primary source
  const purchasedCount = purchasedCourseIds.length;

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', subtitle: 'Update your personal information', onPress: () => navigation.navigate('EditProfile') },
    { icon: 'library-outline', title: 'My Library', subtitle: 'View your purchased lessons', onPress: () => navigation.navigate('Library') },
    { icon: 'receipt-outline', title: 'Payment Invoices', subtitle: 'View your purchase history', onPress: () => navigation.navigate('PaymentInvoices' as any) },
    { icon: 'shield-checkmark-outline', title: 'Privacy & Security', subtitle: 'Manage your privacy settings', onPress: () => showAlert('Coming Soon', 'This feature is under development', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'information-circle-outline', 'info') },
    { icon: 'lock-closed-outline', title: 'Change Password', subtitle: 'Update your account password', onPress: () => navigation.navigate('ChangePassword') },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'Get help or contact support', onPress: () => showAlert('Coming Soon', 'This feature is under development', [{ text: 'OK', onPress: hideAlert, style: 'default' }], 'information-circle-outline', 'info') },
    { icon: 'chatbubble-ellipses-outline', title: 'Feedback', subtitle: 'Share your thoughts and suggestions', onPress: () => navigation.navigate('Feedback') },
    { icon: 'information-circle-outline', title: 'About', subtitle: 'App version and policies', onPress: () => navigation.navigate('About') },
  ];

  const styles = createStyles(theme);

  return (
    <ProtectedScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Profile picture fallback order: 
                  1. profilePicture (primary/authoritative field)
                  2. avatar (backward compatibility)
                  3. default avatar URL (when both are empty) */}
              <Image source={{ uri: user?.profilePicture || user?.avatar || 'https://i.pravatar.cc/300' }} style={styles.avatar} />
              <Text variant="h3" style={{ color: theme.text, marginBottom: SPACING.xxs }}>{user?.name}</Text>
              <Text variant="body" style={{ color: theme.textSecondary }}>{user?.email}</Text>
            </View>
            <View style={styles.headerIcons}>
              <NotificationBell />
              <CartIcon />
            </View>
          </View>

          {/* Stats - TODO: Implement later
          <Card style={styles.statsContainer} elevation="sm">
            <Row style={{ justifyContent: 'space-around', alignItems: 'center' }}>
              <View style={styles.statItem}>
                <Text variant="h3" style={{ color: theme.primary }}>{purchasedCount}</Text>
                <Text variant="caption" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>Packs</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text variant="h3" style={{ color: theme.primary }}>0</Text>
                <Text variant="caption" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>Completed</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text variant="h3" style={{ color: theme.primary }}>{Math.floor(purchasedPacks.reduce((acc, pack) => acc + pack.duration, 0) / 60)}</Text>
                <Text variant="caption" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>Hours</Text>
              </View>
            </Row>
          </Card>
          */}

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

          {/* Notifications Toggle */}
          <Card style={styles.themeContainer} elevation="sm">
            <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Row style={{ alignItems: 'center', flex: 1 }}>
                <View style={styles.iconContainer}>
                  <Ionicons name="notifications-outline" size={COMPONENT_SIZES.icon.sm} color={theme.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text variant="label" style={{ color: theme.text }}>Notifications</Text>
                  <Text variant="caption" style={{ color: theme.textMuted }}>
                    {notificationsEnabled ? 'Receive notifications' : 'Notifications disabled'}
                  </Text>
                </View>
              </Row>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </Row>
          </Card>

          {/* Buildings Section */}
          <Card style={styles.buildingsContainer} elevation="sm">
            <TouchableOpacity 
              style={styles.buildingsHeader}
              onPress={() => navigation.navigate('AllBuildings')}
            >
              <Row style={{ alignItems: 'center', flex: 1 }}>
                <View style={styles.iconContainer}>
                  <Ionicons name="business-outline" size={COMPONENT_SIZES.icon.sm} color={theme.primary} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text variant="label" style={{ color: theme.text }}>Buildings</Text>
                  <Text variant="caption" style={{ color: theme.textMuted }}>
                    {user?.building ? `Member of ${user.building.name}` : 'Browse and join buildings'}
                  </Text>
                </View>
              </Row>
              <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
            </TouchableOpacity>
            
            {/* Current Building Status */}
            {user?.building && (
              <View style={styles.currentBuildingInfo}>
                <View style={[styles.statusIndicator, { backgroundColor: theme.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                  <Text variant="captionSmall" style={{ color: theme.success, marginLeft: 4 }}>Active Member</Text>
                </View>
                <Text variant="caption" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>
                  {user.building.city}
                </Text>
              </View>
            )}
            
            {/* Pending Request Status */}
            {user?.requestedBuildingId && !user?.building && (
              <View style={styles.currentBuildingInfo}>
                <View style={[styles.statusIndicator, { backgroundColor: theme.warning + '20' }]}>
                  <Ionicons name="time-outline" size={14} color={theme.warning} />
                  <Text variant="captionSmall" style={{ color: theme.warning, marginLeft: 4 }}>Request Pending</Text>
                </View>
                <Text variant="caption" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>
                  Awaiting approval from building admin
                </Text>
              </View>
            )}
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
          <Card style={styles.logoutButton} elevation="sm">
            <TouchableOpacity style={styles.logoutButtonContent} onPress={handleLogout}>
              <Row style={{ alignItems: 'center', flex: 1 }}>
                <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
                  <Ionicons name="log-out-outline" size={COMPONENT_SIZES.icon.sm} color={theme.error} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text variant="label" style={{ color: theme.text }}>Logout</Text>
                  <Text variant="caption" style={{ color: theme.textMuted }}>Sign out of your account</Text>
                </View>
              </Row>
              <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
            </TouchableOpacity>
          </Card>

          <Spacer size="xl" />
        </ScrollView>

        {/* Logout Confirmation Modal */}
        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <Pressable
            style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}
            onPress={() => setShowLogoutModal(false)}
          >
            <Pressable style={[styles.modalContent, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: '#FFE5E5' }]}>
                <Ionicons name="log-out-outline" size={28} color="#E63946" />
              </View>

              {/* Title */}
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                Log out?
              </Text>

              {/* Message */}
              <Text style={[styles.modalMessage, { color: isDark ? '#B0B0B0' : '#666666' }]}>
                You'll need to sign in again to access your lessons.
              </Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <Pressable
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowLogoutModal(false)}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.destructiveButton]}
                  onPress={handleConfirmLogout}
                >
                  <Text style={[styles.buttonText, styles.destructiveButtonText]}>
                    Log out
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Generic Alert Modal */}
        <AlertModal
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          icon={alertState.icon as any}
          iconType={alertState.iconType}
          buttons={alertState.buttons}
          onDismiss={hideAlert}
        />
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: SPACING.xl, 
    paddingHorizontal: SPACING.screenPadding, 
    backgroundColor: theme.background,
    marginBottom: SPACING.lg 
  },
  headerContent: { 
    alignItems: 'center', 
    flex: 1 
  },
  headerIcons: { 
    position: 'absolute', 
    top: SPACING.md, 
    right: SPACING.screenPadding, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: SPACING.xs,
  },
  avatar: { 
    width: COMPONENT_SIZES.avatar.xxl, 
    height: COMPONENT_SIZES.avatar.xxl, 
    borderRadius: COMPONENT_SIZES.avatar.xxl / 2, 
    marginBottom: SPACING.md, 
    borderWidth: 3, 
    borderColor: theme.primary 
  },
  statsContainer: { 
    marginHorizontal: SPACING.screenPadding, 
    marginBottom: SPACING.lg, 
    padding: SPACING.md 
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  divider: { 
    width: 1, 
    height: 40,
    backgroundColor: theme.border 
  },
  themeContainer: { 
    marginHorizontal: SPACING.screenPadding, 
    marginBottom: SPACING.md, 
    padding: SPACING.md 
  },
  buildingsContainer: { 
    marginHorizontal: SPACING.screenPadding, 
    marginBottom: SPACING.lg, 
    padding: 0, 
    overflow: 'hidden' 
  },
  buildingsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: SPACING.md 
  },
  currentBuildingInfo: { 
    paddingHorizontal: SPACING.md, 
    paddingBottom: SPACING.md, 
    borderTopWidth: 1, 
    borderTopColor: theme.border, 
    paddingTop: SPACING.sm 
  },
  statusIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.xs, 
    paddingVertical: 2, 
    borderRadius: RADIUS.xs, 
    alignSelf: 'flex-start' 
  },
  menuContainer: { 
    marginHorizontal: SPACING.screenPadding, 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    marginBottom: SPACING.lg 
  },
  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
    minHeight: 72,
  },
  iconContainer: { 
    width: COMPONENT_SIZES.touchTarget.md, 
    height: COMPONENT_SIZES.touchTarget.md, 
    borderRadius: COMPONENT_SIZES.touchTarget.md / 2, 
    backgroundColor: theme.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.md 
  },
  menuTextContainer: { 
    flex: 1 
  },
  logoutButton: { 
    marginHorizontal: SPACING.screenPadding, 
    marginBottom: SPACING.lg,
    padding: 0,
    overflow: 'hidden',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    minHeight: COMPONENT_SIZES.button.height.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme === getTheme(true) ? 0.3 : 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 320,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFE5E5',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#5B5BFF',
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

export default ProfileScreen;
