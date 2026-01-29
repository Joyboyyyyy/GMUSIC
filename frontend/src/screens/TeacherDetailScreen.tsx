import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { teacherApi, Teacher } from '../services/api.service';
import { Text, Card } from '../components/ui';
import { OptimizedImage } from '../components/OptimizedImage';
import { SPACING, RADIUS, COMPONENT_SIZES, SHADOWS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'TeacherDetail'>;

const TeacherDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { teacherId } = route.params;
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      setLoading(true);
      try {
        const response = await teacherApi.getTeacherById(teacherId);
        if (response.success && response.data) {
          setTeacher(response.data);
        }
      } catch (error) {
        console.error('Error fetching teacher:', error);
      }
      setLoading(false);
    };
    fetchTeacher();
  }, [teacherId]);

  const handleEmailContact = async () => {
    if (teacher?.email) {
      try {
        const canOpen = await Linking.canOpenURL(`mailto:${teacher.email}`);
        if (canOpen) {
          await Linking.openURL(`mailto:${teacher.email}?subject=Music Lesson Inquiry`);
        } else {
          // Fallback: show alert if email client not available
          Alert.alert(
            'Email Not Available',
            `Please email ${teacher.email} directly using your email client.`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error opening email client:', error);
        Alert.alert(
          'Error',
          'Unable to open email client. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const styles = createStyles(theme, isDark);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" style={{ color: theme.textSecondary, marginTop: SPACING.md }}>
            Loading teacher details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!teacher) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color={theme.textMuted} />
          <Text variant="h4" style={{ color: theme.text, marginTop: SPACING.md }}>
            Teacher Not Found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const instrumentLabels: Record<string, string> = {
    GUITAR: '🎸 Guitar',
    PIANO: '🎹 Piano',
    DRUMS: '🥁 Drums',
    VOCALS: '🎤 Vocals',
    VIOLIN: '🎻 Violin',
    FLUTE: '🎵 Flute',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text variant="h4" style={{ color: theme.text }}>Teacher Profile</Text>
          {teacher?.email && (
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailContact}>
              <Ionicons name="mail" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <OptimizedImage 
            uri={teacher.avatarUrl} 
            width={COMPONENT_SIZES.avatar.xxl}
            height={COMPONENT_SIZES.avatar.xxl}
            style={styles.avatar}
          />
          <Text variant="h2" style={{ color: theme.text, marginTop: SPACING.md }}>
            {teacher.name}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xxs }}>
              {teacher.rating.toFixed(1)}
            </Text>
            <Text variant="body" style={{ color: theme.textSecondary, marginLeft: SPACING.xs }}>
              ({teacher.ratingCount} reviews)
            </Text>
          </View>

          {/* Joined Date */}
          {teacher.joinedDate && (
            <Text variant="caption" style={{ color: theme.textMuted, marginTop: SPACING.xs }}>
              Teaching since {new Date(teacher.joinedDate).getFullYear()}
            </Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard} elevation="sm">
            <Ionicons name="people" size={24} color={theme.primary} />
            <Text variant="h3" style={{ color: theme.text, marginTop: SPACING.xs }}>
              {teacher.students}
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Students</Text>
          </Card>
          <Card style={styles.statCard} elevation="sm">
            <Ionicons name="time" size={24} color={theme.success} />
            <Text variant="h3" style={{ color: theme.text, marginTop: SPACING.xs }}>
              {teacher.totalHoursTaught || 0}+
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Hours</Text>
          </Card>
          <Card style={styles.statCard} elevation="sm">
            <Ionicons name="star" size={24} color="#f59e0b" />
            <Text variant="h3" style={{ color: theme.text, marginTop: SPACING.xs }}>
              {teacher.rating.toFixed(1)}
            </Text>
            <Text variant="caption" style={{ color: theme.textSecondary }}>Rating</Text>
          </Card>
        </View>

        {/* Bio Section */}
        {teacher.bio && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>About</Text>
            </View>
            <Text variant="body" style={{ color: theme.textSecondary, lineHeight: 22 }}>
              {teacher.bio}
            </Text>
          </Card>
        )}

        {/* Experience Section */}
        {teacher.experience && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>Experience</Text>
            </View>
            <Text variant="body" style={{ color: theme.textSecondary, lineHeight: 22 }}>
              {teacher.experience}
            </Text>
          </Card>
        )}

        {/* Teaching Style */}
        {teacher.teachingStyle && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>Teaching Style</Text>
            </View>
            <Text variant="body" style={{ color: theme.textSecondary, lineHeight: 22 }}>
              {teacher.teachingStyle}
            </Text>
          </Card>
        )}

        {/* Instruments Section */}
        {teacher.instruments && teacher.instruments.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="musical-notes-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Instruments
              </Text>
            </View>
            <View style={styles.tagsContainer}>
              {teacher.instruments.map((instrument, index) => (
                <View key={index} style={styles.instrumentTag}>
                  <Text variant="label" style={{ color: theme.primary }}>
                    {instrumentLabels[instrument] || instrument}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Specializations */}
        {teacher.specializations && teacher.specializations.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Specializations
              </Text>
            </View>
            <View style={styles.tagsContainer}>
              {teacher.specializations.map((spec, index) => (
                <View key={index} style={styles.specializationTag}>
                  <Text variant="label" style={{ color: theme.success }}>
                    {spec}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Achievements */}
        {teacher.achievements && teacher.achievements.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Achievements
              </Text>
            </View>
            {teacher.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text variant="body" style={{ color: theme.textSecondary, marginLeft: SPACING.xs }}>
                  {achievement}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Certifications */}
        {teacher.certifications && teacher.certifications.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="ribbon-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Certifications
              </Text>
            </View>
            {teacher.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <Ionicons name="medal" size={16} color="#f59e0b" />
                <Text variant="body" style={{ color: theme.textSecondary, marginLeft: SPACING.xs }}>
                  {cert}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* Languages */}
        {teacher.languages && teacher.languages.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="language-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Languages
              </Text>
            </View>
            <View style={styles.tagsContainer}>
              {teacher.languages.map((language, index) => (
                <View key={index} style={styles.languageTag}>
                  <Text variant="label" style={{ color: theme.text }}>
                    {language}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Courses Section */}
        {teacher.courses && teacher.courses.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Courses ({teacher.courses.length})
              </Text>
            </View>
            {teacher.courses.map((course, index) => (
              <TouchableOpacity
                key={index}
                style={styles.courseItem}
                onPress={() => navigation.navigate('PackDetail', { packId: course.id })}
              >
                <View style={styles.courseIcon}>
                  <Ionicons name="play-circle" size={20} color={theme.primary} />
                </View>
                <View style={styles.courseInfo}>
                  <Text variant="label" style={{ color: theme.text }}>{course.name}</Text>
                  <Text variant="caption" style={{ color: theme.textSecondary }}>
                    {instrumentLabels[course.instrument] || course.instrument}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Buildings Section */}
        {teacher.buildings && teacher.buildings.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Teaching Locations
              </Text>
            </View>
            {teacher.buildings.map((building, index) => (
              <TouchableOpacity
                key={index}
                style={styles.buildingItem}
                onPress={() => navigation.navigate('BuildingCourses', {
                  buildingId: building.id,
                  buildingName: building.name,
                })}
              >
                <View style={styles.buildingIcon}>
                  <Ionicons name="business" size={20} color={theme.primary} />
                </View>
                <View style={styles.buildingInfo}>
                  <Text variant="label" style={{ color: theme.text }}>{building.name}</Text>
                  <Text variant="caption" style={{ color: theme.textSecondary }}>
                    {building.city}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Recent Reviews - Coming Soon */}
        {/* TODO: Add reviews when Teacher type includes reviews field */}
        {false && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>
                Recent Reviews
              </Text>
            </View>
          </Card>
        )}

        {/* Contact Section - Only show if email exists */}
        {teacher?.email && (
          <Card style={styles.sectionCard} elevation="sm">
            <View style={styles.sectionHeader}>
              <Ionicons name="mail-outline" size={20} color={theme.primary} />
              <Text variant="h4" style={{ color: theme.text, marginLeft: SPACING.xs }}>Contact</Text>
            </View>
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailContact}>
              <Ionicons name="mail" size={18} color={theme.primary} />
              <Text variant="body" style={{ color: theme.primary, marginLeft: SPACING.xs }}>
                {teacher.email}
              </Text>
              <Ionicons name="open-outline" size={16} color={theme.primary} style={{ marginLeft: SPACING.xs }} />
            </TouchableOpacity>
            
            {teacher.availability && (
              <View style={styles.availabilityItem}>
                <Ionicons name="time" size={18} color={theme.success} />
                <Text variant="body" style={{ color: theme.textSecondary, marginLeft: SPACING.xs }}>
                  {teacher.availability}
                </Text>
              </View>
            )}
          </Card>
        )}

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.screenPadding,
  },
  avatar: {
    width: COMPONENT_SIZES.avatar.xxl,
    height: COMPONENT_SIZES.avatar.xxl,
    borderRadius: COMPONENT_SIZES.avatar.xxl / 2,
    borderWidth: 4,
    borderColor: theme.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  sectionCard: {
    marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  instrumentTag: {
    backgroundColor: theme.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  specializationTag: {
    backgroundColor: theme.successLight || theme.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  languageTag: {
    backgroundColor: theme.surfaceVariant,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  courseInfo: { flex: 1 },
  buildingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  buildingIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: theme.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  buildingInfo: { flex: 1 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginTop: SPACING.sm,
  },
  reviewItem: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
});

export default TeacherDetailScreen;
