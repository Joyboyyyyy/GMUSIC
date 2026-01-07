import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
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
import NotificationBell from '../components/NotificationBell';
import CartIcon from '../components/CartIcon';
import { Text, Card } from '../components/ui';
import { SPACING, RADIUS, SHADOWS, COMPONENT_SIZES } from '../theme/designSystem';

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
      <Ionicons name="musical-notes-outline" size={COMPONENT_SIZES.icon.lg} color={theme.textMuted} />
      <Text variant="label" style={{ color: theme.text, marginTop: SPACING.sm, marginBottom: SPACING.xxs }}>No Courses Yet</Text>
      <Text variant="caption" style={{ color: theme.textSecondary, textAlign: 'center' }}>Courses will appear here when added by admin.</Text>
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
              <Text variant="h2" style={{ color: theme.text }}>Hello, {user?.name || 'Student'}! 👋</Text>
              <Text variant="body" style={{ color: theme.textSecondary, marginTop: SPACING.xxs }}>Ready to learn today?</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <NotificationBell />
              <CartIcon />
            </View>
          </View>

          {/* Jamming Room Shortcut */}
          <View style={styles.section}>
            <Card style={styles.bookRoomCard} onPress={() => navigation.navigate('Main', { screen: 'BookRoom' })} elevation="sm">
              <View style={styles.bookRoomContent}>
                <View style={styles.bookRoomIcon}>
                  <Ionicons name="musical-notes-outline" size={COMPONENT_SIZES.icon.lg} color={theme.primary} />
                </View>
                <View style={styles.bookRoomText}>
                  <Text variant="h4" style={{ color: theme.text, marginBottom: SPACING.xxs }}>Jamming Room</Text>
                  <Text variant="bodySmall" style={{ color: theme.textSecondary }}>Reserve a jamming room for your sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.md} color={theme.textMuted} />
              </View>
            </Card>
          </View>

          {/* Continue Learning */}
          {continueLearningPack && (
            <View style={styles.section}>
              <Text variant="h4" style={{ color: theme.text, paddingHorizontal: SPACING.screenPadding, marginBottom: SPACING.md }}>Continue Learning</Text>
              <TouchableOpacity style={styles.continueCard} onPress={() => handlePackPress(continueLearningPack.id)}>
                <Image source={{ uri: continueLearningPack.thumbnailUrl }} style={styles.continueImage} />
                <View style={styles.continueContent}>
                  <Text variant="h4" numberOfLines={1} style={{ color: theme.text }}>{continueLearningPack.title}</Text>
                  <Text variant="bodySmall" style={{ color: theme.textSecondary }}>{continueLearningPack.teacher.name}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                    </View>
                    <Text variant="caption" style={{ color: theme.textSecondary, fontWeight: '600' }}>{progressPercentage}% complete</Text>
                  </View>
                  <TouchableOpacity style={styles.continueButton}>
                    <Text variant="button" style={{ color: '#fff' }}>Continue</Text>
                    <Ionicons name="play-circle" size={COMPONENT_SIZES.icon.sm} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Tip of the Day */}
          <View style={styles.section}>
            <View style={styles.tipCard}>
              <View style={styles.tipHeader}>
                <Text variant="h4" style={{ color: theme.text }}>💡 Tip of the Day</Text>
                <TouchableOpacity onPress={getNewTip} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={18} color={theme.primary} />
                  <Text variant="caption" style={{ fontWeight: '600', color: theme.primary }}>Refresh</Text>
                </TouchableOpacity>
              </View>
              <Text variant="body" style={{ color: theme.textSecondary, fontStyle: 'italic', lineHeight: 22 }}>{currentTip || 'Loading tip...'}</Text>
            </View>
          </View>

          {/* Your Mentors */}
          {uniqueMentors.length > 0 && (
            <View style={styles.section}>
              <Text variant="h4" style={{ color: theme.text, paddingHorizontal: SPACING.screenPadding, marginBottom: SPACING.md }}>Your Mentors</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {uniqueMentors.map((mentor) => {
                  const mentorCourse = myPurchasedCourses.find((c) => c.teacher.id === mentor.id);
                  return (
                    <TouchableOpacity key={mentor.id} style={styles.mentorCard} onPress={() => mentorCourse && handlePackPress(mentorCourse.id)}>
                      <Image source={{ uri: mentor.avatarUrl }} style={styles.mentorAvatar} />
                      <Text variant="label" numberOfLines={1} style={{ color: theme.text, textAlign: 'center' }}>{mentor.name}</Text>
                      <View style={styles.mentorStats}>
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text variant="caption" style={{ color: theme.textSecondary }}>{mentor.rating.toFixed(1)}</Text>
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
              <Text variant="h4" style={{ color: theme.text }}>Recommended for You</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
                <Text variant="label" style={{ color: theme.primary }}>See all</Text>
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

          <View style={{ height: SPACING.screenPadding }} />
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.screenPadding, paddingVertical: SPACING.md },
  section: { marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.screenPadding, marginBottom: SPACING.md },
  continueCard: { marginHorizontal: SPACING.screenPadding, backgroundColor: theme.card, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.lg },
  continueImage: { width: '100%', height: 180 },
  continueContent: { padding: SPACING.screenPadding },
  progressContainer: { marginVertical: SPACING.md },
  progressBar: { height: SPACING.xs, backgroundColor: theme.surfaceVariant, borderRadius: RADIUS.xs, overflow: 'hidden', marginBottom: SPACING.xs },
  progressFill: { height: '100%', backgroundColor: theme.primary },
  continueButton: { backgroundColor: theme.primary, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  tipCard: { marginHorizontal: SPACING.screenPadding, backgroundColor: isDark ? '#422006' : '#fefce8', borderRadius: RADIUS.lg, padding: SPACING.screenPadding, borderWidth: 2, borderColor: isDark ? '#854d0e' : '#fde047', ...SHADOWS.sm },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, paddingHorizontal: SPACING.xs, paddingVertical: SPACING.xxs },
  horizontalScroll: { paddingHorizontal: SPACING.screenPadding },
  mentorCard: { width: 120, marginRight: SPACING.md, backgroundColor: theme.card, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', ...SHADOWS.sm },
  mentorAvatar: { width: COMPONENT_SIZES.avatar.xl, height: COMPONENT_SIZES.avatar.xl, borderRadius: COMPONENT_SIZES.avatar.xl / 2, marginBottom: SPACING.xs, backgroundColor: theme.surfaceVariant },
  mentorStats: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, marginTop: SPACING.xxs },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.screenPadding, marginHorizontal: SPACING.screenPadding, backgroundColor: theme.card, borderRadius: RADIUS.lg },
  loadingContainer: { paddingVertical: SPACING.xxl, alignItems: 'center' },
  bookRoomCard: { marginHorizontal: SPACING.screenPadding, padding: SPACING.screenPadding },
  bookRoomContent: { flexDirection: 'row', alignItems: 'center' },
  bookRoomIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  bookRoomText: { flex: 1 },
});

export default DashboardScreen;
