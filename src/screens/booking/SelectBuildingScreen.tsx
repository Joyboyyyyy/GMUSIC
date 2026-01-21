import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useBookingStore } from '../../store/bookingStore';
import { useThemeStore, getTheme } from '../../store/themeStore';
import { SPACING, RADIUS, COMPONENT_SIZES } from '../../theme/designSystem';
import api from '../../utils/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
interface Building { 
  id: string; 
  name: string; 
  city?: string;
  address?: string;
  musicRoomCount?: number;
  isActive: boolean; 
}

const SelectBuildingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setBuildingId } = useBookingStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { loadBuildings(); }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true); setError(false);
      
      // Fetch buildings that have music rooms available for jamming room booking
      const response = await api.get('/api/music-rooms/buildings');
      
      if (response.data.success && response.data.data) {
        const buildingsData = response.data.data;
        const activeBuildings = buildingsData.filter((building: Building) => building.isActive !== false);
        setBuildings(activeBuildings);
        console.log('[SelectBuildingScreen] ✅ Loaded jamming room buildings:', activeBuildings.length);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('[SelectBuildingScreen] Error loading jamming room buildings:', err);
      
      // Fallback to regular buildings endpoint
      try {
        console.log('[SelectBuildingScreen] 🔄 Trying fallback buildings endpoint...');
        const fallbackResponse = await api.get('/api/buildings/with-music-rooms');
        const fallbackData = fallbackResponse.data?.data || fallbackResponse.data || [];
        const activeBuildings = fallbackData.filter((b: Building) => b.isActive !== false);
        setBuildings(activeBuildings);
        console.log('[SelectBuildingScreen] ✅ Loaded buildings from fallback:', activeBuildings.length);
      } catch (fallbackErr) {
        console.error('[SelectBuildingScreen] Fallback also failed:', fallbackErr);
        setError(true);
        
        if (err.code === 'ERR_NETWORK') {
          Alert.alert('Network Error', 'Unable to connect to server. Please check your internet connection.');
        } else {
          Alert.alert('Error', 'Failed to load jamming room buildings. Please try again later.');
        }
      }
    } finally { 
      setLoading(false); 
    }
  };

  const handleBuildingSelect = (buildingId: string) => { 
    setSelectedBuilding(buildingId); 
    setBuildingId(buildingId); 
  };
  
  const handleContinue = () => { 
    if (selectedBuilding) navigation.navigate('SelectSlot', { buildingId: selectedBuilding }); 
  };

  const styles = createStyles(theme, isDark);

  const renderBuilding = ({ item }: { item: Building }) => {
    const isSelected = selectedBuilding === item.id;
    return (
      <TouchableOpacity 
        style={[styles.buildingCard, isSelected && styles.buildingCardSelected]} 
        onPress={() => handleBuildingSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.buildingHeader}>
          <View style={styles.buildingIcon}>
            <Ionicons name="business" size={COMPONENT_SIZES.icon.md} color={theme.primary} />
          </View>
          <View style={styles.buildingInfo}>
            <Text style={styles.buildingName}>{item.name}</Text>
            {item.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                <Text style={styles.buildingCity}>{item.city}</Text>
              </View>
            )}
            {item.musicRoomCount && item.musicRoomCount > 0 && (
              <View style={styles.roomBadge}>
                <Ionicons name="musical-notes-outline" size={12} color={theme.success} />
                <Text style={styles.roomBadgeText}>{item.musicRoomCount} Music Room{item.musicRoomCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
          {isSelected && (
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-circle" size={COMPONENT_SIZES.icon.md} color={theme.primary} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={COMPONENT_SIZES.icon.md} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Building</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>Choose a building with available jamming rooms</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Loading buildings...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={COMPONENT_SIZES.icon.xl} color={theme.error} />
              <Text style={styles.emptyTitle}>Failed to Load Buildings</Text>
              <Text style={styles.emptyText}>Please check your connection and try again.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadBuildings}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : buildings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={COMPONENT_SIZES.icon.xl} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No Rooms Available</Text>
              <Text style={styles.emptyText}>No buildings with jamming rooms are currently available for booking.</Text>
            </View>
          ) : (
            <FlatList 
              data={buildings} 
              keyExtractor={(item) => item.id} 
              renderItem={renderBuilding} 
              scrollEnabled={false} 
              contentContainerStyle={styles.buildingsList} 
            />
          )}
        </View>
      </ScrollView>

      {selectedBuilding && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={COMPONENT_SIZES.icon.sm} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.screenPadding, 
    paddingVertical: SPACING.md, 
    backgroundColor: theme.card, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  backButton: { 
    width: COMPONENT_SIZES.touchTarget.md, 
    height: COMPONENT_SIZES.touchTarget.md, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  content: { padding: SPACING.screenPadding },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: SPACING.lg },
  buildingsList: { gap: SPACING.sm },
  buildingCard: { 
    backgroundColor: theme.card, 
    borderRadius: RADIUS.md, 
    padding: SPACING.md, 
    borderWidth: 2, 
    borderColor: theme.border, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  buildingCardSelected: { borderColor: theme.primary, backgroundColor: isDark ? '#312e81' : '#faf5ff' },
  buildingHeader: { flexDirection: 'row', alignItems: 'center' },
  buildingIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: RADIUS.sm, 
    backgroundColor: theme.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.sm 
  },
  buildingInfo: { flex: 1 },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: SPACING.xxs },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xxs },
  buildingCity: { fontSize: 13, color: theme.textSecondary, marginLeft: SPACING.xxs },
  roomBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: isDark ? '#064e3b' : '#d1fae5', 
    paddingHorizontal: SPACING.xs, 
    paddingVertical: 2, 
    borderRadius: RADIUS.xs, 
    alignSelf: 'flex-start',
    marginTop: SPACING.xxs,
  },
  roomBadgeText: { fontSize: 11, color: theme.success, fontWeight: '600', marginLeft: SPACING.xxs },
  checkIcon: { marginLeft: SPACING.xs },
  loadingContainer: { padding: SPACING.xxl, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: SPACING.sm, fontSize: 14, color: theme.textSecondary },
  emptyContainer: { padding: SPACING.xxl, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: SPACING.md, marginBottom: SPACING.xs },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  retryButton: { backgroundColor: theme.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  footer: { padding: SPACING.screenPadding, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  continueButton: { 
    backgroundColor: theme.primary, 
    borderRadius: RADIUS.md, 
    paddingVertical: SPACING.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs 
  },
  continueButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default SelectBuildingScreen;
