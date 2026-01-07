import React from 'react';
import {
  View,
  Text,
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
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage notification preferences', onPress: () => navigation.navigate('NotificationSettings') },
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
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{purchasedPacks.length}</Text>
              <Text style={styles.statLabel}>Packs</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.floor(purchasedPacks.reduce((acc, pack) => acc + pack.duration, 0) / 60)}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
          </View>

          {/* Dark Mode Toggle */}
          <View style={styles.themeContainer}>
            <View style={styles.themeLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={22} color={theme.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>Dark Mode</Text>
                <Text style={styles.menuSubtitle}>{isDark ? 'Dark theme enabled' : 'Light theme enabled'}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Menu Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                <View style={styles.menuLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={item.icon as any} size={22} color={theme.primary} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={theme.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { alignItems: 'center', paddingVertical: 32, backgroundColor: theme.card, marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16, borderWidth: 3, borderColor: theme.primary },
  name: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  email: { fontSize: 14, color: theme.textSecondary },
  statsContainer: { flexDirection: 'row', backgroundColor: theme.card, marginHorizontal: 20, marginBottom: 16, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: theme.border },
  statValue: { fontSize: 24, fontWeight: 'bold', color: theme.primary, marginBottom: 4 },
  statLabel: { fontSize: 13, color: theme.textSecondary },
  themeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.card, marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  themeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuContainer: { backgroundColor: theme.card, marginHorizontal: 20, borderRadius: 12, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 4 },
  menuSubtitle: { fontSize: 13, color: theme.textMuted },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.card, marginHorizontal: 20, padding: 18, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: theme.error },
  logoutText: { fontSize: 16, fontWeight: '600', color: theme.error },
});

export default ProfileScreen;
