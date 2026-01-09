import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { buildingApi } from '../services/api.service';
import { Building } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Text, Card, Button, Spacer } from '../components/ui';
import { SPACING, COMPONENT_SIZES, RADIUS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface BuildingWithMeta extends Building {
  courseCount?: number;
  userCount?: number;
}

const AllBuildingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, fetchMe } = useAuthStore();
  const [buildings, setBuildings] = useState<BuildingWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingWithMeta | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [residenceData, setResidenceData] = useState({
    residenceAddress: '',
    residenceFlatNo: '',
    residenceFloor: '',
  });
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  const fetchBuildings = async () => {
    try {
      const response = await buildingApi.getAllBuildings();
      if (response.success && response.data) {
        setBuildings(response.data);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      // Fallback to public buildings if all buildings endpoint fails
      try {
        const publicResponse = await buildingApi.getPublicBuildings();
        if (publicResponse.success && publicResponse.data) {
          setBuildings(publicResponse.data);
        }
      } catch (e) {
        console.error('Error fetching public buildings:', e);
      }
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
    await fetchMe();
    setRefreshing(false);
  }, [fetchMe]);

  const handleBuildingPress = (building: BuildingWithMeta) => {
    // If public building, navigate to courses
    if (building.visibilityType === 'PUBLIC') {
      navigation.navigate('BuildingCourses', {
        buildingId: building.id,
        buildingName: building.name,
      });
      return;
    }

    // If user is already a member of this building
    if (user?.buildingId === building.id) {
      navigation.navigate('BuildingCourses', {
        buildingId: building.id,
        buildingName: building.name,
      });
      return;
    }

    // If private building and user is not a member, show request modal
    setSelectedBuilding(building);
    setResidenceData({ residenceAddress: '', residenceFlatNo: '', residenceFloor: '' });
    setRequestModalVisible(true);
  };

  const handleRequestAccess = async () => {
    if (!selectedBuilding) return;

    if (!residenceData.residenceAddress.trim()) {
      Alert.alert('Required', 'Please enter your residence address');
      return;
    }

    setSubmitting(true);
    try {
      const response = await buildingApi.requestBuildingAccess(
        selectedBuilding.id,
        undefined, // proofDocumentUrl - can be added later with image picker
        {
          residenceAddress: residenceData.residenceAddress,
          residenceFlatNo: residenceData.residenceFlatNo,
          residenceFloor: residenceData.residenceFloor,
        }
      );

      if (response.success) {
        Alert.alert(
          'Request Submitted',
          `Your access request for ${selectedBuilding.name} has been submitted. You will be notified once approved.`,
          [{ text: 'OK', onPress: () => setRequestModalVisible(false) }]
        );
        await fetchMe(); // Refresh user data
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getBuildingStatus = (building: BuildingWithMeta) => {
    if (building.visibilityType === 'PUBLIC') {
      return { label: 'Public', color: theme.success, icon: 'globe-outline' as const };
    }
    if (user?.buildingId === building.id) {
      return { label: 'Member', color: theme.primary, icon: 'checkmark-circle' as const };
    }
    if (user?.requestedBuildingId === building.id) {
      return { label: 'Pending', color: theme.warning, icon: 'time-outline' as const };
    }
    return { label: 'Private', color: theme.textMuted, icon: 'lock-closed-outline' as const };
  };

  const renderBuildingCard = ({ item: building }: { item: BuildingWithMeta }) => {
    const courseCount = building.courseCount || building.courses?.length || 0;
    const status = getBuildingStatus(building);

    return (
      <TouchableOpacity
        style={styles.buildingCard}
        onPress={() => handleBuildingPress(building)}
        activeOpacity={0.7}
      >
        <View style={styles.buildingIcon}>
          <Ionicons name="business" size={COMPONENT_SIZES.icon.lg} color={theme.primary} />
        </View>
        <View style={styles.buildingContent}>
          <View style={styles.nameRow}>
            <Text variant="label" style={{ color: theme.text, flex: 1 }} numberOfLines={1}>
              {building.name}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text variant="captionSmall" style={{ color: status.color, marginLeft: 4 }}>
                {status.label}
              </Text>
            </View>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text variant="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              {building.city}, {building.state}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="school-outline" size={14} color={theme.primary} />
              <Text variant="captionSmall" style={{ color: theme.primary, marginLeft: 4 }}>
                {courseCount} Course{courseCount !== 1 ? 's' : ''}
              </Text>
            </View>
            {building.musicRoomCount && (
              <View style={styles.statBadge}>
                <Ionicons name="musical-notes-outline" size={14} color={theme.success} />
                <Text variant="captionSmall" style={{ color: theme.success, marginLeft: 4 }}>
                  {building.musicRoomCount} Room{building.musicRoomCount !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" style={{ color: theme.textSecondary, marginTop: SPACING.sm }}>
            Loading buildings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={COMPONENT_SIZES.icon.md} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text variant="h4" style={{ color: theme.text }}>All Buildings</Text>
          <Text variant="caption" style={{ color: theme.textSecondary }}>
            {buildings.length} building{buildings.length !== 1 ? 's' : ''} available
          </Text>
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
          <Ionicons name="business-outline" size={COMPONENT_SIZES.icon.xl} color={theme.textMuted} />
          <Text variant="h4" style={{ color: theme.text, marginTop: SPACING.md }}>
            No Buildings Available
          </Text>
          <Text variant="body" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: SPACING.xs }}>
            Buildings with courses will appear here.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color={theme.primary} />
            <Text variant="label" style={{ color: theme.primary, marginLeft: SPACING.xs }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Request Access Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h4" style={{ color: theme.text }}>Request Access</Text>
              <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                <Ionicons name="close" size={COMPONENT_SIZES.icon.md} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedBuilding && (
                <Card style={styles.buildingPreview} elevation="sm">
                  <View style={styles.previewRow}>
                    <Ionicons name="business" size={COMPONENT_SIZES.icon.md} color={theme.primary} />
                    <View style={{ marginLeft: SPACING.sm, flex: 1 }}>
                      <Text variant="label" style={{ color: theme.text }}>{selectedBuilding.name}</Text>
                      <Text variant="caption" style={{ color: theme.textSecondary }}>
                        {selectedBuilding.city}, {selectedBuilding.state}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              <Text variant="body" style={{ color: theme.textSecondary, marginBottom: SPACING.md }}>
                This is a private building. Please provide your residence details for verification.
              </Text>

              <Text variant="caption" style={{ color: theme.textMuted, marginBottom: SPACING.xxs }}>
                Residence Address *
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full address"
                placeholderTextColor={theme.textMuted}
                value={residenceData.residenceAddress}
                onChangeText={(text) => setResidenceData(prev => ({ ...prev, residenceAddress: text }))}
                multiline
                numberOfLines={2}
              />

              <Spacer size="sm" />

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={{ color: theme.textMuted, marginBottom: SPACING.xxs }}>
                    Flat No.
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., A-101"
                    placeholderTextColor={theme.textMuted}
                    value={residenceData.residenceFlatNo}
                    onChangeText={(text) => setResidenceData(prev => ({ ...prev, residenceFlatNo: text }))}
                  />
                </View>
                <View style={{ width: SPACING.sm }} />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={{ color: theme.textMuted, marginBottom: SPACING.xxs }}>
                    Floor
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 3rd"
                    placeholderTextColor={theme.textMuted}
                    value={residenceData.residenceFloor}
                    onChangeText={(text) => setResidenceData(prev => ({ ...prev, residenceFloor: text }))}
                  />
                </View>
              </View>

              <Spacer size="lg" />

              <Button
                title={submitting ? 'Submitting...' : 'Submit Request'}
                onPress={handleRequestAccess}
                disabled={submitting}
                style={{ marginBottom: SPACING.md }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: COMPONENT_SIZES.touchTarget.md,
    height: COMPONENT_SIZES.touchTarget.md,
    borderRadius: COMPONENT_SIZES.touchTarget.md / 2,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: { flex: 1, marginLeft: SPACING.sm },
  buildingsList: { padding: SPACING.screenPadding },
  buildingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buildingIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildingContent: { flex: 1, marginLeft: SPACING.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xxs },
  statsRow: { flexDirection: 'row', marginTop: SPACING.xs, gap: SPACING.sm },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.xs,
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: theme.primaryLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.screenPadding,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buildingPreview: {
    marginBottom: SPACING.md,
    padding: SPACING.sm,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    backgroundColor: theme.surfaceVariant,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    fontSize: 14,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: COMPONENT_SIZES.input.height.md,
  },
  inputRow: { flexDirection: 'row' },
});

export default AllBuildingsScreen;
