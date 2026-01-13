import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { paymentApi } from '../services/api.service';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import ProtectedScreen from '../components/ProtectedScreen';
import { Text, Card } from '../components/ui';
import { SPACING, COMPONENT_SIZES, RADIUS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  slotIds?: string[];
  initiatedAt: string;
  completedAt?: string;
  createdAt: string;
  razorpay?: {
    method?: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    email?: string;
    contact?: string;
    card?: {
      last4?: string;
      network?: string;
      type?: string;
    };
  };
  course?: {
    id: string;
    name: string;
    instrument?: string;
  };
}

const PaymentInvoicesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme);

  const fetchPayments = async () => {
    try {
      const response = await paymentApi.getPaymentHistory();
      if (response.success && response.data) {
        setPayments(response.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  }, []);

  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      setDownloadingId(paymentId);
      
      // Get the auth token
      const token = useAuthStore.getState().token;
      
      // Build the invoice URL with auth token
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      const invoiceUrl = `${baseUrl}/api/invoices/${paymentId}?token=${token}`;
      
      console.log('[Invoice] Opening PDF:', invoiceUrl);
      
      // Open in browser to view/download the PDF
      const canOpen = await Linking.canOpenURL(invoiceUrl);
      if (canOpen) {
        await Linking.openURL(invoiceUrl);
      } else {
        Alert.alert('Error', 'Cannot open invoice URL');
      }
    } catch (error) {
      console.error('Error opening invoice:', error);
      Alert.alert(
        'Error',
        'Unable to open the invoice. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'COMPLETED': return theme.success;
      case 'PENDING': return theme.warning;
      case 'FAILED': return theme.error;
      case 'REFUNDED': return theme.textSecondary;
      default: return theme.textMuted;
    }
  };

  const getStatusIcon = (status: Payment['status']): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'COMPLETED': return 'checkmark-circle';
      case 'PENDING': return 'time';
      case 'FAILED': return 'close-circle';
      case 'REFUNDED': return 'arrow-undo';
      default: return 'help-circle';
    }
  };

  const getPaymentMethodIcon = (method?: string): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case 'card': return 'card';
      case 'upi': return 'phone-portrait';
      case 'netbanking': return 'business';
      case 'wallet': return 'wallet';
      default: return 'cash';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentMethodLabel = (payment: Payment) => {
    if (!payment.razorpay) return 'Online Payment';
    
    const { method, bank, wallet, vpa, card } = payment.razorpay;
    
    if (method === 'card' && card) {
      return `${card.network || 'Card'} •••• ${card.last4 || '****'}`;
    }
    if (method === 'upi' && vpa) {
      return `UPI (${vpa})`;
    }
    if (method === 'netbanking' && bank) {
      return `Net Banking (${bank})`;
    }
    if (method === 'wallet' && wallet) {
      return `${wallet} Wallet`;
    }
    
    return method ? method.toUpperCase() : 'Online Payment';
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const methodIcon = getPaymentMethodIcon(item.razorpay?.method);
    const isDownloading = downloadingId === item.id;

    return (
      <Card style={styles.paymentCard} elevation="sm">
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Text variant="h4" style={{ color: theme.text }}>
              {formatAmount(item.amount, item.currency)}
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>
              {formatDate(item.completedAt || item.initiatedAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text variant="captionSmall" style={{ color: statusColor, marginLeft: 4, fontWeight: '600' }}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Course Info */}
        {item.course && (
          <View style={styles.courseInfo}>
            <Ionicons name="musical-notes" size={16} color={theme.primary} />
            <Text variant="body" style={{ color: theme.text, marginLeft: SPACING.xs, flex: 1 }}>
              {item.course.name}
            </Text>
          </View>
        )}

        <View style={styles.paymentDetails}>
          {/* Payment Method */}
          <View style={styles.detailRow}>
            <View style={styles.detailLabel}>
              <Ionicons name={methodIcon} size={14} color={theme.textMuted} />
              <Text variant="caption" style={{ color: theme.textMuted, marginLeft: SPACING.xxs }}>
                Payment Method
              </Text>
            </View>
            <Text variant="caption" style={{ color: theme.textSecondary, fontWeight: '500' }}>
              {getPaymentMethodLabel(item)}
            </Text>
          </View>

          {/* Transaction ID */}
          {item.gatewayPaymentId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="receipt-outline" size={14} color={theme.textMuted} />
                <Text variant="caption" style={{ color: theme.textMuted, marginLeft: SPACING.xxs }}>
                  Transaction ID
                </Text>
              </View>
              <Text variant="caption" style={{ color: theme.textSecondary }} numberOfLines={1}>
                {item.gatewayPaymentId.slice(0, 20)}...
              </Text>
            </View>
          )}

          {/* Order ID */}
          {item.gatewayOrderId && (
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Ionicons name="document-text-outline" size={14} color={theme.textMuted} />
                <Text variant="caption" style={{ color: theme.textMuted, marginLeft: SPACING.xxs }}>
                  Order ID
                </Text>
              </View>
              <Text variant="caption" style={{ color: theme.textSecondary }}>
                {item.gatewayOrderId}
              </Text>
            </View>
          )}
        </View>

        {/* Download Invoice Button - Only show for completed payments */}
        {item.status === 'COMPLETED' && (
          <TouchableOpacity
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={() => handleDownloadInvoice(item.id)}
            disabled={isDownloading}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="document-text-outline" size={18} color="#ffffff" />
            )}
            <Text variant="body" style={styles.downloadButtonText}>
              {isDownloading ? 'Opening...' : 'View Invoice'}
            </Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <ProtectedScreen>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text variant="body" style={{ color: theme.textSecondary, marginTop: SPACING.sm }}>
              Loading invoices...
            </Text>
          </View>
        </SafeAreaView>
      </ProtectedScreen>
    );
  }

  return (
    <ProtectedScreen>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={COMPONENT_SIZES.icon.md} color={theme.text} />
          </TouchableOpacity>
          <Text variant="h4" style={{ color: theme.text }}>Payment Invoices</Text>
          <View style={styles.backButton} />
        </View>

        {payments.length > 0 ? (
          <FlatList
            data={payments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={COMPONENT_SIZES.icon.xl} color={theme.textMuted} />
            <Text variant="h4" style={{ color: theme.text, marginTop: SPACING.md }}>
              No Invoices Yet
            </Text>
            <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.xs }}>
              Your payment history will appear here after you make a purchase.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: COMPONENT_SIZES.touchTarget.md,
    height: COMPONENT_SIZES.touchTarget.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: SPACING.screenPadding },
  paymentCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  paymentInfo: { flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.xs,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  downloadButtonDisabled: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default PaymentInvoicesScreen;
