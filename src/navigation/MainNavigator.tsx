import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapView, Camera, PointAnnotation, setAccessToken } from '@maplibre/maplibre-react-native';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BookRoomScreen from '../screens/booking/BookRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CartIcon from '../components/CartIcon';
import NotificationBell from '../components/NotificationBell';
import FloatingCartBar from '../components/FloatingCartBar';
import { buildingApi } from '../services/api.service';
import { Building } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { MainTabParamList, RootStackParamList } from './types';
import { SPACING, RADIUS, SHADOWS, COMPONENT_SIZES } from '../theme/designSystem';

// Initialize MapLibre (no API key needed)
setAccessToken(null);

const Tab = createBottomTabNavigator<MainTabParamList>();

// Inline NearbyBuildingsScreen to avoid import caching issues
const NearbyBuildingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const cardAnimation = useRef(new Animated.Value(0)).current;

  // Animate card in/out
  useEffect(() => {
    Animated.spring(cardAnimation, {
      toValue: selectedBuilding ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [selectedBuilding]);

  const fetchAllBuildings = async () => {
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
  };

  useEffect(() => { fetchAllBuildings(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllBuildings();
    setRefreshing(false);
  }, []);

  const handleBuildingPress = (building: Building) => {
    navigation.navigate('BuildingCourses', { buildingId: building.id, buildingName: building.name });
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    setCartBarVisible(currentScrollY <= lastScrollY.current || currentScrollY <= 50);
    lastScrollY.current = currentScrollY;
  };

  const styles = createNearbyStyles(theme, isDark);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading buildings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        onScroll={handleScroll} 
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Nearby Buildings</Text>
            <Text style={styles.headerSubtitle}>Find music buildings near you</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationBell />
            <CartIcon />
          </View>
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              mapStyle={isDark 
                ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'}
              logoEnabled={false}
              attributionEnabled={false}
            >
              <Camera
                defaultSettings={{
                  centerCoordinate: [72.8777, 19.0760], // Mumbai center
                  zoomLevel: 8,
                }}
              />
              {buildings.map((building, index) => {
                // City coordinates mapping for Indian cities
                const cityCoords: Record<string, [number, number]> = {
                  'Mumbai': [72.8777, 19.0760],
                  'Thane': [72.9781, 19.2183],
                  'Raigad': [73.1822, 18.5158],
                  'Pune': [73.8567, 18.5204],
                  'Delhi': [77.1025, 28.7041],
                  'Bangalore': [77.5946, 12.9716],
                  'Chennai': [80.2707, 13.0827],
                  'Kolkata': [88.3639, 22.5726],
                  'Hyderabad': [78.4867, 17.3850],
                };
                
                // Use building coordinates if valid, otherwise use city coords or spread around Mumbai
                let lng = building.longitude;
                let lat = building.latitude;
                
                if (!lng || !lat || (lng === 0 && lat === 0)) {
                  const cityCoord = cityCoords[building.city];
                  if (cityCoord) {
                    // Add small offset to prevent markers overlapping
                    lng = cityCoord[0] + (index * 0.02);
                    lat = cityCoord[1] + (index * 0.015);
                  } else {
                    // Default spread around Mumbai
                    lng = 72.8777 + (index * 0.05);
                    lat = 19.0760 + (index * 0.03);
                  }
                }
                
                return (
                  <PointAnnotation
                    key={building.id}
                    id={`marker-${building.id}`}
                    coordinate={[lng, lat]}
                    onSelected={() => setSelectedBuilding(building)}
                  >
                    <View style={[styles.marker, { backgroundColor: building.visibilityType === 'PUBLIC' ? '#10b981' : '#f59e0b' }]}>
                      <Ionicons name="musical-notes" size={16} color="#fff" />
                    </View>
                  </PointAnnotation>
                );
              })}
            </MapView>
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.legendText}>Public</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Private</Text>
              </View>
            </View>
            
            {/* Building Info Card Overlay */}
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
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <Text style={styles.cardDetailText} numberOfLines={1}>{selectedBuilding.address ? `${selectedBuilding.address}, ${selectedBuilding.city}` : selectedBuilding.city}</Text>
                  </View>
                  <View style={styles.cardDetailRow}>
                    <Ionicons name="book-outline" size={14} color={theme.textSecondary} />
                    <Text style={styles.cardDetailText}>{selectedBuilding.courses?.length || (selectedBuilding as any).courseCount || 0} courses available</Text>
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
                return (
                  <TouchableOpacity key={building.id} style={styles.buildingCard} onPress={() => handleBuildingPress(building)} activeOpacity={0.7}>
                    <View style={styles.buildingIcon}><Ionicons name="business" size={28} color={theme.primary} /></View>
                    <View style={styles.buildingContent}>
                      <View style={styles.nameRow}>
                        <Text style={styles.buildingName} numberOfLines={1}>{building.name}</Text>
                        <View style={[styles.visibilityBadge, building.visibilityType === 'PUBLIC' ? styles.publicBadge : styles.privateBadge]}>
                          <Ionicons name={building.visibilityType === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'} size={10} color={building.visibilityType === 'PUBLIC' ? '#10b981' : '#f59e0b'} />
                          <Text style={[styles.visibilityText, building.visibilityType === 'PUBLIC' ? styles.publicText : styles.privateText]}>{building.visibilityType === 'PUBLIC' ? 'Public' : 'Private'}</Text>
                        </View>
                      </View>
                      <View style={styles.locationRow}><Ionicons name="location-outline" size={14} color={theme.textSecondary} /><Text style={styles.buildingLocation}>{building.city}</Text></View>
                      <View style={styles.statsRow}><View style={styles.statBadge}><Ionicons name="school-outline" size={14} color={theme.primary} /><Text style={styles.statText}>{courseCount} Course{courseCount !== 1 ? 's' : ''}</Text></View></View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.screenPadding, paddingTop: SPACING.xs, paddingBottom: SPACING.md },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: SPACING.xxs },
  mapSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  mapContainer: { borderRadius: RADIUS.xl, height: 400, overflow: 'hidden', position: 'relative' },
  map: { flex: 1 },
  marker: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', ...SHADOWS.lg },
  // Building Info Card Overlay
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.xs,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    paddingRight: SPACING.lg,
  },
  cardDetails: {
    marginBottom: SPACING.xs,
    gap: SPACING.xxs,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  cardDetailText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  viewCoursesButton: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.xs,
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  viewCoursesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  mapLegend: { position: 'absolute', bottom: SPACING.sm, left: SPACING.sm, flexDirection: 'row', backgroundColor: theme.card, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, gap: SPACING.md, ...SHADOWS.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  allBuildingsSection: { paddingHorizontal: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  buildingCount: { fontSize: 13, color: theme.textSecondary },
  buildingsList: { gap: SPACING.sm },
  buildingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm, marginBottom: SPACING.sm },
  buildingIcon: { width: 56, height: 56, borderRadius: RADIUS.md, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  buildingContent: { flex: 1, marginLeft: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1 },
  visibilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xxs, paddingVertical: SPACING.xxs, borderRadius: RADIUS.xs, gap: SPACING.xxs },
  publicBadge: { backgroundColor: isDark ? '#064e3b' : '#d1fae5' },
  privateBadge: { backgroundColor: isDark ? '#422006' : '#fef3c7' },
  visibilityText: { fontSize: 9, fontWeight: '600' },
  publicText: { color: '#10b981' },
  privateText: { color: '#f59e0b' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xxs },
  buildingLocation: { fontSize: 13, color: theme.textSecondary, marginLeft: SPACING.xxs },
  statsRow: { flexDirection: 'row', marginTop: SPACING.xs, gap: SPACING.sm },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceVariant, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs, borderRadius: RADIUS.xs },
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
        headerShown: false, // Hide top header for all tabs
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Nearby" component={NearbyBuildingsScreen} options={{ title: 'Nearby Buildi...', tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} /> }} />
      <Tab.Screen name="BookRoom" component={BookRoomScreen} options={{ title: 'Jamming Room', tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
