import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { buildingApi } from '../services/api.service';
import { Building } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AllBuildingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  const fetchBuildings = async () => {
    try {
      const response = await buildingApi.getPublicBuildings();
      if (response.success && response.data) {
        setBuildings(response.data);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBuildings();
    setRefreshing(false);
  }, []);

  const handleBuildingPress = (building: Building) => {
    navigation.navigate('BuildingCourses', {
      buildingId: building.id,
      buildingName: building.name,
    });
  };

  const renderBuildingCard = ({ item: building }: { item: Building }) => {
    const courseCount = building.courses?.length || 0;
    return (
      <TouchableOpacity
        style={styles.buildingCard}
        onPress={() => handleBuildingPress(building)}
        activeOpacity={0.7}
      >
        <View style={styles.buildingIcon}>
          <Ionicons name="business" size={28} color={theme.primary} />
        </View>
        <View style={styles.buildingContent}>
          <Text style={styles.buildingName} numberOfLines={1}>{building.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.buildingLocation}>{building.city}, {building.state}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="school-outline" size={14} color={theme.primary} />
              <Text style={styles.statText}>{courseCount} Course{courseCount !== 1 ? 's' : ''}</Text>
            </View>
            {building.musicRoomCount && (
              <View style={styles.statBadge}>
                <Ionicons name="musical-notes-outline" size={14} color={theme.success} />
                <Text style={[styles.statText, { color: theme.success }]}>{building.musicRoomCount} Room{building.musicRoomCount !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading buildings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>All Buildings</Text>
          <Text style={styles.headerSubtitle}>{buildings.length} building{buildings.length !== 1 ? 's' : ''} available</Text>
        </View>
      </View>

      {buildings.length > 0 ? (
        <FlatList
          data={buildings}
          renderItem={renderBuildingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.buildingsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No Buildings Available</Text>
          <Text style={styles.emptyText}>Public buildings with courses will appear here.</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color={theme.primary} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  headerContent: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  buildingsList: { padding: 16 },
  buildingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2 },
  buildingIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  buildingContent: { flex: 1, marginLeft: 14 },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  buildingLocation: { fontSize: 13, color: theme.textSecondary, marginLeft: 4 },
  statsRow: { flexDirection: 'row', marginTop: 8, gap: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceVariant, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statText: { fontSize: 12, color: theme.primary, fontWeight: '500', marginLeft: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.primaryLight },
  refreshButtonText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: theme.primary },
});

export default AllBuildingsScreen;
