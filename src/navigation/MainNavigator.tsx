import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BookRoomScreen from '../screens/booking/BookRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationBell from '../components/NotificationBell';
import FloatingCartBar from '../components/FloatingCartBar';
import { buildingApi } from '../services/api.service';
import { Building } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { MainTabParamList, RootStackParamList } from './types';
import { SPACING, RADIUS, SHADOWS } from '../theme/designSystem';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Inline NearbyBuildingsScreen - With static map image and lock overlay
const NearbyBuildingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastFetchTime = useRef<number>(Date.now());

  const fetchAllBuildings = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await buildingApi.searchBuildings('', 100);
      if (response.success && response.data) {
        setBuildings(response.data);
      } else {
        const publicResponse = await buildingApi.getPublicBuildings();
        if (publicResponse.success && publicResponse.data) {
          setBuildings(publicResponse.data);
        }
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllBuildings(); }, [fetchAllBuildings]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchTime.current > 30000) {
        fetchAllBuildings(true);
        lastFetchTime.current = now;
      }
    }, [fetchAllBuildings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllBuildings(true);
    setRefreshing(false);
  }, [fetchAllBuildings]);

  const handleBuildingPress = useCallback((building: Building) => {
    navigation.navigate('BuildingCourses', { buildingId: building.id, buildingName: building.name });
  }, [navigation]);

  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    setCartBarVisible(currentScrollY <= lastScrollY.current || currentScrollY <= 50);
    lastScrollY.current = currentScrollY;
  }, []);

  const styles = createNearbyStyles(theme, isDark);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading buildings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        onScroll={handleScroll} 
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Nearby Buildings</Text>
            <Text style={styles.headerSubtitle}>Find music buildings near you</Text>
          </View>
          <View style={styles.headerIcons}>
            <NotificationBell />
          </View>
        </View>

        {/* Static Map Image with Lock Overlay */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop' }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            
            {/* Lock Overlay */}
            <View style={styles.mapOverlay}>
              <View style={styles.lockIconContainer}>
                <Ionicons name="lock-closed" size={32} color="#fff" />
              </View>
              <Text style={styles.overlayTitle}>Coming Soon</Text>
              <Text style={styles.overlayText}>Map feature is under development</Text>
            </View>
          </View>
        </View>

        {/* All Buildings List */}
        <View style={styles.allBuildingsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="business" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}> All Buildings</Text>
            </View>
            <Text style={styles.buildingCount}>{buildings.length} available</Text>
          </View>
          
          {buildings.length > 0 ? (
            <View style={styles.buildingsList}>
              {buildings.map((building) => {
                const courseCount = building.courses?.length || (building as any).courseCount || 0;
                const isPublic = building.visibilityType === 'PUBLIC';
                return (
                  <TouchableOpacity 
                    key={building.id} 
                    style={styles.buildingCard} 
                    onPress={() => handleBuildingPress(building)} 
                    activeOpacity={0.7}
                  >
                    <View style={styles.buildingIcon}>
                      <Ionicons name="business" size={28} color={theme.primary} />
                    </View>
                    <View style={styles.buildingContent}>
                      <View style={styles.nameRow}>
                        <Text style={styles.buildingName} numberOfLines={1}>{building.name}</Text>
                        <View style={[styles.visibilityBadge, isPublic ? styles.publicBadge : styles.privateBadge]}>
                          <Ionicons 
                            name={isPublic ? 'globe-outline' : 'lock-closed-outline'} 
                            size={10} 
                            color={isPublic ? '#10b981' : '#f59e0b'} 
                          />
                          <Text style={[styles.visibilityText, isPublic ? styles.publicText : styles.privateText]}>
                            {isPublic ? 'Public' : 'Private'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                        <Text style={styles.buildingLocation}>{building.city}</Text>
                      </View>
                      <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                          <Ionicons name="school-outline" size={14} color={theme.primary} />
                          <Text style={styles.statText}>{courseCount} Course{courseCount !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No Buildings Available</Text>
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <FloatingCartBar visible={cartBarVisible} />
    </SafeAreaView>
  );
};

const createNearbyStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: SPACING.sm, fontSize: 14, color: theme.textSecondary },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingHorizontal: SPACING.screenPadding, 
    paddingTop: SPACING.xs, 
    paddingBottom: SPACING.md 
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: SPACING.xxs },
  headerIcons: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mapSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  mapContainer: { borderRadius: RADIUS.xl, height: 250, overflow: 'hidden', position: 'relative' },
  mapImage: { width: '100%', height: '100%' },
  // Lock Overlay
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  overlayText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  // Buildings List
  allBuildingsSection: { paddingHorizontal: SPACING.md },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  buildingCount: { fontSize: 13, color: theme.textSecondary },
  buildingsList: { gap: SPACING.sm },
  buildingCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.card, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md, 
    ...SHADOWS.sm, 
    marginBottom: SPACING.sm 
  },
  buildingIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: RADIUS.md, 
    backgroundColor: theme.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  buildingContent: { flex: 1, marginLeft: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1 },
  visibilityBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.xxs, 
    paddingVertical: SPACING.xxs, 
    borderRadius: RADIUS.xs, 
    gap: SPACING.xxs 
  },
  publicBadge: { backgroundColor: isDark ? '#064e3b' : '#d1fae5' },
  privateBadge: { backgroundColor: isDark ? '#422006' : '#fef3c7' },
  visibilityText: { fontSize: 9, fontWeight: '600' },
  publicText: { color: '#10b981' },
  privateText: { color: '#f59e0b' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xxs },
  buildingLocation: { fontSize: 13, color: theme.textSecondary, marginLeft: SPACING.xxs },
  statsRow: { flexDirection: 'row', marginTop: SPACING.xs, gap: SPACING.sm },
  statBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surfaceVariant, 
    paddingHorizontal: SPACING.xs, 
    paddingVertical: SPACING.xxs, 
    borderRadius: RADIUS.xs 
  },
  statText: { fontSize: 12, color: theme.primary, fontWeight: '500', marginLeft: SPACING.xxs },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: SPACING.md },
});

const MainNavigator = () => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} 
      />
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} 
      />
      <Tab.Screen 
        name="Nearby" 
        component={NearbyBuildingsScreen} 
        options={{ 
          title: 'Nearby', 
          tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="BookRoom" 
        component={BookRoomScreen} 
        options={{ 
          title: 'Jamming Room', 
          tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes-outline" size={size} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} 
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
