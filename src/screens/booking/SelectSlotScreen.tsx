import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useBookingStore } from '../../store/bookingStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore, getTheme } from '../../store/themeStore';
import ProtectedScreen from '../../components/ProtectedScreen';
import api from '../../utils/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SelectSlotRouteProp = RouteProp<RootStackParamList, 'SelectSlot'>;
interface TimeSlot { 
  time: string; 
  available: boolean;
  id?: string;
  price?: number;
  duration?: number;
}

const SelectSlotScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SelectSlotRouteProp>();
  const { buildingId, date } = route.params || {};
  const { setDate, setSlot, buildingId: storeBuildingId } = useBookingStore();
  const { status, setRedirectPath } = useAuthStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [selectedDate, setSelectedDate] = useState<string>(date || new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const currentBuildingId = buildingId || storeBuildingId;
    if (currentBuildingId && !storeBuildingId) useBookingStore.getState().setBuildingId(currentBuildingId);
    
    if (currentBuildingId) {
      loadTimeSlots(currentBuildingId);
    } else {
      console.log('[SelectSlotScreen] No buildingId available');
      setTimeSlots([]);
    }
  }, [selectedDate, buildingId, storeBuildingId]);

  const loadTimeSlots = async (buildingIdParam?: string) => {
    const currentBuildingId = buildingIdParam || buildingId || storeBuildingId;
    if (!currentBuildingId) { 
      Alert.alert('Error', 'Building ID is missing'); 
      return; 
    }
    
    try {
      setLoading(true); 
      setError(false);
      
      console.log('[SelectSlotScreen] Fetching real-time slots from database for building:', currentBuildingId);
      
      // Fetch real jamming room slots from the database
      const response = await api.get(`/api/music-rooms/buildings/${currentBuildingId}/slots`, { 
        params: { date: selectedDate } 
      });
      
      if (response.data.success && response.data.data) {
        const slots = response.data.data.map((slot: any) => ({ 
          time: slot.time, 
          available: slot.available,
          id: slot.id,
          price: slot.price,
          duration: slot.duration,
        }));
        setTimeSlots(slots);
        console.log('[SelectSlotScreen] ✅ Loaded real-time slots from database:', slots.length, 'slots');
        console.log('[SelectSlotScreen] Booked slots:', slots.filter((s: any) => !s.available).length);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('[SelectSlotScreen] Error loading slots:', err);
      setError(true);
      setTimeSlots([]);
      
      // Show error to user
      if (err.response?.status === 404) {
        Alert.alert('Error', 'Building not found or has no music rooms');
      } else if (err.response?.status === 500) {
        Alert.alert('Error', 'Server error loading slots. Please try again.');
      } else if (err.code === 'ERR_NETWORK') {
        Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
        Alert.alert('Error', 'Failed to load time slots. Please try again.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const handleDateSelect = (dateStr: string) => { setSelectedDate(dateStr); setSelectedSlot(null); };
  const handleSlotSelect = (slotTime: string) => { setSelectedSlot(slotTime); setSlot(slotTime); };

  const handleConfirmBooking = () => {
    if (!selectedSlot) { Alert.alert('Error', 'Please select a time slot'); return; }
    
    // Check if user is authenticated
    if (status !== 'authenticated') {
      const currentBuildingId = buildingId || storeBuildingId;
      if (!currentBuildingId) { Alert.alert('Error', 'Building ID is missing'); return; }
      setRedirectPath({ name: 'SelectSlot', params: { buildingId: currentBuildingId, date: selectedDate } });
      navigation.navigate('Auth', { screen: 'Login' });
      return;
    }
    
    // Get the selected slot details
    const selectedSlotData = timeSlots.find(slot => slot.time === selectedSlot);
    const slotPrice = selectedSlotData?.price || 500; // Default price if not available
    const slotDuration = selectedSlotData?.duration || 60; // Default duration
    
    // Navigate to checkout with jamming room booking details
    setDate(selectedDate);
    
    // Create a pack-like object for checkout
    const jammingRoomPack = {
      id: selectedSlotData?.id || `slot-${Date.now()}`,
      packId: selectedSlotData?.id || `slot-${Date.now()}`,
      title: `Jamming Room - ${selectedSlot}`,
      price: slotPrice,
      thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400',
      quantity: 1,
      date: selectedDate,
      time: selectedSlot,
      buildingId: buildingId || storeBuildingId || undefined,
      duration: slotDuration,
      type: 'jamming_room' as const,
    };
    
    // Navigate to checkout screen
    navigation.navigate('Checkout', { 
      items: [jammingRoomPack],
      isJammingRoom: true,
    });
  };

  const getAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) { const d = new Date(today); d.setDate(today.getDate() + i); dates.push(d.toISOString().split('T')[0]); }
    return dates;
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const styles = createStyles(theme, isDark);

  return (
    <ProtectedScreen requireAuth={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Time Slot</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
              {getAvailableDates().map((dateStr) => {
                const isSelected = selectedDate === dateStr;
                return (
                  <TouchableOpacity key={dateStr} style={[styles.dateCard, isSelected && styles.dateCardSelected]} onPress={() => handleDateSelect(dateStr)}>
                    <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{formatDateDisplay(dateStr)}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Loading available slots...</Text>
              </View>
            ) : timeSlots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={64} color={theme.textMuted} />
                <Text style={styles.emptyTitle}>No Slots Available</Text>
                <Text style={styles.emptyText}>No time slots are available for this date. Please try another date.</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {timeSlots.map((slot, index) => {
                  const isSelected = selectedSlot === slot.time;
                  const isBooked = !slot.available;
                  return (
                    <TouchableOpacity 
                      key={`${slot.time}-${index}`} 
                      style={[
                        styles.slotCard, 
                        isBooked && styles.slotCardBooked,
                        isSelected && styles.slotCardSelected
                      ]} 
                      onPress={() => slot.available && handleSlotSelect(slot.time)} 
                      disabled={isBooked}
                      activeOpacity={isBooked ? 1 : 0.7}
                    >
                      <Text style={[
                        styles.slotText, 
                        isBooked && styles.slotTextBooked, 
                        isSelected && styles.slotTextSelected
                      ]}>
                        {slot.time}
                      </Text>
                      {isBooked && (
                        <View style={styles.bookedBadge}>
                          <Text style={styles.bookedText}>Booked</Text>
                        </View>
                      )}
                      {isSelected && slot.available && <Ionicons name="checkmark-circle" size={16} color={theme.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {selectedSlot && (
          <View style={styles.footer}>
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryText}>{formatDateDisplay(selectedDate)} • {selectedSlot}</Text>
              <Text style={styles.summaryPrice}>₹{timeSlots.find(s => s.time === selectedSlot)?.price || 500}/hour</Text>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmBooking}>
              <Text style={styles.confirmButtonText}>{status === 'authenticated' ? 'Proceed to Payment' : 'Login to Book'}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  datesContainer: { gap: 12, paddingRight: 20 },
  dateCard: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.card, borderWidth: 2, borderColor: theme.border, marginRight: 12 },
  dateCardSelected: { borderColor: theme.primary, backgroundColor: isDark ? '#312e81' : '#faf5ff' },
  dateText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  dateTextSelected: { color: theme.primary },
  loadingContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.textSecondary },
  emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slotCard: { width: '48%', padding: 16, borderRadius: 12, backgroundColor: theme.card, borderWidth: 2, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotCardSelected: { borderColor: theme.primary, backgroundColor: isDark ? '#312e81' : '#faf5ff' },
  slotCardBooked: { 
    backgroundColor: isDark ? '#422006' : '#fff7ed', 
    borderColor: isDark ? '#ea580c' : '#fb923c',
    opacity: 0.8,
  },
  slotText: { fontSize: 14, fontWeight: '600', color: theme.text },
  slotTextSelected: { color: theme.primary },
  slotTextBooked: { color: isDark ? '#fb923c' : '#ea580c' },
  bookedBadge: {
    backgroundColor: isDark ? '#ea580c' : '#fb923c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: { padding: 20, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  bookingSummary: { marginBottom: 12 },
  summaryText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  summaryPrice: { fontSize: 18, fontWeight: 'bold', color: theme.primary, textAlign: 'center', marginTop: 4 },
  confirmButton: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default SelectSlotScreen;
