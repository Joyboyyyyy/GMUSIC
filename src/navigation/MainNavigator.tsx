import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
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

// Default region (Mumbai)
const DEFAULT_REGION: Region = {
  latitude: 19.0760,
  longitude: 72.8777,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

// City coordinates mapping for Indian cities
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
  'Thane': { latitude: 19.2183, longitude: 72.9781 },
  'Raigad': { latitude: 18.5158, longitude: 73.1822 },
  'Pune': { latitude: 18.5204, longitude: 73.8567 },
  'Delhi': { latitude: 28.7041, longitude: 77.1025 },
  'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
  'Chennai': { latitude: 13.0827, longitude: 80.2707 },
  'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
  'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
};

// Static marker styles (outside component to prevent re-renders)
const markerStyles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // User location - blue dot with pulse effect
  userLocationOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  userLocationInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});

// Inline NearbyBuildingsScreen
const NearbyBuildingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mapRef = useRef<MapView>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const cardAnimation = useRef(new Animated.Value(0)).current;
  const lastFetchTime = useRef<number>(Date.now());

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        console.log('[Location] Requesting permissions...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[Location] Permission status:', status);
        
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }

        console.log('[Location] Getting current position...');
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        console.log('[Location] Got location:', coords.latitude, coords.longitude);
        setUserLocation(coords);
        
        // Center map on user location
        setMapRegion({
          ...coords,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      } catch (error) {
        console.error('[Location] Error:', error);
        setLocationError('Could not get location');
      }
    })();
  }, []);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [userLocation]);

  // Animate card in/out
  useEffect(() => {
    Animated.spring(cardAnimation, {
      toValue: selectedBuilding ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [selectedBuilding, cardAnimation]);

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

  const styles = useMemo(() => createNearbyStyles(theme, isDark), [theme, isDark]);

  // Get building coordinates
  const getBuildingCoords = useCallback((building: Building, index: number) => {
    let lat = building.latitude;
    let lng = building.longitude;
    
    if (!lat || !lng || (lat === 0 && lng === 0)) {
      const cityCoord = CITY_COORDS[building.city];
      if (cityCoord) {
        lat = cityCoord.latitude + (index * 0.015);
        lng = cityCoord.longitude + (index * 0.02);
      } else {
        lat = 19.0760 + (index * 0.03);
        lng = 72.8777 + (index * 0.05);
      }
    }
    return { latitude: lat, longitude: lng };
  }, []);

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
            <Text style={styles.headerSubtitle}>
              {userLocation 
                ? 'Find music buildings near you' 
                : locationError 
                  ? `⚠️ ${locationError}` 
                  : 'Getting your location...'}
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <NotificationBell />
            
          </View>
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={mapRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={true}
              mapType="standard"
              userInterfaceStyle={isDark ? 'dark' : 'light'}
            >
              {/* User Location Marker - Blue Dot */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={markerStyles.userLocationOuter}>
                    <View style={markerStyles.userLocationInner} />
                  </View>
                </Marker>
              )}
              
              {/* Building Markers */}
              {buildings.map((building, index) => {
                const coords = getBuildingCoords(building, index);
                const isPublic = building.visibilityType === 'PUBLIC';
                
                return (
                  <Marker
                    key={building.id}
                    coordinate={coords}
                    title={building.name}
                    description={`${building.city} • ${building.courses?.length || 0} courses`}
                    onPress={() => setSelectedBuilding(building)}
                    tracksViewChanges={false}
                  >
                    <View style={[markerStyles.container, { backgroundColor: isPublic ? '#10b981' : '#f59e0b' }]}>
                      <Ionicons name="musical-notes" size={16} color="#fff" />
                    </View>
                  </Marker>
                );
              })}
            </MapView>
            
            {/* Legend */}
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.legendText}>You</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Public</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Private</Text>
              </View>
            </View>
            
            {/* Center on User Button */}
            {userLocation && (
              <TouchableOpacity style={styles.centerButton} onPress={centerOnUser} activeOpacity={0.8}>
                <Ionicons name="locate" size={22} color={theme.primary} />
              </TouchableOpacity>
            )}

            {/* Building Info Card */}
            {selectedBuilding && (
              <Animated.View style={[
                styles.buildingInfoCard,
                {
                  opacity: cardAnimation,
                  transform: [
                    { scale: cardAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                    { translateY: cardAnimation.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
                  ],
                }
              ]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedBuilding(null)}>
                  <Ionicons name="close" size={16} color={theme.textMuted} />
                </TouchableOpacity>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="musical-notes" size={18} color="#fff" />
                  </View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{selectedBuilding.name}</Text>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.cardDetailRow}>

            {/* Under Development Overlay */}
            <View style={styles.mapOverlay}>
              <View style={styles.overlayContent}>
                <View style={styles.lockIconContainer}>
                  <Ionicons name="construct" size={32} color="#fff" />
                </View>
                <Text style={styles.overlayTitle}>Coming Soon</Text>
                <Text style={styles.overlayText}>Map feature is under development</Text>
              </View>
            </View>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <Text style={styles.cardDetailText} numberOfLines={1}>
                      {selectedBuilding.address ? `${selectedBuilding.address}, ${selectedBuilding.city}` : selectedBuilding.city}
                    </Text>
                  </View>
                  <View style={styles.cardDetailRow}>
                    <Ionicons name="book-outline" size={14} color={theme.textSecondary} />
                    <Text style={styles.cardDetailText}>
                      {selectedBuilding.courses?.length || (selectedBuilding as any).courseCount || 0} courses
                    </Text>
                  </View>
                  <View style={styles.cardDetailRow}>
                    <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                    <Text style={styles.cardDetailText}>{selectedBuilding.musicRoomCount || 0} music rooms</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.viewCoursesButton} 
                  onPress={() => {
                    setSelectedBuilding(null);
                    handleBuildingPress(selectedBuilding);
                  }}
                >
                  <Text style={styles.viewCoursesText}>View Courses</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
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
                            color={isPublic ? '#10b981' : '#ebb542ff'} 
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
  mapContainer: { borderRadius: RADIUS.xl, height: 400, overflow: 'hidden', position: 'relative' },
  map: { flex: 1 },
  // Map Overlay - Under Development
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlayContent: {
    alignItems: 'center',
    padding: SPACING.lg,
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
  // Center Button
  centerButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  // Legend
  mapLegend: { 
    position: 'absolute', 
    bottom: SPACING.sm, 
    left: SPACING.sm, 
    flexDirection: 'row', 
    backgroundColor: theme.card, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xs, 
    borderRadius: RADIUS.full, 
    gap: SPACING.md, 
    ...SHADOWS.md 
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  // Building Info Card
  buildingInfoCard: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    width: 200,
    backgroundColor: theme.card,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    ...SHADOWS.xl,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: SPACING.sm,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.xs,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1, paddingRight: SPACING.lg },
  cardDetails: { marginBottom: SPACING.xs, gap: SPACING.xxs },
  cardDetailRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  cardDetailText: { fontSize: 12, color: theme.textSecondary },
  viewCoursesButton: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.xs,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  viewCoursesText: { fontSize: 14, fontWeight: '600', color: '#fff' },
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
