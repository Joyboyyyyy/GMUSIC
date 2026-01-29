import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { teacherApi, Teacher } from '../services/api.service';
import { Text, Card } from '../components/ui';
import { OptimizedImage } from '../components/OptimizedImage';
import { SPACING, RADIUS, COMPONENT_SIZES, SHADOWS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AllTeachersScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await teacherApi.getFeaturedTeachers(50); // Get more teachers
      if (response.success && response.data) {
        setTeachers(response.data);
      }
    } catch (error) {
      console.error('[AllTeachersScreen] Error fetching teachers:', error);
      
      // Fallback to comprehensive mock data
      console.log('[AllTeachersScreen] Using mock teachers data');
      const mockTeachers: Teacher[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@gretexmusic.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=7c3aed&color=fff',
          bio: 'Passionate music educator with over 8 years of experience teaching guitar and piano. I believe in making music learning fun and accessible for students of all ages.',
          rating: 4.8,
          ratingCount: 127,
          students: 89,
          coursesCount: 12,
          instruments: ['GUITAR', 'PIANO'],
          buildings: [{ id: '1', name: 'Downtown Music Center', city: 'Mumbai' }],
          totalHoursTaught: 520,
          specializations: ['Acoustic Guitar', 'Classical Piano', 'Fingerstyle', 'Music Theory'],
          experience: '8+ years of professional guitar and piano instruction',
          joinedDate: '2019-03-15'
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael@gretexmusic.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=Michael+Chen&background=059669&color=fff',
          bio: 'Professional drummer with 10+ years of performance and teaching experience. Specializes in rock, jazz, and contemporary drumming styles.',
          rating: 4.9,
          ratingCount: 98,
          students: 67,
          coursesCount: 8,
          instruments: ['DRUMS'],
          buildings: [{ id: '2', name: 'Harmony Academy', city: 'Mumbai' }],
          totalHoursTaught: 430,
          specializations: ['Rock Drumming', 'Jazz Drumming', 'Rhythm Training'],
          experience: '10+ years of professional drumming and instruction',
          joinedDate: '2018-07-22'
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily@gretexmusic.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=dc2626&color=fff',
          bio: 'Award-winning vocal coach with extensive performance background. Helps students develop their unique voice and stage presence.',
          rating: 4.7,
          ratingCount: 156,
          students: 112,
          coursesCount: 15,
          instruments: ['VOCALS'],
          buildings: [{ id: '1', name: 'Downtown Music Center', city: 'Mumbai' }],
          totalHoursTaught: 680,
          specializations: ['Vocal Technique', 'Breath Control', 'Performance'],
          experience: '12+ years of vocal coaching and performance',
          joinedDate: '2017-01-10'
        },
        {
          id: '4',
          name: 'David Kumar',
          email: 'david@gretexmusic.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=David+Kumar&background=7c3aed&color=fff',
          bio: 'Classical violinist with conservatory training. Passionate about teaching proper technique and musical expression.',
          rating: 4.6,
          ratingCount: 73,
          students: 45,
          coursesCount: 6,
          instruments: ['VIOLIN'],
          buildings: [{ id: '3', name: 'Classical Institute', city: 'Mumbai' }],
          totalHoursTaught: 290,
          specializations: ['Classical Violin', 'Bow Technique', 'Music Reading'],
          experience: '6+ years of classical violin instruction',
          joinedDate: '2020-09-15'
        },
        {
          id: '5',
          name: 'Lisa Thompson',
          email: 'lisa@gretexmusic.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=Lisa+Thompson&background=f59e0b&color=fff',
          bio: 'Multi-instrumentalist specializing in flute and woodwind instruments. Creates engaging lessons for all skill levels.',
          rating: 4.5,
          ratingCount: 64,
          students: 38,
          coursesCount: 7,
          instruments: ['FLUTE'],
          buildings: [{ id: '2', name: 'Harmony Academy', city: 'Mumbai' }],
          totalHoursTaught: 220,
          specializations: ['Classical Flute', 'Breath Control', 'Tone Development'],
          experience: '5+ years of flute and woodwind instruction',
          joinedDate: '2021-02-28'
        },
        {
          id: '6',
          name: 'Alex Martinez',
          email: 'alex@gretexmusic.com',
          avatarUrl: 'https://ui-avatars.com/api/?name=Alex+Martinez&background=8b5cf6&color=fff',
          bio: 'Contemporary guitarist and songwriter. Teaches modern techniques and helps students write their own music.',
          rating: 4.7,
          ratingCount: 91,
          students: 72,
          coursesCount: 10,
          instruments: ['GUITAR'],
          buildings: [{ id: '1', name: 'Downtown Music Center', city: 'Mumbai' }],
          totalHoursTaught: 380,
          specializations: ['Electric Guitar', 'Songwriting', 'Modern Techniques'],
          experience: '7+ years of contemporary guitar instruction',
          joinedDate: '2019-11-05'
        }
      ];
      
      setTeachers(mockTeachers);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  const instrumentLabels: Record<string, string> = {
    GUITAR: '🎸 Guitar',
    PIANO: '🎹 Piano',
    DRUMS: '🥁 Drums',
    VOCALS: '🎤 Vocals',
    VIOLIN: '🎻 Violin',
    FLUTE: '🎵 Flute',
  };

  const styles = createStyles(theme, isDark);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text variant="h4" style={{ color: theme.text }}>All Teachers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" style={{ color: theme.textSecondary, marginTop: SPACING.md }}>
            Loading teachers...
          </Text>
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
        <Text variant="h4" style={{ color: theme.text }}>All Teachers</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsHeader}>
          <Text variant="body" style={{ color: theme.textSecondary }}>
            {teachers.length} expert instructors available
          </Text>
        </View>

        <View style={styles.teachersGrid}>
          {teachers.map((teacher) => (
            <TouchableOpacity
              key={teacher.id}
              style={styles.teacherCard}
              onPress={() => navigation.navigate('TeacherDetail', { teacherId: teacher.id })}
            >
              <Card style={styles.cardContent} elevation="sm">
                <View style={styles.teacherHeader}>
                  <OptimizedImage 
                    uri={teacher.avatarUrl} 
                    width={60}
                    height={60}
                    style={styles.teacherAvatar}
                  />
                  <View style={styles.teacherInfo}>
                    <Text variant="h4" style={{ color: theme.text }} numberOfLines={1}>
                      {teacher.name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text variant="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                        {teacher.rating.toFixed(1)} ({teacher.ratingCount})
                      </Text>
                    </View>
                    <Text variant="caption" style={{ color: theme.textMuted }}>
                      {teacher.students} students • {teacher.totalHoursTaught || 0}+ hours
                    </Text>
                  </View>
                </View>

                {/* Instruments */}
                <View style={styles.instrumentsContainer}>
                  {teacher.instruments.slice(0, 3).map((instrument, index) => (
                    <View key={index} style={styles.instrumentChip}>
                      <Text variant="caption" style={{ color: theme.primary, fontSize: 10 }}>
                        {instrumentLabels[instrument] || instrument}
                      </Text>
                    </View>
                  ))}
                  {teacher.instruments.length > 3 && (
                    <View style={styles.moreChip}>
                      <Text variant="caption" style={{ color: theme.textMuted, fontSize: 10 }}>
                        +{teacher.instruments.length - 3}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Specializations */}
                {teacher.specializations && teacher.specializations.length > 0 && (
                  <View style={styles.specializationsContainer}>
                    <Text variant="caption" style={{ color: theme.textSecondary, marginBottom: 4 }}>
                      Specializes in:
                    </Text>
                    <Text variant="caption" style={{ color: theme.textMuted }} numberOfLines={2}>
                      {teacher.specializations.slice(0, 3).join(' • ')}
                    </Text>
                  </View>
                )}

                {/* Bio Preview */}
                <Text variant="caption" style={{ color: theme.textMuted, lineHeight: 16 }} numberOfLines={2}>
                  {teacher.bio}
                </Text>

                {/* Buildings */}
                {teacher.buildings && teacher.buildings.length > 0 && (
                  <View style={styles.buildingsContainer}>
                    <Ionicons name="location" size={12} color={theme.textMuted} />
                    <Text variant="caption" style={{ color: theme.textMuted, marginLeft: 4 }} numberOfLines={1}>
                      {teacher.buildings.map(b => b.name).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Action Button */}
                <TouchableOpacity 
                  style={styles.viewProfileButton}
                  onPress={() => navigation.navigate('TeacherDetail', { teacherId: teacher.id })}
                >
                  <Text variant="label" style={{ color: theme.primary }}>
                    View Profile
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsHeader: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  teachersGrid: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.md,
  },
  teacherCard: {
    marginBottom: SPACING.sm,
  },
  cardContent: {
    padding: SPACING.md,
  },
  teacherHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: SPACING.sm,
  },
  teacherInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  instrumentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  instrumentChip: {
    backgroundColor: theme.primaryLight,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  moreChip: {
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  specializationsContainer: {
    marginBottom: SPACING.sm,
  },
  buildingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primaryLight,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
});

export default AllTeachersScreen;