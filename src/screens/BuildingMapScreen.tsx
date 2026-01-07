import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { buildingApi } from '../services/api.service';
import { Building } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BuildingMapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => { initializeScreen(); }, []);

  const initializeScreen = async () => { await requestLocationPermission(); await fetchBuildings(); };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      }
    } catch (error) { console.log('[Location] Permission error:', error); }
  };

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const response = await buildingApi.getPublicBuildings();
      if (response.success && response.data) {
        const validBuildings = response.data.filter((b: Building) => b.latitude && b.longitude && !isNaN(b.latitude) && !isNaN(b.longitude));
        if (userLocation) validBuildings.sort((a: Building, b: Building) => getDistanceValue(a) - getDistanceValue(b));
        setBuildings(validBuildings);
      }
    } catch (error) { console.error('[Buildings] Error fetching:', error); Alert.alert('Error', 'Failed to load buildings.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchBuildings(); };

  const getDistanceValue = (building: Building): number => {
    if (!userLocation) return Infinity;
    const R = 6371;
    const dLat = (building.latitude - userLocation.latitude) * Math.PI / 180;
    const dLon = (building.longitude - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(building.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const getDistanceText = (building: Building): string | null => {
    if (!userLocation) return null;
    const distance = getDistanceValue(building);
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const openInMaps = (building: Building) => {
    const { latitude: lat, longitude: lng, name } = building;
    const label = encodeURIComponent(name);
    const scheme = Platform.select({ ios: `maps:0,0?q=${label}@${lat},${lng}`, android: `geo:${lat},${lng}?q=${lat},${lng}(${label})` });
    if (scheme) Linking.canOpenURL(scheme).then((supported) => Linking.openURL(supported ? scheme : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`));
  };

  const openDirections = (building: Building) => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${building.latitude},${building.longitude}`);
  const handleBuildingPress = (building: Building) => navigation.navigate('BuildingCourses', { buildingId: building.id, buildingName: building.name });

  const styles = createStyles(theme, isDark);

  const renderBuilding = ({ item: building }: { item: Building }) => (
    <View style={styles.buildingCard}>
      <TouchableOpacity style={styles.buildingContent} onPress={() => handleBuildingPress(building)} activeOpacity={0.7}>
        <View style={styles.buildingIcon}><Ionicons name="business" size={28} color={theme.primary} /></View>
        <View style={styles.buildingInfo}>
          <Text style={styles.buildingName}>{building.name}</Text>
          <View style={styles.locationRow}><Ionicons name="location-outline" size={14} color={theme.textSecondary} /><Text style={styles.buildingCity} numberOfLines={1}>{building.city}</Text></View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}><Ionicons name="school-outline" size={12} color={theme.primary} /><Text style={styles.statText}>{building.courses?.length || 0} courses</Text></View>
            {userLocation && <View style={styles.distanceBadge}><Ionicons name="navigate-outline" size={12} color={theme.success} /><Text style={styles.distanceText}>{getDistanceText(building)}</Text></View>}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.mapButton} onPress={() => openInMaps(building)}><Ionicons name="map-outline" size={18} color={theme.primary} /><Text style={styles.mapButtonText}>View on Map</Text></TouchableOpacity>
        <TouchableOpacity style={styles.directionsButton} onPress={() => openDirections(building)}><Ionicons name="navigate" size={18} color="#fff" /><Text style={styles.directionsButtonText}>Directions</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}><Ionicons name="business-outline" size={64} color={theme.textMuted} /><Text style={styles.emptyTitle}>No Buildings Found</Text><Text style={styles.emptyText}>There are no music buildings registered yet.</Text></View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Music Buildings</Text>
          <Text style={styles.headerSubtitle}>{buildings.length} location{buildings.length !== 1 ? 's' : ''}{userLocation ? ' • Sorted by distance' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>{loading ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="refresh" size={22} color={theme.primary} />}</TouchableOpacity>
      </View>

      <View style={styles.infoBanner}><Ionicons name="information-circle" size={20} color={theme.primary} /><Text style={styles.infoText}>Tap a building to view courses, or use buttons to open in Maps app</Text></View>

      {loading && buildings.length === 0 ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /><Text style={styles.loadingText}>Finding music buildings...</Text></View>
      ) : (
        <FlatList data={buildings} renderItem={renderBuilding} keyExtractor={(item) => item.id} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} ListEmptyComponent={renderEmpty} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />} />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  backButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  headerSubtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  refreshButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: theme.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, color: theme.textSecondary },
  listContent: { padding: 16, paddingBottom: 32 },
  buildingCard: { backgroundColor: theme.card, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  buildingContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  buildingIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  buildingInfo: { flex: 1, marginLeft: 14 },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  buildingCity: { fontSize: 13, color: theme.textSecondary, flex: 1 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statText: { fontSize: 11, color: theme.primary, fontWeight: '600' },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  distanceText: { fontSize: 11, color: theme.success, fontWeight: '600' },
  actionButtons: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.border },
  mapButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6, borderRightWidth: 1, borderRightColor: theme.border },
  mapButtonText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  directionsButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: theme.primary, gap: 6 },
  directionsButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
});

export default BuildingMapScreen;
