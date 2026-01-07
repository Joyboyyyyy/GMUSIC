import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
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
import { useCourseStore } from '../store/courseStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import PackCard from '../components/PackCard';
import ProtectedScreen from '../components/ProtectedScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { purchasedPacks } = useLibraryStore();
  const { purchasedCourseIds } = usePurchasedCoursesStore();
  const { currentTip, loadDailyTip, getNewTip } = useTipsStore();
  const { courses, fetchCourses, refreshCourses, isLoading } = useCourseStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDailyTip();
    fetchCourses();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCourses();
    setRefreshing(false);
  }, []);

  const packs = courses;
  const myPurchasedCourses = packs.filter((pack) => purchasedCourseIds.includes(pack.id));
  const uniqueMentors = Array.from(new Map(myPurchasedCourses.map((course) => [course.teacher.id, course.teacher])).values());
  const recommendedPacks = packs.slice(0, 5);
  const continueLearningPack = myPurchasedCourses.length > 0 ? myPurchasedCourses[0] : purchasedPacks.length > 0 ? purchasedPacks[0] : null;
  const progressPercentage = 35;

  const handlePackPress = (packId: string) => navigation.navigate('PackDetail', { packId });

  const styles = createStyles(theme, isDark);

  const EmptyRecommendedState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="musical-notes-outline" size={40} color={theme.textMuted} />
      <Text style={styles.emptyStateTitle}>No Courses Yet</Text>
      <Text style={styles.emptyStateText}>Courses will appear here when added by admin.</Text>
    </View>
  );

  return (
    <ProtectedScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name || 'Student'}! 👋</Text>
              <Text style={styles.subtitle}>Ready to learn today?</Text>
            </View>
          </View>

          {/* Book a Room Shortcut */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.bookRoomCard} onPress={() => navigation.navigate('Main', { screen: 'BookRoom' })}>
              <View style={styles.bookRoomContent}>
                <View style={styles.bookRoomIcon}>
                  <Ionicons name="calendar-outline" size={32} color={theme.primary} />
                </View>
                <View style={styles.bookRoomText}>
                  <Text style={styles.bookRoomTitle}>Book a Room</Text>
                  <Text style={styles.bookRoomSubtitle}>Reserve a practice room for your sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Continue Learning */}
          {continueLearningPack && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Continue Learning</Text>
              <TouchableOpacity style={styles.continueCard} onPress={() => handlePackPress(continueLearningPack.id)}>
                <Image source={{ uri: continueLearningPack.thumbnailUrl }} style={styles.continueImage} />
                <View style={styles.continueContent}>
                  <Text style={styles.continueTitle} numberOfLines={1}>{continueLearningPack.title}</Text>
                  <Text style={styles.continueTeacher}>{continueLearningPack.teacher.name}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{progressPercentage}% complete</Text>
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
                  <Ionicons name="refresh" size={18} color={theme.primary} />
                  <Text style={styles.refreshText}>Refresh</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tipText}>{currentTip || 'Loading tip...'}</Text>
            </View>
          </View>

          {/* Your Mentors */}
          {uniqueMentors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Mentors</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {uniqueMentors.map((mentor) => {
                  const mentorCourse = myPurchasedCourses.find((c) => c.teacher.id === mentor.id);
                  return (
                    <TouchableOpacity key={mentor.id} style={styles.mentorCard} onPress={() => mentorCourse && handlePackPress(mentorCourse.id)}>
                      <Image source={{ uri: mentor.avatarUrl }} style={styles.mentorAvatar} />
                      <Text style={styles.mentorName} numberOfLines={1}>{mentor.name}</Text>
                      <View style={styles.mentorStats}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text style={styles.mentorRating}>{mentor.rating.toFixed(1)}</Text>
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
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Browse' })}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : recommendedPacks.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {recommendedPacks.map((pack) => (
                  <PackCard key={pack.id} pack={pack} onPress={() => handlePackPress(pack.id)} />
                ))}
              </ScrollView>
            ) : (
              <EmptyRecommendedState />
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, paddingHorizontal: 20, marginBottom: 16 },
  seeAll: { fontSize: 14, color: theme.primary, fontWeight: '600' },
  continueCard: { marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, overflow: 'hidden', elevation: 6 },
  continueImage: { width: '100%', height: 180 },
  continueContent: { padding: 20 },
  continueTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  continueTeacher: { fontSize: 14, color: theme.textSecondary, marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  progressBar: { height: 8, backgroundColor: theme.surfaceVariant, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: theme.primary },
  progressText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
  continueButton: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  continueButtonText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  tipCard: { marginHorizontal: 20, backgroundColor: isDark ? '#422006' : '#fefce8', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: isDark ? '#854d0e' : '#fde047', elevation: 2 },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tipTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  refreshText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  tipText: { fontSize: 15, lineHeight: 22, color: theme.textSecondary, fontStyle: 'italic' },
  horizontalScroll: { paddingHorizontal: 20 },
  mentorCard: { width: 120, marginRight: 16, backgroundColor: theme.card, borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  mentorAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 8, backgroundColor: theme.surfaceVariant },
  mentorName: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4, textAlign: 'center' },
  mentorStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mentorRating: { fontSize: 12, color: theme.textSecondary, fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 20, marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16 },
  emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginTop: 12, marginBottom: 6 },
  emptyStateText: { fontSize: 13, color: theme.textSecondary, textAlign: 'center' },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  bookRoomCard: { marginHorizontal: 20, backgroundColor: theme.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  bookRoomContent: { flexDirection: 'row', alignItems: 'center' },
  bookRoomIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  bookRoomText: { flex: 1 },
  bookRoomTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  bookRoomSubtitle: { fontSize: 14, color: theme.textSecondary },
});

export default DashboardScreen;
