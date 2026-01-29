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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PackCard from '../components/PackCard';
import FloatingCartBar from '../components/FloatingCartBar';
import { TestimonialsMarquee } from '../components/TestimonialsMarquee';
import NotificationBell from '../components/NotificationBell';
import CartIcon from '../components/CartIcon';
import { OptimizedHorizontalList } from '../components/OptimizedHorizontalList';
import { useAuthStore } from '../store/authStore';
import { useCourseStore } from '../store/courseStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import { buildingApi, teacherApi, Teacher } from '../services/api.service';
import { Course, Building } from '../types';
import { getEnhancedShadow, GRID, RADIUS, DEVICE_TYPES } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, fetchMe } = useAuthStore();
  const { courses, fetchCourses, refreshCourses, isLoading } = useCourseStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [refreshing, setRefreshing] = useState(false);
  const [buildingCourses, setBuildingCourses] = useState<Course[]>([]);
  const [buildingCoursesLoading, setBuildingCoursesLoading] = useState(false);
  const [publicBuildings, setPublicBuildings] = useState<Building[]>([]);
  const [publicBuildingsLoading, setPublicBuildingsLoading] = useState(false);
  const [featuredTeachers, setFeaturedTeachers] = useState<Teacher[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const previousApprovalStatus = useRef(user?.approvalStatus);

  // User has building access if they have a buildingId AND are approved (ACTIVE status)
  const hasBuildingAccess = !!user?.buildingId && user?.approvalStatus === 'ACTIVE';
  // User is pending if they have a buildingId but status is PENDING_VERIFICATION
  const isPendingBuildingApproval = user?.approvalStatus === 'PENDING_VERIFICATION';
  
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

  // Auto-refresh user data when screen comes into focus (to check for approval status changes)
  useFocusEffect(
    useCallback(() => {
      const checkApprovalStatus = async () => {
        if (user?.id) {
          try {
            console.log('[HomeScreen] Checking approval status...');
            console.log('[HomeScreen] Current status:', user?.approvalStatus);
            
            const result = await fetchMe();
            
            console.log('[HomeScreen] New status:', result.user.approvalStatus);
            console.log('[HomeScreen] New buildingId:', result.user.buildingId);
            
            // Check if approval status changed from PENDING to ACTIVE
            if (previousApprovalStatus.current === 'PENDING_VERIFICATION' && 
                result.user.approvalStatus === 'ACTIVE') {
              Alert.alert(
                '🎉 Building Access Approved!',
                `You now have access to ${result.user.building?.name || 'your building'}. Explore the courses available!`,
                [{ text: 'Great!', style: 'default' }]
              );
              
              // Refresh building courses immediately after approval
              if (result.user.buildingId) {
                setBuildingCoursesLoading(true);
                try {
                  const response = await buildingApi.getMyBuildingWithCourses();
                  if (response.success && response.data?.courses) {
                    setBuildingCourses(response.data.courses);
                  }
                } catch (error) {
                  console.error('Error fetching building courses after approval:', error);
                }
                setBuildingCoursesLoading(false);
              }
            }
            previousApprovalStatus.current = result.user.approvalStatus;
          } catch (error) {
            console.log('[HomeScreen] Error refreshing user data:', error);
          }
        }
      };
      checkApprovalStatus();
    }, [user?.id, fetchMe])
  );

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

  // Fetch featured teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      setTeachersLoading(true);
      try {
        const response = await teacherApi.getFeaturedTeachers(10);
        if (response.success && response.data) {
          setFeaturedTeachers(response.data);
        }
      } catch (error: any) { 
        console.error('[HomeScreen] Error fetching teachers:', error?.message || error); 
      }
      setTeachersLoading(false);
    };
    fetchTeachers();
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
    
    // Refresh featured teachers
    try {
      const response = await teacherApi.getFeaturedTeachers(10);
      if (response.success && response.data) setFeaturedTeachers(response.data);
    } catch (error) { console.error('Error refreshing teachers:', error); }
    
    setRefreshing(false);
  }, [hasBuildingAccess, user?.buildingId]);

  const packs = courses;
  const featuredPacks = packs.slice(0, 4);
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
            <NotificationBell />
            <CartIcon />
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
              <Text style={styles.pendingBannerText}>
                {user?.building?.name 
                  ? `Your request to join ${user.building.name} is under review.`
                  : 'Your building access request is under verification.'}
              </Text>
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
                <OptimizedHorizontalList
                  data={buildingCourses.slice(0, 5)}
                  keyExtractor={(course) => course.id}
                  renderItem={({ item: course }) => (
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
                  )}
                  itemWidth={180}
                />
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
            <OptimizedHorizontalList
              data={publicBuildings.slice(0, 5)}
              keyExtractor={(building) => building.id}
              renderItem={({ item: building }) => (
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
              )}
              itemWidth={160}
            />
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
            <OptimizedHorizontalList
              data={featuredPacks}
              keyExtractor={(pack) => pack.id}
              renderItem={({ item: pack }) => <PackCard pack={pack} onPress={() => handlePackPress(pack.id)} />}
              itemWidth={180}
            />
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
          {teachersLoading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : featuredTeachers.length > 0 ? (
            <OptimizedHorizontalList
              data={featuredTeachers}
              keyExtractor={(teacher) => teacher.id}
              renderItem={({ item: t }) => (
                <TouchableOpacity 
                  key={t.id} 
                  style={styles.teacherCard}
                  onPress={() => navigation.navigate('TeacherDetail', { teacherId: t.id })}
                >
                  <Image source={{ uri: t.avatarUrl }} style={styles.teacherAvatar} />
                  <Text style={styles.teacherName} numberOfLines={1}>{t.name}</Text>
                  <View style={styles.teacherRating}><Ionicons name="star" size={12} color="#f59e0b" /><Text style={styles.teacherRatingText}>{t.rating.toFixed(1)}</Text></View>
                  <Text style={styles.teacherStudents}>{t.students.toLocaleString()} students</Text>
                </TouchableOpacity>
              )}
              itemWidth={140}
            />
          ) : (
            <View style={styles.emptyTeachers}>
              <Ionicons name="people-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTeachersText}>No teachers available yet</Text>
            </View>
          )}
        </View>

        {newPacks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>New Releases</Text><TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
            <OptimizedHorizontalList
              data={newPacks}
              keyExtractor={(pack) => pack.id}
              renderItem={({ item: pack }) => <PackCard pack={pack} onPress={() => handlePackPress(pack.id)} />}
              itemWidth={180}
            />
          </View>
        )}

        <TestimonialsMarquee />
        <View style={{ height: 40 }} />
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
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.card, 
    marginHorizontal: '4.3%', 
    marginBottom: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: RADIUS.md, 
    ...getEnhancedShadow('sm', isDark),
    // Enhanced border for light mode
    ...((!isDark) && {
      borderWidth: 1,
      borderColor: (theme as any).borderSubtle || theme.border,
    }),
  },
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
  noBuildingCard: { 
    marginHorizontal: '4.3%', 
    backgroundColor: theme.card, 
    borderRadius: RADIUS.lg, 
    padding: 24, 
    alignItems: 'center', 
    borderWidth: 2, 
    borderColor: (theme as any).borderStrong || theme.border, 
    borderStyle: 'dashed',
    ...getEnhancedShadow('sm', isDark),
  },
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
  emptyBuildingCourses: { 
    alignItems: 'center', 
    paddingVertical: 30, 
    paddingHorizontal: 20, 
    backgroundColor: theme.surfaceVariant, 
    marginHorizontal: '4.3%', 
    borderRadius: RADIUS.md,
    ...getEnhancedShadow('sm', isDark),
    // Enhanced border for light mode
    ...((!isDark) && {
      borderWidth: 1,
      borderColor: (theme as any).borderSubtle || theme.border,
    }),
  },
  emptyBuildingText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
  buildingCard: { 
    width: DEVICE_TYPES.isSmallPhone ? 140 : DEVICE_TYPES.isTablet ? 180 : 160,
    backgroundColor: theme.card, 
    borderRadius: RADIUS.lg, 
    padding: DEVICE_TYPES.isSmallPhone ? 12 : 16, 
    marginRight: 12,
    ...getEnhancedShadow('md', isDark),
    // Enhanced border for light mode
    ...((!isDark) && {
      borderWidth: 1,
      borderColor: (theme as any).cardBorder || theme.border,
    }),
  },
  buildingCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: DEVICE_TYPES.isSmallPhone ? 8 : 12 },
  buildingCardIcon: { width: DEVICE_TYPES.isSmallPhone ? 40 : 48, height: DEVICE_TYPES.isSmallPhone ? 40 : 48, borderRadius: 12, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center' },
  visibilityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
  publicBadge: { backgroundColor: isDark ? '#064e3b' : '#d1fae5' },
  privateBadge: { backgroundColor: isDark ? '#422006' : '#fef3c7' },
  visibilityText: { fontSize: DEVICE_TYPES.isSmallPhone ? 8 : 9, fontWeight: '600' },
  publicText: { color: '#10b981' },
  privateText: { color: '#f59e0b' },
  buildingCardName: { fontSize: DEVICE_TYPES.isSmallPhone ? 13 : 15, fontWeight: '700', color: theme.text, marginBottom: 4 },
  buildingCardLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  buildingCardCity: { fontSize: DEVICE_TYPES.isSmallPhone ? 11 : 12, color: theme.textSecondary, marginLeft: 4, flex: 1 },
  buildingCardStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  buildingCardCourses: { fontSize: DEVICE_TYPES.isSmallPhone ? 11 : 12, color: theme.primary, fontWeight: '500', marginLeft: 4 },
  emptyPublicBuildings: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20, 
    backgroundColor: theme.background, 
    marginHorizontal: '4.3%', 
    borderRadius: RADIUS.lg, 
    borderWidth: 1, 
    borderColor: (theme as any).borderStrong || theme.border, 
    borderStyle: 'dashed',
    ...getEnhancedShadow('sm', isDark),
  },
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
    borderRadius: RADIUS.md, 
    marginRight: '2%', 
    borderWidth: 1.5,
    ...getEnhancedShadow('sm', isDark),
    // Enhanced border for light mode
    ...((!isDark) && {
      borderColor: (theme as any).borderSubtle || theme.border,
    }),
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
  certGradient: { backgroundColor: '#7c3aed', padding: DEVICE_TYPES.isSmallPhone ? 16 : DEVICE_TYPES.isTablet ? 24 : 20 },
  certTopRow: { flexDirection: DEVICE_TYPES.isSmallPhone ? 'column' : 'row', justifyContent: 'space-between', alignItems: DEVICE_TYPES.isSmallPhone ? 'flex-start' : 'flex-start', marginBottom: DEVICE_TYPES.isSmallPhone ? 12 : 16 },
  certBadgeContainer: { position: 'relative', marginBottom: DEVICE_TYPES.isSmallPhone ? 12 : 0 },
  certBadge: { width: DEVICE_TYPES.isSmallPhone ? 48 : 56, height: DEVICE_TYPES.isSmallPhone ? 48 : 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  certVerifiedBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 10, padding: 2 },
  certStatsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: DEVICE_TYPES.isSmallPhone ? 8 : 12, paddingVertical: DEVICE_TYPES.isSmallPhone ? 6 : 8 },
  certStat: { alignItems: 'center', paddingHorizontal: DEVICE_TYPES.isSmallPhone ? 4 : 8 },
  certStatNumber: { fontSize: DEVICE_TYPES.isSmallPhone ? 14 : 16, fontWeight: '800', color: '#fff' },
  certStatLabel: { fontSize: DEVICE_TYPES.isSmallPhone ? 9 : 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  certStatDivider: { width: 1, height: DEVICE_TYPES.isSmallPhone ? 20 : 24, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: DEVICE_TYPES.isSmallPhone ? 2 : 4 },
  certTitle: { fontSize: DEVICE_TYPES.isSmallPhone ? 20 : DEVICE_TYPES.isTablet ? 28 : 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  certSubtitle: { fontSize: DEVICE_TYPES.isSmallPhone ? 12 : 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 12 },
  certDescription: { fontSize: DEVICE_TYPES.isSmallPhone ? 12 : 14, color: 'rgba(255,255,255,0.85)', lineHeight: DEVICE_TYPES.isSmallPhone ? 18 : 21, marginBottom: 16 },
  certFooter: { flexDirection: DEVICE_TYPES.isSmallPhone ? 'column' : 'row', justifyContent: 'space-between', alignItems: DEVICE_TYPES.isSmallPhone ? 'flex-start' : 'center', gap: DEVICE_TYPES.isSmallPhone ? 12 : 0 },
  certTags: { flexDirection: 'row', gap: DEVICE_TYPES.isSmallPhone ? 6 : 8, flexWrap: 'wrap' },
  certTag: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: DEVICE_TYPES.isSmallPhone ? 8 : 10, paddingVertical: DEVICE_TYPES.isSmallPhone ? 4 : 6, borderRadius: 20 },
  certTagText: { fontSize: DEVICE_TYPES.isSmallPhone ? 10 : 11, color: '#fff', fontWeight: '500' },
  learnMoreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: DEVICE_TYPES.isSmallPhone ? 12 : 14, paddingVertical: DEVICE_TYPES.isSmallPhone ? 6 : 8, borderRadius: 20, gap: 6 },
  learnMoreBtnText: { fontSize: DEVICE_TYPES.isSmallPhone ? 12 : 13, fontWeight: '600', color: '#fff' },
  teacherCard: { 
    width: 140,
    backgroundColor: theme.card, 
    borderRadius: RADIUS.md, 
    padding: 16, 
    marginRight: 12,
    alignItems: 'center', 
    ...getEnhancedShadow('sm', isDark),
    // Enhanced border for light mode
    ...((!isDark) && {
      borderWidth: 1,
      borderColor: (theme as any).borderSubtle || theme.border,
    }),
  },
  teacherAvatar: { width: DEVICE_TYPES.isSmallPhone ? 56 : 64, height: DEVICE_TYPES.isSmallPhone ? 56 : 64, borderRadius: DEVICE_TYPES.isSmallPhone ? 28 : 32, marginBottom: DEVICE_TYPES.isSmallPhone ? 8 : 12 },
  teacherName: { fontSize: DEVICE_TYPES.isSmallPhone ? 12 : 14, fontWeight: '600', color: theme.text, textAlign: 'center' },
  teacherRating: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  teacherRatingText: { fontSize: DEVICE_TYPES.isSmallPhone ? 11 : 12, color: theme.textSecondary, marginLeft: 4 },
  teacherStudents: { fontSize: DEVICE_TYPES.isSmallPhone ? 10 : 11, color: theme.textMuted, marginTop: 4 },
  emptyTeachers: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    paddingHorizontal: 20, 
    backgroundColor: theme.surfaceVariant, 
    marginHorizontal: '4.3%', 
    borderRadius: RADIUS.md,
    ...getEnhancedShadow('sm', isDark),
    // Enhanced border for light mode
    ...((!isDark) && {
      borderWidth: 1,
      borderColor: (theme as any).borderSubtle || theme.border,
    }),
  },
  emptyTeachersText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
});

export default HomeScreen;
