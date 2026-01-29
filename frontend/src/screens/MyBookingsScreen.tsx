import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { SPACING, RADIUS, COMPONENT_SIZES } from '../theme/designSystem';
import api from '../utils/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Booking {
  id: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  buildingName: string;
  buildingAddress: string;
  roomName?: string;
  paymentId: string;
  invoiceUrl?: string;
  createdAt: string;
}

const MyBookingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/bookings/my-jamming-rooms', {
        params: { status: filter === 'all' ? undefined : filter },
      });
      
      if (response.data.success) {
        setBookings(response.data.data || []);
      }
    } catch (error: any) {
      console.log('[MyBookings] API not available, using mock data');
      // Use mock data when API is not available
      setBookings([
        {
          id: '1',
          date: '2026-01-25',
          time: '10:00 AM',
          duration: 60,
          price: 500,
          status: 'upcoming',
          buildingName: 'Harmony Heights',
          buildingAddress: '123 Music Street, Mumbai',
          roomName: 'Studio A',
          paymentId: 'pay_123',
          createdAt: '2026-01-20T10:00:00Z',
        },
        {
          id: '2',
          date: '2026-01-18',
          time: '02:00 PM',
          duration: 60,
          price: 500,
          status: 'completed',
          buildingName: 'Melody Manor',
          buildingAddress: '456 Rhythm Road, Mumbai',
          roomName: 'Studio B',
          paymentId: 'pay_456',
          createdAt: '2026-01-15T14:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleViewInvoice = (booking: Booking) => {
    // TODO: Implement invoice viewing when backend is ready
    Alert.alert('Coming Soon', 'Invoice viewing will be available soon.');
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/bookings/${bookingId}/cancel`);
              Alert.alert('Success', 'Booking cancelled successfully');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return theme.primary;
      case 'completed': return theme.success;
      case 'cancelled': return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return 'time-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={COMPONENT_SIZES.icon.md} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.backButton} />
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'upcoming', 'completed', 'cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab as any)}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={COMPONENT_SIZES.icon.xl} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? "You haven't made any jamming room bookings yet."
              : `No ${filter} bookings found.`}
          </Text>
          <TouchableOpacity 
            style={styles.bookNowButton} 
            onPress={() => navigation.navigate('Main', { screen: 'BookRoom' })}
          >
            <Text style={styles.bookNowText}>Book a Room</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
        >
          {filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                <Ionicons 
                  name={getStatusIcon(booking.status) as any} 
                  size={16} 
                  color={getStatusColor(booking.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Text>
              </View>

              {/* Booking Details */}
              <View style={styles.bookingHeader}>
                <View style={styles.buildingIcon}>
                  <Ionicons name="business" size={COMPONENT_SIZES.icon.md} color={theme.primary} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.buildingName}>{booking.buildingName}</Text>
                  {booking.roomName && (
                    <Text style={styles.roomName}>{booking.roomName}</Text>
                  )}
                  <Text style={styles.buildingAddress} numberOfLines={1}>
                    {booking.buildingAddress}
                  </Text>
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                  <Text style={styles.detailText}>{formatDate(booking.date)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                  <Text style={styles.detailText}>{booking.time}</Text>
                </View>
              </View>

              {/* Duration & Price */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="hourglass-outline" size={18} color={theme.textSecondary} />
                  <Text style={styles.detailText}>{booking.duration} mins</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="cash-outline" size={18} color={theme.textSecondary} />
                  <Text style={styles.priceText}>₹{booking.price}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleViewInvoice(booking)}
                >
                  <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                  <Text style={styles.actionText}>View Invoice</Text>
                </TouchableOpacity>

                {booking.status === 'upcoming' && (
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelBooking(booking.id)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={theme.error} />
                    <Text style={[styles.actionText, { color: theme.error }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
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
  filterContainer: { 
    paddingHorizontal: SPACING.screenPadding, 
    paddingVertical: SPACING.md, 
    gap: SPACING.sm 
  },
  filterTab: { 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.full, 
    backgroundColor: theme.card, 
    borderWidth: 1, 
    borderColor: theme.border 
  },
  filterTabActive: { 
    backgroundColor: theme.primary, 
    borderColor: theme.primary 
  },
  filterText: { fontSize: 14, fontWeight: '600', color: theme.textSecondary },
  filterTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  loadingText: { marginTop: SPACING.md, fontSize: 14, color: theme.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: SPACING.md, marginBottom: SPACING.xs },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: SPACING.lg },
  bookNowButton: { 
    backgroundColor: theme.primary, 
    paddingHorizontal: SPACING.xl, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md 
  },
  bookNowText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  listContainer: { padding: SPACING.screenPadding, gap: SPACING.md },
  bookingCard: { 
    backgroundColor: theme.card, 
    borderRadius: RADIUS.md, 
    padding: SPACING.md, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start', 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xxs, 
    borderRadius: RADIUS.sm, 
    marginBottom: SPACING.sm, 
    gap: SPACING.xxs 
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  bookingHeader: { flexDirection: 'row', marginBottom: SPACING.md },
  buildingIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: RADIUS.sm, 
    backgroundColor: theme.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.sm 
  },
  bookingInfo: { flex: 1 },
  buildingName: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: SPACING.xxs },
  roomName: { fontSize: 13, fontWeight: '600', color: theme.primary, marginBottom: SPACING.xxs },
  buildingAddress: { fontSize: 12, color: theme.textSecondary },
  detailsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.sm 
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  detailText: { fontSize: 13, color: theme.textSecondary },
  priceText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  actionsRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginTop: SPACING.sm, 
    paddingTop: SPACING.sm, 
    borderTopWidth: 1, 
    borderTopColor: theme.border 
  },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.sm, 
    backgroundColor: theme.primaryLight, 
    gap: SPACING.xxs 
  },
  cancelButton: { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2' },
  actionText: { fontSize: 13, fontWeight: '600', color: theme.primary },
});

export default MyBookingsScreen;