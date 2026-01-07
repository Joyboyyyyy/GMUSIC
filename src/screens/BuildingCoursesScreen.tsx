import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { buildingApi } from '../services/api.service';
import { Building, Course } from '../types';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'BuildingCourses'>;

const BuildingCoursesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { buildingId, buildingName } = route.params;

  const [building, setBuilding] = useState<Building | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  const fetchBuildingCourses = async () => {
    try {
      const response = await buildingApi.getBuildingById(buildingId);
      if (response.success && response.data) {
        setBuilding(response.data);
        setCourses(response.data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching building courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildingCourses();
  }, [buildingId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBuildingCourses();
    setRefreshing(false);
  }, [buildingId]);

  const handleCoursePress = (courseId: string) => {
    navigation.navigate('PackDetail', { packId: courseId });
  };


  const getInstrumentIcon = (instrument: string) => {
    switch (instrument) {
      case 'GUITAR': return '🎸';
      case 'PIANO': return '🎹';
      case 'DRUMS': return '🥁';
      case 'VOCALS': return '🎤';
      case 'VIOLIN': return '🎻';
      default: return '🎵';
    }
  };

  const renderCourseCard = ({ item: course }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCoursePress(course.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: course.previewVideoUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400' }}
        style={styles.courseImage}
      />
      <View style={styles.courseContent}>
        <View style={styles.courseHeader}>
          <Text style={styles.instrumentBadge}>{getInstrumentIcon(course.instrument || '')}</Text>
          <Text style={styles.instrumentText}>{course.instrument || 'Music'}</Text>
        </View>
        <Text style={styles.courseTitle} numberOfLines={2}>{course.title || 'Course'}</Text>
        <Text style={styles.courseDescription} numberOfLines={2}>{course.description || 'Learn music with expert guidance'}</Text>
        <View style={styles.courseFooter}>
          <View style={styles.courseMeta}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.courseMetaText}>{course.durationMinutes || 60} min</Text>
          </View>
          <Text style={styles.coursePrice}>₹{course.pricePerSlot || course.price || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
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
          <Text style={styles.headerTitle} numberOfLines={1}>{buildingName}</Text>
          <Text style={styles.headerSubtitle}>{courses.length} course{courses.length !== 1 ? 's' : ''} available</Text>
        </View>
      </View>

      {building && (
        <View style={styles.buildingInfo}>
          <View style={styles.buildingIcon}>
            <Ionicons name="business" size={32} color={theme.primary} />
          </View>
          <View style={styles.buildingDetails}>
            <Text style={styles.buildingName}>{building.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <Text style={styles.buildingLocation}>{building.city}, {building.state}</Text>
            </View>
            {building.musicRoomCount && (
              <View style={styles.roomsRow}>
                <Ionicons name="musical-notes-outline" size={14} color={theme.primary} />
                <Text style={styles.roomsText}>{building.musicRoomCount} Music Room{building.musicRoomCount !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      )}


      {courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No Courses Yet</Text>
          <Text style={styles.emptyText}>This building doesn't have any courses available at the moment.</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  headerSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  buildingInfo: { flexDirection: 'row', backgroundColor: theme.surface, marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.05, shadowRadius: 8, elevation: 2 },
  buildingIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  buildingDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  buildingName: { fontSize: 18, fontWeight: '700', color: theme.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  buildingLocation: { fontSize: 13, color: theme.textSecondary, marginLeft: 4 },
  roomsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  roomsText: { fontSize: 13, color: theme.primary, marginLeft: 4, fontWeight: '500' },
  coursesList: { padding: 16 },
  courseCard: { backgroundColor: theme.surface, borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 8, elevation: 3 },
  courseImage: { width: '100%', height: 160, backgroundColor: theme.surfaceVariant },
  courseContent: { padding: 16 },
  courseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  instrumentBadge: { fontSize: 20 },
  instrumentText: { fontSize: 12, color: theme.primary, fontWeight: '600', marginLeft: 6, textTransform: 'uppercase' },
  courseTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 4 },
  courseDescription: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginBottom: 12 },
  courseFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border },
  courseMeta: { flexDirection: 'row', alignItems: 'center' },
  courseMetaText: { fontSize: 13, color: theme.textSecondary, marginLeft: 4 },
  coursePrice: { fontSize: 18, fontWeight: '700', color: theme.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.primaryLight },
  refreshButtonText: { marginLeft: 8, fontSize: 15, fontWeight: '600', color: theme.primary },
});

export default BuildingCoursesScreen;
