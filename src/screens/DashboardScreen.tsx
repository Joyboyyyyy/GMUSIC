import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { useTipsStore } from '../store/tipsStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import { mockPacks } from '../data/mockData';
import PackCard from '../components/PackCard';
import ProtectedScreen from '../components/ProtectedScreen';
import ActivityChart from '../components/ActivityChart';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { purchasedPacks } = useLibraryStore();
  const { purchasedCourseIds } = usePurchasedCoursesStore();
  const { currentTip, loadDailyTip, getNewTip } = useTipsStore();

  useEffect(() => {
    loadDailyTip();
  }, []);

  // Get purchased courses from mockPacks based on purchasedCourseIds
  const myPurchasedCourses = mockPacks.filter((pack) =>
    purchasedCourseIds.includes(pack.id)
  );

  // Extract unique mentors from purchased courses
  const uniqueMentors = Array.from(
    new Map(
      myPurchasedCourses.map((course) => [course.teacher.id, course.teacher])
    ).values()
  );

  const recommendedPacks = mockPacks.slice(0, 5);

  // Use purchased courses for continue learning, fallback to library store
  const continueLearningPack =
    myPurchasedCourses.length > 0
      ? myPurchasedCourses[0]
      : purchasedPacks.length > 0
      ? purchasedPacks[0]
      : null;

  const progressPercentage = 35;

  const weeklyStats = {
    lessonsCompleted: 8,
    minutesPracticed: 245,
    currentStreak: 5,
  };

  const handlePackPress = (packId: string) => {
    navigation.navigate('PackDetail', { packId });
  };

  return (
    <ProtectedScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Hello, {user?.name || 'Student'}! 👋
              </Text>
              <Text style={styles.subtitle}>Ready to learn today?</Text>
            </View>
          </View>

          {/* Book a Room Shortcut */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.bookRoomCard}
              onPress={() => navigation.navigate('Main', { screen: 'BookRoom' })}
            >
              <View style={styles.bookRoomContent}>
                <View style={styles.bookRoomIcon}>
                  <Ionicons name="calendar-outline" size={32} color="#7c3aed" />
                </View>
                <View style={styles.bookRoomText}>
                  <Text style={styles.bookRoomTitle}>Book a Room</Text>
                  <Text style={styles.bookRoomSubtitle}>
                    Reserve a practice room for your sessions
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Performance Stats – moved ABOVE recommended */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Stats</Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </View>
                <Text style={styles.statValue}>{weeklyStats.lessonsCompleted}</Text>
                <Text style={styles.statLabel}>Lessons Completed</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#f59e0b' }]}>
                  <Ionicons name="time" size={24} color="#fff" />
                </View>
                <Text style={styles.statValue}>{weeklyStats.minutesPracticed}</Text>
                <Text style={styles.statLabel}>Minutes Practiced</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
                <View style={[styles.statIcon, { backgroundColor: '#ef4444' }]}>
                  <Ionicons name="flame" size={24} color="#fff" />
                </View>
                <Text style={styles.statValue}>{weeklyStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
          </View>

          {/* Activity This Week */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity This Week</Text>
            <ActivityChart />
          </View>

          {/* Continue Learning */}
          {continueLearningPack && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              <TouchableOpacity
                style={styles.continueCard}
                onPress={() => handlePackPress(continueLearningPack.id)}
              >
                <Image
                  source={{ uri: continueLearningPack.thumbnailUrl }}
                  style={styles.continueImage}
                />
                <View style={styles.continueContent}>
                  <Text style={styles.continueTitle} numberOfLines={1}>
                    {continueLearningPack.title}
                  </Text>
                  <Text style={styles.continueTeacher}>
                    {continueLearningPack.teacher.name}
                  </Text>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progressPercentage}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {progressPercentage}% complete
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.continueButton}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Ionicons name="play-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}


          {/* Tip of the Day */}
          <View style={styles.section}>
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipTitle}>💡 Tip of the Day</Text>
                <TouchableOpacity onPress={getNewTip} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={18} color="#7c3aed" />
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tipText}>{currentTip || 'Loading tip...'}</Text>
            </View>
          </View>

          {/* Your Mentors - Show only if user has purchased courses */}
          {uniqueMentors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Mentors</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {uniqueMentors.map((mentor) => {
                  // Find a course from this mentor to get thumbnail
                  const mentorCourse = myPurchasedCourses.find(
                    (c) => c.teacher.id === mentor.id
                  );
                  return (
                    <TouchableOpacity
                      key={mentor.id}
                      style={styles.mentorCard}
                      onPress={() => {
                        // Navigate to first course from this mentor
                        if (mentorCourse) {
                          handlePackPress(mentorCourse.id);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: mentor.avatarUrl }}
                        style={styles.mentorAvatar}
                      />
                      <Text style={styles.mentorName} numberOfLines={1}>
                        {mentor.name}
                      </Text>
                      <View style={styles.mentorStats}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.mentorRating}>
                          {mentor.rating.toFixed(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Recommended for You */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended for You</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Main', { screen: 'Browse' })
                }
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recommendedPacks.map((pack) => (
                <PackCard
                  key={pack.id}
                  pack={pack}
                  onPress={() => handlePackPress(pack.id)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },

  /* --- Shared Sections --- */
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAll: { fontSize: 14, color: '#7c3aed', fontWeight: '600' },

  /* --- Stats --- */
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  /* --- Continue Learning --- */
  continueCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
  },
  continueImage: { width: '100%', height: 180 },
  continueContent: { padding: 20 },
  continueTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  continueTeacher: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#7c3aed' },
  progressText: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  continueButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },

  /* --- Tip of the Day --- */
  tipCard: {
    marginHorizontal: 20,
    backgroundColor: '#fefce8',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#fde047',
    elevation: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
    fontStyle: 'italic',
  },

  /* --- Recommended --- */
  horizontalScroll: {
    paddingHorizontal: 20,
  },

  /* --- Your Mentors --- */
  mentorCard: {
    width: 120,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mentorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#e5e7eb',
  },
  mentorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  mentorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mentorRating: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  bookRoomCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookRoomContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookRoomIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookRoomText: {
    flex: 1,
  },
  bookRoomTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  bookRoomSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});

export default DashboardScreen;
