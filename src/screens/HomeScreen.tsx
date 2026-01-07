import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { mockTeachers } from '../data/mockData';
import PackCard from '../components/PackCard';
import FloatingCartBar from '../components/FloatingCartBar';
import { TestimonialsMarquee } from '../components/TestimonialsMarquee';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import { buildingApi } from '../services/api.service';
import { Course, Building } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { courses, fetchCourses, refreshCourses, isLoading } = useCourseStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [refreshing, setRefreshing] = useState(false);
  const [buildingCourses, setBuildingCourses] = useState<Course[]>([]);
  const [buildingCoursesLoading, setBuildingCoursesLoading] = useState(false);
  const [publicBuildings, setPublicBuildings] = useState<Building[]>([]);
  const [publicBuildingsLoading, setPublicBuildingsLoading] = useState(false);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);

  // User has building access if they have a buildingId (from signup with PUBLIC building or admin approval)
  const hasBuildingAccess = !!user?.buildingId;
  const isPendingBuildingApproval = user?.approvalStatus === 'PENDING_VERIFICATION' && !user?.buildingId;
  
  // Debug logging
  useEffect(() => {
    console.log('[HomeScreen] User data:', {
      userId: user?.id,
      buildingId: user?.buildingId,
      building: user?.building,
      approvalStatus: user?.approvalStatus,
      hasBuildingAccess,
    });
  }, [user, hasBuildingAccess]);

  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch building courses if user has building access
  useEffect(() => {
    const fetchBuildingCourses = async () => {
      if (hasBuildingAccess && user?.buildingId) {
        setBuildingCoursesLoading(true);
        try {
          const response = await buildingApi.getMyBuildingWithCourses();
          if (response.success && response.data?.courses) setBuildingCourses(response.data.courses);
        } catch (error) { console.error('Error fetching building courses:', error); }
        setBuildingCoursesLoading(false);
      }
    };
    fetchBuildingCourses();
  }, [hasBuildingAccess, user?.buildingId]);

  // Fetch all public buildings
  useEffect(() => {
    const fetchPublicBuildings = async () => {
      setPublicBuildingsLoading(true);
      try {
        const response = await buildingApi.getPublicBuildings();
        if (response.success && response.data) setPublicBuildings(response.data);
      } catch (error: any) { console.error('[HomeScreen] Error fetching public buildings:', error?.message || error); }
      setPublicBuildingsLoading(false);
    };
    fetchPublicBuildings();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCourses();
    
    // Refresh building courses if user has building access
    if (hasBuildingAccess && user?.buildingId) {
      try {
        const response = await buildingApi.getMyBuildingWithCourses();
        if (response.success && response.data?.courses) setBuildingCourses(response.data.courses);
      } catch (error) { console.error('Error refreshing building courses:', error); }
    }
    
    // Refresh all public buildings
    try {
      const response = await buildingApi.getPublicBuildings();
      if (response.success && response.data) setPublicBuildings(response.data);
    } catch (error) { console.error('Error refreshing public buildings:', error); }
    
    setRefreshing(false);
  }, [hasBuildingAccess, user?.buildingId]);

  const packs = courses;
  const featuredPacks = packs.slice(0, 4);
  const trendingPacks = packs.slice(Math.min(2, packs.length), Math.min(6, packs.length));
  const newPacks = packs.slice(Math.min(4, packs.length), Math.min(8, packs.length));
  const handlePackPress = (packId: string) => navigation.navigate('PackDetail', { packId });

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
      setCartBarVisible(false);
    } else {
      setCartBarVisible(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const styles = createStyles(theme, isDark);

  const EmptyCoursesState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="musical-notes-outline" size={48} color={theme.textMuted} />
      <Text style={styles.emptyStateTitle}>No Courses Available</Text>
      <Text style={styles.emptyStateText}>New courses will appear here when added.</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={16} color={theme.primary} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'Music Lover'}! 👋</Text>
            <Text style={styles.subtitle}>What do you want to learn today?</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => Alert.alert('Coming Soon', 'Map feature is under development. Stay tuned!', [{ text: 'OK' }])}>
              <Ionicons name="map-outline" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <Text style={styles.searchText}>Search for lessons, teachers...</Text>
        </TouchableOpacity>

        <View style={styles.bannerWrapper}>
          <Image source={{ uri: 'https://picsum.photos/1200/500' }} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Feel The Music</Text>
            <Text style={styles.bannerSubtitle}>Learn. Create. Inspire.</Text>
          </View>
        </View>

        {isPendingBuildingApproval && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={24} color="#f59e0b" />
            <View style={styles.pendingBannerContent}>
              <Text style={styles.pendingBannerTitle}>Building Access Pending</Text>
              <Text style={styles.pendingBannerText}>Your building access is under verification.</Text>
            </View>
          </View>
        )}

        {/* My Building Section - Always visible */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.buildingTitleRow}>
              <Ionicons name="business" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}> My Building</Text>
            </View>
            {hasBuildingAccess && user?.building?.name && (
              <TouchableOpacity onPress={() => navigation.navigate('BuildingCourses', { buildingId: user.buildingId!, buildingName: user.building!.name })}>
                <Text style={styles.seeAll}>View all</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {hasBuildingAccess ? (
            <>
              {user?.building?.name && <Text style={styles.buildingNameLabel}>{user.building.name}, {user.building?.city}</Text>}
              {buildingCoursesLoading ? (
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
              ) : buildingCourses.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {buildingCourses.slice(0, 5).map((course) => (
                    <PackCard
                      key={course.id}
                      pack={{
                        id: course.id, title: course.title || 'Course', description: course.description || '',
                        price: course.pricePerSlot || course.price || 0,
                        thumbnailUrl: course.previewVideoUrl || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
                        category: (course.instrument === 'GUITAR' ? 'Guitar' : course.instrument === 'PIANO' ? 'Piano' : course.instrument === 'DRUMS' ? 'Drums' : course.instrument === 'VOCALS' ? 'Vocal Training' : 'Guitar') as any,
                        rating: 4.5, studentsCount: 0, tracksCount: 0, duration: course.durationMinutes || course.duration || 60, level: 'Beginner', createdAt: course.createdAt || '',
                        teacher: { id: 'default', name: user?.building?.name || 'Gretex', bio: '', avatarUrl: 'https://ui-avatars.com/api/?name=G&background=7c3aed&color=fff', rating: 4.5, students: 0 },
                      }}
                      onPress={() => handlePackPress(course.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyBuildingCourses}>
                  <Ionicons name="school-outline" size={32} color={theme.textMuted} />
                  <Text style={styles.emptyBuildingText}>No courses available for your building yet.</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noBuildingCard}>
              <View style={styles.noBuildingIcon}>
                <Ionicons name="home-outline" size={40} color={theme.primary} />
              </View>
              <Text style={styles.noBuildingTitle}>No Building Selected</Text>
              <Text style={styles.noBuildingText}>Select a building from nearby locations to access exclusive courses</Text>
              <TouchableOpacity style={styles.selectBuildingBtn} onPress={() => navigation.navigate('AllBuildings')}>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.selectBuildingBtnText}>Browse Buildings</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Browse Buildings - All Public Buildings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.buildingTitleRow}>
              <Ionicons name="globe-outline" size={20} color={theme.success} />
              <Text style={styles.sectionTitle}> Browse Buildings</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AllBuildings')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {publicBuildingsLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : publicBuildings.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {publicBuildings.slice(0, 5).map((building) => (
                <TouchableOpacity key={building.id} style={styles.buildingCard} onPress={() => navigation.navigate('BuildingCourses', { buildingId: building.id, buildingName: building.name })} activeOpacity={0.7}>
                  <View style={styles.buildingCardHeader}>
                    <View style={styles.buildingCardIcon}><Ionicons name="business" size={28} color={theme.primary} /></View>
                    <View style={[styles.visibilityBadge, building.visibilityType === 'PUBLIC' ? styles.publicBadge : styles.privateBadge]}>
                      <Ionicons name={building.visibilityType === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'} size={10} color={building.visibilityType === 'PUBLIC' ? '#10b981' : '#f59e0b'} />
                      <Text style={[styles.visibilityText, building.visibilityType === 'PUBLIC' ? styles.publicText : styles.privateText]}>
                        {building.visibilityType === 'PUBLIC' ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.buildingCardName} numberOfLines={1}>{building.name}</Text>
                  <View style={styles.buildingCardLocation}>
                    <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                    <Text style={styles.buildingCardCity} numberOfLines={1}>{building.city}</Text>
                  </View>
                  <View style={styles.buildingCardStats}>
                    <Ionicons name="school-outline" size={14} color={theme.primary} />
                    <Text style={styles.buildingCardCourses}>{building.courses?.length || 0} courses</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPublicBuildings}>
              <Ionicons name="business-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyPublicTitle}>No Public Buildings</Text>
              <Text style={styles.emptyPublicText}>Public buildings with courses will appear here.</Text>
            </View>
          )}
        </View>

        {/* Browse Section - Category Chips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.buildingTitleRow}>
              <Ionicons name="apps" size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}> Browse</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Browse' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.browseChipsScroll}>
            {[
              { name: 'All', icon: '🎵', color: theme.primary },
              { name: 'Guitar', icon: '🎸', color: '#ef4444' },
              { name: 'Piano', icon: '🎹', color: '#3b82f6' },
              { name: 'Drums', icon: '🥁', color: '#f59e0b' },
              { name: 'Vocal Training', icon: '🎤', color: '#10b981' },
            ].map((category) => (
              <TouchableOpacity 
                key={category.name} 
                style={[styles.browseChip, { borderColor: category.color }]}
                onPress={() => navigation.navigate('Browse' as any, { category: category.name })}
                activeOpacity={0.7}
              >
                <View style={[styles.browseChipIcon, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.browseChipEmoji}>{category.icon}</Text>
                </View>
                <Text style={styles.browseChipText}>{category.name}</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Lessons</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : featuredPacks.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featuredPacks.map((pack) => <PackCard key={pack.id} pack={pack} onPress={() => handlePackPress(pack.id)} />)}
            </ScrollView>
          ) : <EmptyCoursesState />}
        </View>

        {/* Trinity Certification Section - Premium Design */}
        <TouchableOpacity 
          style={styles.certificationSection} 
          onPress={() => navigation.navigate('TrinityInfo')}
          activeOpacity={0.9}
        >
          <View style={styles.certGradient}>
            <View style={styles.certTopRow}>
              <View style={styles.certBadgeContainer}>
                <View style={styles.certBadge}>
                  <Ionicons name="ribbon" size={28} color="#fff" />
                </View>
                <View style={styles.certVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                </View>
              </View>
              <View style={styles.certStatsRow}>
                <View style={styles.certStat}>
                  <Text style={styles.certStatNumber}>125+</Text>
                  <Text style={styles.certStatLabel}>Years</Text>
                </View>
                <View style={styles.certStatDivider} />
                <View style={styles.certStat}>
                  <Text style={styles.certStatNumber}>100K+</Text>
                  <Text style={styles.certStatLabel}>Students</Text>
                </View>
              </View>
            </View>
            <Text style={styles.certTitle}>Our Certifications</Text>
            <Text style={styles.certSubtitle}>Trinity College London</Text>
            <Text style={styles.certDescription}>
              Get globally recognized certifications from a premier international exam board, accredited by CBSE.
            </Text>
            <View style={styles.certFooter}>
              <View style={styles.certTags}>
                <View style={styles.certTag}><Text style={styles.certTagText}>🎵 Music</Text></View>
                <View style={styles.certTag}><Text style={styles.certTagText}>🎭 Drama</Text></View>
                <View style={styles.certTag}><Text style={styles.certTagText}>🌍 Global</Text></View>
              </View>
              <View style={styles.learnMoreBtn}>
                <Text style={styles.learnMoreBtnText}>Learn more</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Teachers</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {mockTeachers.map((t) => (
              <TouchableOpacity key={t.id} style={styles.teacherCard}>
                <Image source={{ uri: t.avatarUrl }} style={styles.teacherAvatar} />
                <Text style={styles.teacherName}>{t.name}</Text>
                <View style={styles.teacherRating}><Ionicons name="star" size={12} color="#f59e0b" /><Text style={styles.teacherRatingText}>{t.rating}</Text></View>
                <Text style={styles.teacherStudents}>{t.students.toLocaleString()} students</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {trendingPacks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Trending Now</Text><TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {trendingPacks.map((pack) => <PackCard key={pack.id} pack={pack} onPress={() => handlePackPress(pack.id)} />)}
            </ScrollView>
          </View>
        )}

        {newPacks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>New Releases</Text><TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {newPacks.map((pack) => <PackCard key={pack.id} pack={pack} onPress={() => handlePackPress(pack.id)} />)}
            </ScrollView>
          </View>
        )}

        <TestimonialsMarquee />
        <View style={{ height: 100 }} />
      </ScrollView>
      <FloatingCartBar visible={cartBarVisible} />
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  greeting: { fontSize: 24, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, marginHorizontal: 20, marginBottom: 20, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchText: { marginLeft: 10, fontSize: 14, color: theme.textMuted },
  pendingBanner: { flexDirection: 'row', backgroundColor: isDark ? '#422006' : '#fef3c7', marginHorizontal: 20, marginBottom: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#854d0e' : '#fcd34d' },
  pendingBannerContent: { flex: 1, marginLeft: 12 },
  pendingBannerTitle: { fontSize: 16, fontWeight: '600', color: isDark ? '#fbbf24' : '#92400e' },
  pendingBannerText: { fontSize: 13, color: isDark ? '#fcd34d' : '#a16207', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  buildingTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  buildingName: { fontSize: 13, color: theme.primary, fontWeight: '500' },
  buildingNameLabel: { fontSize: 14, color: theme.primary, fontWeight: '600', paddingHorizontal: 20, marginTop: -8, marginBottom: 12 },
  seeAll: { fontSize: 14, color: theme.primary, fontWeight: '600' },
  locationHint: { fontSize: 12, color: theme.success, paddingHorizontal: 20, marginTop: -8, marginBottom: 12 },
  locationError: { fontSize: 12, color: theme.warning || '#f59e0b', paddingHorizontal: 20, marginTop: -8, marginBottom: 12 },
  // No building card styles
  noBuildingCard: { marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed' },
  noBuildingIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  noBuildingTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8 },
  noBuildingText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  selectBuildingBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  selectBuildingBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  horizontalScroll: { paddingLeft: 20, paddingRight: 10 },
  loadingContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 16 },
  emptyStateText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.primaryLight },
  refreshButtonText: { marginLeft: 6, fontSize: 14, fontWeight: '600', color: theme.primary },
  emptyBuildingCourses: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: theme.surfaceVariant, marginHorizontal: 20, borderRadius: 12 },
  emptyBuildingText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
  buildingCard: { width: 160, backgroundColor: theme.card, borderRadius: 16, padding: 16, marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  buildingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  buildingCardIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  visibilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
  publicBadge: { backgroundColor: isDark ? '#064e3b' : '#d1fae5' },
  privateBadge: { backgroundColor: isDark ? '#422006' : '#fef3c7' },
  visibilityText: { fontSize: 9, fontWeight: '600' },
  publicText: { color: '#10b981' },
  privateText: { color: '#f59e0b' },
  buildingCardName: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  buildingCardLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  buildingCardCity: { fontSize: 12, color: theme.textSecondary, marginLeft: 4, flex: 1 },
  buildingCardStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  buildingCardCourses: { fontSize: 12, color: theme.primary, fontWeight: '500', marginLeft: 4 },
  emptyPublicBuildings: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20, backgroundColor: theme.background, marginHorizontal: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.border, borderStyle: 'dashed' },
  emptyPublicTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 16 },
  emptyPublicText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
  // Browse chips styles
  browseChipsScroll: { paddingLeft: 20, paddingRight: 10 },
  browseChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.card, 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    borderRadius: 12, 
    marginRight: 10, 
    borderWidth: 1.5,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2,
    gap: 8,
  },
  browseChipIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  browseChipEmoji: { fontSize: 16 },
  browseChipText: { fontSize: 14, fontWeight: '600', color: theme.text },
  bannerWrapper: { marginHorizontal: 0, marginBottom: 24, borderRadius: 2, overflow: 'hidden', height: 300 },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  bannerTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  bannerSubtitle: { fontSize: 16, color: '#fff', marginTop: 8, fontWeight: '500' },
  // Premium Certification Section
  certificationSection: { marginHorizontal: 20, marginBottom: 24, borderRadius: 20, overflow: 'hidden', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  certGradient: { backgroundColor: '#7c3aed', padding: 20 },
  certTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  certBadgeContainer: { position: 'relative' },
  certBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  certVerifiedBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 10, padding: 2 },
  certStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  certStat: { alignItems: 'center', paddingHorizontal: 8 },
  certStatNumber: { fontSize: 16, fontWeight: '800', color: '#fff' },
  certStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  certStatDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  certTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  certSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 12 },
  certDescription: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 21, marginBottom: 16 },
  certFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  certTags: { flexDirection: 'row', gap: 8 },
  certTag: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  certTagText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  learnMoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  learnMoreBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  teacherCard: { width: 140, backgroundColor: theme.card, borderRadius: 12, padding: 16, marginRight: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  teacherAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  teacherName: { fontSize: 14, fontWeight: '600', color: theme.text, textAlign: 'center' },
  teacherRating: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  teacherRatingText: { fontSize: 12, color: theme.textSecondary, marginLeft: 4 },
  teacherStudents: { fontSize: 11, color: theme.textMuted, marginTop: 4 },
});

export default HomeScreen;
