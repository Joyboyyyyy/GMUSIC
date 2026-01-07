import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapLibreGL from '@maplibre/maplibre-react-native';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BookRoomScreen from '../screens/booking/BookRoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CartIcon from '../components/CartIcon';
import FloatingCartBar from '../components/FloatingCartBar';
import { buildingApi } from '../services/api.service';
import { Building } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { MainTabParamList, RootStackParamList } from './types';

// Initialize MapLibre (no API key needed)
MapLibreGL.setAccessToken(null);

const Tab = createBottomTabNavigator<MainTabParamList>();

// Inline NearbyBuildingsScreen to avoid import caching issues
const NearbyBuildingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);

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
          <Text style={styles.headerTitle}>Nearby Buildings</Text>
          <Text style={styles.headerSubtitle}>Find music buildings near you</Text>
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            <MapLibreGL.MapView
              style={styles.map}
              mapStyle={isDark 
                ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'}
              logoEnabled={false}
              attributionEnabled={false}
            >
              <MapLibreGL.Camera
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
                  <MapLibreGL.PointAnnotation
                    key={building.id}
                    id={`marker-${building.id}`}
                    coordinate={[lng, lat]}
                    onSelected={() => handleBuildingPress(building)}
                  >
                    <View style={[styles.marker, { backgroundColor: building.visibilityType === 'PUBLIC' ? '#10b981' : '#f59e0b' }]}>
                      <Ionicons name="musical-notes" size={16} color="#fff" />
                    </View>
                    <MapLibreGL.Callout title={building.name}>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>{building.name}</Text>
                        <Text style={styles.calloutSubtitle}>{building.city}</Text>
                      </View>
                    </MapLibreGL.Callout>
                  </MapLibreGL.PointAnnotation>
                );
              })}
            </MapLibreGL.MapView>
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
  loadingText: { marginTop: 12, fontSize: 14, color: theme.textSecondary },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  headerSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  mapSection: { paddingHorizontal: 16, marginBottom: 24 },
  mapContainer: { borderRadius: 20, height: 400, overflow: 'hidden', position: 'relative' },
  map: { flex: 1 },
  marker: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  callout: { padding: 8, minWidth: 120 },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
  calloutSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  mapLegend: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', backgroundColor: theme.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 16, elevation: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
  allBuildingsSection: { paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  buildingCount: { fontSize: 13, color: theme.textSecondary },
  buildingsList: { gap: 12 },
  buildingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 16, padding: 16, elevation: 2, marginBottom: 12 },
  buildingIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  buildingContent: { flex: 1, marginLeft: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text, flex: 1 },
  visibilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
  publicBadge: { backgroundColor: isDark ? '#064e3b' : '#d1fae5' },
  privateBadge: { backgroundColor: isDark ? '#422006' : '#fef3c7' },
  visibilityText: { fontSize: 9, fontWeight: '600' },
  publicText: { color: '#10b981' },
  privateText: { color: '#f59e0b' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  buildingLocation: { fontSize: 13, color: theme.textSecondary, marginLeft: 4 },
  statsRow: { flexDirection: 'row', marginTop: 8, gap: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceVariant, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statText: { fontSize: 12, color: theme.primary, fontWeight: '500', marginLeft: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 16 },
});

const MainNavigator = () => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => <CartIcon />,
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
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />, headerRight: () => null }} />
      <Tab.Screen name="Nearby" component={NearbyBuildingsScreen} options={{ title: 'Nearby Buildings', tabBarIcon: ({ color, size }) => <Ionicons name="location" size={size} color={color} /> }} />
      <Tab.Screen name="BookRoom" component={BookRoomScreen} options={{ title: 'Book a Room', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
