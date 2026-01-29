import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { mockTracks } from '../data/mockData';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import { useCourseStore } from '../store/courseStore';
import { useThemeStore, getTheme, Theme } from '../store/themeStore';
import { requireAuth } from '../utils/auth';
import { getApiUrl } from '../config/api';
import { MusicPack } from '../types';
import BlinkitCartButton from '../components/BlinkitCartButton';

type PackDetailScreenRouteProp = RouteProp<RootStackParamList, 'PackDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PackDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PackDetailScreenRouteProp>();
  const { packId } = route.params;
  const { status } = useAuthStore();
  const { hasPack } = useLibraryStore();
  const { hasPurchased } = usePurchasedCoursesStore();
  const { getCourseById, fetchCourses } = useCourseStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);
  
  const [pack, setPack] = useState<MusicPack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video state
  const videoRef = useRef<Video>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPosition, setVideoPosition] = useState(0);

  // Extended course data from database
  const [courseData, setCourseData] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  useEffect(() => {
    const loadCourse = async () => {
      setIsLoading(true);
      try {
        // Fetch full course details from API
        const response = await fetch(getApiUrl(`api/courses/${packId}`));
        if (response.ok) {
          const data = await response.json();
          const dbCourse = data.data || data;
          if (dbCourse) {
            // Store raw database data
            setCourseData(dbCourse);
            setTimeSlots(dbCourse.timeSlots || []);
            
            // Map to MusicPack format for compatibility
            const course: MusicPack = {
              id: dbCourse.id,
              title: dbCourse.name || dbCourse.title || 'Untitled Course',
              description: dbCourse.description || '',
              teacher: dbCourse.teacher || {
                id: 'default',
                name: dbCourse.building?.name || 'Gretex Music',
                bio: 'Professional music instructor',
                avatarUrl: 'https://ui-avatars.com/api/?name=Gretex&background=7c3aed&color=fff',
                rating: 4.8,
                students: 1000,
              },
              price: dbCourse.pricePerSlot || dbCourse.price || 0,
              thumbnailUrl: dbCourse.thumbnailUrl || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
              videoUrl: dbCourse.videoUrl || dbCourse.previewVideoUrl || null,
              category: dbCourse.instrument || dbCourse.category || 'Guitar',
              rating: dbCourse.rating || 4.5,
              studentsCount: dbCourse.studentsCount || 0,
              tracksCount: dbCourse.tracksCount || 0,
              duration: dbCourse.durationMinutes || dbCourse.duration || 60,
              level: dbCourse.level || 'Beginner',
              createdAt: dbCourse.createdAt || new Date().toISOString(),
            };
            setPack(course);
          }
        } else {
          // Fallback to store
          let course = getCourseById(packId);
          if (!course) {
            await fetchCourses();
            course = getCourseById(packId);
          }
          setPack(course || null);
        }
      } catch (error) {
        console.warn('[PackDetail] Failed to fetch:', error);
        // Fallback to store
        let course = getCourseById(packId);
        if (!course) {
          await fetchCourses();
          course = getCourseById(packId);
        }
        setPack(course || null);
      }
      setIsLoading(false);
    };
    loadCourse();
  }, [packId]);

  const tracks = mockTracks[packId] || [];
  const isPurchased = hasPurchased(packId) || hasPack(packId);

  // Check if course has ended
  const courseEndDate = courseData?.endDate ? new Date(courseData.endDate) : null;
  const isCourseEnded = courseEndDate && new Date() > courseEndDate;
  
  // Show purchase button only if:
  // 1. Not purchased yet, OR
  // 2. Purchased but course hasn't ended yet
  const canPurchase = !isPurchased || (isPurchased && !isCourseEnded);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
  };

  const handleSkipForward = async () => {
    if (videoRef.current) await videoRef.current.setPositionAsync(Math.min(videoPosition + 10000, videoDuration));
  };

  const handleSkipBackward = async () => {
    if (videoRef.current) await videoRef.current.setPositionAsync(Math.max(videoPosition - 10000, 0));
  };

  const handleFullscreen = async () => {
    if (videoRef.current) await videoRef.current.presentFullscreenPlayer();
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoPlaying(status.isPlaying);
      setVideoDuration(status.durationMillis || 0);
      setVideoPosition(status.positionMillis || 0);
    }
  };

  const formatTime = (millis: number) => {
    const s = Math.floor(millis / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  if (isLoading) return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  if (!pack) return <View style={[styles.container, styles.centered]}><Ionicons name="alert-circle-outline" size={64} color={theme.textMuted} /><Text style={styles.notFoundText}>Course not found</Text></View>;

  const handleBuyNow = () => {
    if (isPurchased) {
      Alert.alert('Already Purchased', 'You have already purchased this course. Access it from your library.');
      return;
    }
    requireAuth(status, navigation, () => navigation.navigate('Checkout', { pack }), 'Please login to purchase', { name: 'Checkout', params: { pack } });
  };

  const handleTrackPress = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;
    if (track.isPreview || isPurchased) navigation.navigate('TrackPlayer', { packId, trackId });
    else requireAuth(status, navigation, () => Alert.alert('Premium Content', 'Purchase to access', [{ text: 'Cancel', style: 'cancel' }, { text: 'Buy Now', onPress: handleBuyNow }]), 'Please login');
  };

  // Course includes data - from database
  const maxStudents = courseData?.maxStudentsPerSlot || 35;
  const durationMins = courseData?.durationMinutes || pack.duration || 60;
  const totalSessions = timeSlots.length || 12;
  
  const courseIncludes = [
    { icon: 'videocam-outline', text: `${Math.ceil((totalSessions * durationMins) / 60)} hours total sessions`, color: '#a78bfa' },
    { icon: 'calendar-outline', text: `${totalSessions} scheduled classes`, color: '#34d399' },
    { icon: 'tv-outline', text: `${durationMins} min per session`, color: '#a78bfa' },
    { icon: 'phone-portrait-outline', text: 'Access on mobile and desktop', color: '#34d399' },
    { icon: 'people-outline', text: `Max ${maxStudents} students per class`, color: '#a78bfa' },
    { icon: 'ribbon-outline', text: 'Certificate of completion', color: '#34d399' },
  ];

  // Weekly schedule days - from database daysOfWeek array
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const scheduleDays = courseData?.daysOfWeek?.length > 0 
    ? courseData.daysOfWeek.map((d: number) => dayNames[d])
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Course time from database
  const courseStartTime = courseData?.defaultStartTime || '09:00';
  const courseEndTime = courseData?.defaultEndTime || '10:00';

  // Generate sessions from database timeSlots or create from course dates
  const generateSessions = () => {
    // If we have actual timeSlots from database, use them
    if (timeSlots.length > 0) {
      return timeSlots.map((slot: any, index: number) => {
        const slotDate = new Date(slot.slotDate || slot.startTime);
        const startTime = slot.startTime ? new Date(slot.startTime) : null;
        const spotsLeft = (slot.maxCapacity || maxStudents) - (slot.currentEnrollment || 0);
        
        return {
          id: slot.id,
          number: index + 1,
          day: slotDate.toLocaleDateString('en-US', { weekday: 'long' }),
          date: slotDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          time: startTime 
            ? startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : courseStartTime,
          spots: spotsLeft,
          status: slot.status,
        };
      });
    }
    
    // Fallback: generate from course start/end dates
    const sessions = [];
    const startDate = courseData?.startDate ? new Date(courseData.startDate) : new Date();
    const endDate = courseData?.endDate ? new Date(courseData.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const daysOfWeek = courseData?.daysOfWeek || [1, 2, 3, 4, 5];
    
    let sessionNum = 1;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate && sessionNum <= 20) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        sessions.push({
          id: `session-${sessionNum}`,
          number: sessionNum,
          day: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          date: currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          time: courseStartTime,
          spots: maxStudents,
        });
        sessionNum++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return sessions;
  };

  const sessions = generateSessions();

  // What you'll learn
  const learningPoints = [
    `Master the fundamentals of ${pack.category}`,
    'Build a strong foundation with proper techniques',
    'Learn to read and understand music notation',
    'Develop your ear training and rhythm skills',
  ];

  // Prerequisites
  const prerequisites = [
    'No prior experience required',
    `Access to a ${pack.category.toLowerCase()} instrument`,
    'Dedication to practice regularly',
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Video Header */}
        <View style={styles.videoHeader}>
          {pack.videoUrl && !videoError ? (
            <>
              <Video ref={videoRef} source={{ uri: pack.videoUrl }} style={styles.video} resizeMode={ResizeMode.COVER} shouldPlay={false} isLooping onPlaybackStatusUpdate={onPlaybackStatusUpdate} onError={() => setVideoError(true)} />
              <TouchableOpacity style={styles.videoOverlay} onPress={() => setShowControls(!showControls)} activeOpacity={1}>
                {showControls && (
                  <>
                    <View style={styles.videoControls}>
                      <TouchableOpacity style={styles.skipBtn} onPress={handleSkipBackward}><Ionicons name="play-back" size={22} color="#fff" /><Text style={styles.skipText}>10</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause}><Ionicons name={isVideoPlaying ? "pause" : "play"} size={32} color="#fff" /></TouchableOpacity>
                      <TouchableOpacity style={styles.skipBtn} onPress={handleSkipForward}><Ionicons name="play-forward" size={22} color="#fff" /><Text style={styles.skipText}>10</Text></TouchableOpacity>
                    </View>
                    <View style={styles.videoBottomBar}>
                      <Text style={styles.timeText}>{formatTime(videoPosition)} / {formatTime(videoDuration)}</Text>
                      <TouchableOpacity style={styles.fullscreenBtn} onPress={handleFullscreen}><Ionicons name="expand" size={18} color="#fff" /></TouchableOpacity>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Image source={{ uri: pack.thumbnailUrl }} style={styles.courseImage} />
          )}
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.courseTitle}>{pack.title}</Text>
        </View>

        {/* Price + Buttons */}
        <View style={styles.priceSection}>
          <Text style={styles.priceAmount}>₹{pack.price.toLocaleString()}</Text>
          {isPurchased ? (
            <View style={styles.courseEndedContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.courseEndedText}>Already purchased</Text>
            </View>
          ) : (
            <View style={styles.priceButtons}>
              <BlinkitCartButton pack={pack} size="large" style={styles.cartBtn} />
              <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow}>
                <Text style={styles.buyNowText}>Buy now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* What you'll learn */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you'll learn</Text>
          <View style={styles.underline} />
          <View style={styles.learnBox}>
            {learningPoints.map((point, i) => (
              <View key={i} style={styles.learnItem}>
                <Ionicons name="checkmark" size={18} color="#34d399" />
                <Text style={styles.learnText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.underline} />
          <Text style={styles.descText}>{pack.description || `This comprehensive ${pack.category.toLowerCase()} course is designed for students of all levels. Whether you're a complete beginner or looking to refine your skills, this course provides structured lessons that will help you achieve your musical goals.`}</Text>
        </View>

        {/* This course includes - Grid Layout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This course includes:</Text>
          <View style={styles.underline} />
          <View style={styles.includesGrid}>
            {courseIncludes.map((item, i) => (
              <View key={i} style={styles.includeCard}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                <Text style={styles.includeText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          <View style={styles.underline} />
          <View style={styles.daysRow}>
            {scheduleDays.map((day: string) => (
              <View key={day} style={styles.dayChip}>
                <Text style={styles.dayChipText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.scheduleTime}>
            <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <Text style={styles.scheduleTimeText}>Classes run from {courseStartTime} to {courseEndTime}</Text>
          </View>
        </View>

        {/* Prerequisites */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prerequisites</Text>
          <View style={styles.underline} />
          {prerequisites.map((req, i) => (
            <View key={i} style={styles.prereqItem}>
              <View style={styles.bullet} />
              <Text style={styles.prereqText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Course Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Sessions ({sessions.length})</Text>
          <View style={styles.underline} />
          {sessions.slice(0, 8).map((session: any) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionNumber}>
                <Text style={styles.sessionNumberText}>#{session.number}</Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDate}>{session.date}</Text>
                <Text style={styles.sessionTime}>{session.time}</Text>
              </View>
              <View style={[styles.spotsBadge, session.spots <= 0 && styles.spotsBadgeFull]}>
                <Text style={[styles.spotsText, session.spots <= 0 && styles.spotsTextFull]}>
                  {session.spots > 0 ? `${session.spots} spots` : 'Full'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Instructor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructor</Text>
          <View style={styles.underline} />
          <View style={styles.instructorCard}>
            <Image source={{ uri: pack.teacher.avatarUrl }} style={styles.instructorAvatar} />
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>{pack.teacher.name}</Text>
              <Text style={styles.instructorBio}>{pack.teacher.bio || 'Professional music instructor'}</Text>
              <View style={styles.instructorStats}>
                <View style={styles.instStat}>
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text style={styles.instStatText}>{pack.teacher.rating} Rating</Text>
                </View>
                <View style={styles.instStat}>
                  <Ionicons name="people" size={14} color={theme.textSecondary} />
                  <Text style={styles.instStatText}>{pack.teacher.students?.toLocaleString() || 0} Students</Text>
                </View>
                {(pack.teacher as any).yearsOfExperience && (
                  <View style={styles.instStat}>
                    <Ionicons name="time" size={14} color={theme.textSecondary} />
                    <Text style={styles.instStatText}>{(pack.teacher as any).yearsOfExperience} Years</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      {!isPurchased ? (
        <View style={styles.bottomBar}>
          <Text style={styles.bottomPrice}>₹{pack.price.toLocaleString()}</Text>
          <TouchableOpacity style={styles.bottomBuyBtn} onPress={handleBuyNow}><Text style={styles.bottomBuyText}>Buy now</Text></TouchableOpacity>
        </View>
      ) : isCourseEnded ? (
        <View style={styles.bottomBarCompleted}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.completedText}>Course completed</Text>
        </View>
      ) : (
        <View style={styles.bottomBarOwned}><Ionicons name="checkmark-circle" size={24} color="#10b981" /><Text style={styles.ownedText}>You own this course</Text></View>
      )}
    </View>
  );
};


const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: theme.textMuted,
    fontSize: 16,
    marginTop: 12,
  },
  videoHeader: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  courseImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {
    alignItems: 'center',
  },
  skipText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  videoBottomBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
  },
  fullscreenBtn: {
    padding: 4,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  courseTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    lineHeight: 28,
  },
  priceSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
  },
  priceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cartBtn: {
    flex: 1,
  },
  buyNowBtn: {
    flex: 1,
    height: 58,
    backgroundColor: theme.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyNowText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  courseEndedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#d1fae5',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  courseEndedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  underline: {
    width: 40,
    height: 3,
    backgroundColor: theme.primary,
    borderRadius: 2,
    marginBottom: 16,
  },
  learnBox: {
    backgroundColor: isDark ? theme.surface : '#f8f5ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? theme.border : '#e9e3ff',
  },
  learnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  learnText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  descText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 22,
  },
  includesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  includeCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  includeText: {
    flex: 1,
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 16,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#34d399',
    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(52, 211, 153, 0.08)',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34d399',
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleTimeText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  prereqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
  prereqText: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sessionNumber: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: isDark ? theme.primaryLight : '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  spotsBadge: {
    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  spotsBadgeFull: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
  },
  spotsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  spotsTextFull: {
    color: '#ef4444',
  },
  instructorCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  instructorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  instructorBio: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  instructorStats: {
    flexDirection: 'row',
    gap: 16,
  },
  instStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instStatText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: 24,
  },
  bottomPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.text,
  },
  bottomBuyBtn: {
    backgroundColor: theme.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  bottomBuyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomBarOwned: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: 28,
  },
  ownedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  bottomBarCompleted: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: 28,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
});

export default PackDetailScreen;
