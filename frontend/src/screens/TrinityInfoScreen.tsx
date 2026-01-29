import React from 'react';
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
import { useThemeStore, getTheme } from '../store/themeStore';

const TrinityInfoScreen = () => {
  const navigation = useNavigation();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  const whyChooseItems = [
    { icon: 'sparkles', text: 'We understand the transformative power of performance' },
    { icon: 'trending-up', text: 'Our qualifications help ensure candidates make progress by providing carefully levelled stepping stones that build confidence and enjoyment' },
    { icon: 'school', text: 'We aim to design assessments that have a positive impact on student learning, engagement and achievement' },
    { icon: 'heart', text: 'We encourage candidates to bring their own choices and interests into our exams — this motivates students and makes the assessment more relevant' },
    { icon: 'options', text: 'Our flexible exams give candidates the opportunity to perform to their strengths and interests' },
    { icon: 'globe', text: 'Our qualifications are accessible to candidates of all ages and from all cultures' },
    { icon: 'people', text: 'Our highly qualified and friendly examiners are trained to put candidates at their ease and provide maximum encouragement' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trinity Certification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="ribbon" size={48} color={theme.primary} />
          </View>
          <Text style={styles.heroTitle}>Trinity College London</Text>
          <Text style={styles.heroSubtitle}>125+ Years of Excellence in India</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100,000+</Text>
            <Text style={styles.statLabel}>Students Annually</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100+</Text>
            <Text style={styles.statLabel}>Centres in India</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>60+</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Trinity</Text>
          <Text style={styles.paragraph}>
            Trinity College London believes that effective communicative and performance skills are life enhancing, know no bounds and should be within reach of us all.
          </Text>
          <Text style={styles.paragraph}>
            We exist to promote and foster the best possible communicative and performance skills through assessment, content and training which is innovative, personal and authentic.
          </Text>
          <Text style={styles.paragraph}>
            Trinity College London is a leading international exam board and independent education charity that has been providing assessments around the world since 1877. We specialise in the assessment of communicative and performance skills covering music, drama, combined arts and English language.
          </Text>
        </View>

        {/* CBSE Badge */}
        <View style={styles.cbseBadge}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <View style={styles.cbseContent}>
            <Text style={styles.cbseTitle}>CBSE Accredited</Text>
            <Text style={styles.cbseText}>Accredited by Central Board of Secondary Education to design and implement training in English Language for students.</Text>
          </View>
        </View>

        {/* About Trinity India */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Trinity India</Text>
          <Text style={styles.paragraph}>
            Trinity has a very rich heritage in India dating back over 125 years. Every year around 100,000 candidates appear for Trinity assessments in Creative & Performing Arts and English Language from over 100 centres spread across India.
          </Text>
          <Text style={styles.paragraph}>
            Our aim is to inspire teachers and learners through the creation of assessments that are enjoyable to prepare for, rewarding to teach and that develop the skills needed in real life.
          </Text>
        </View>

        {/* Why Choose Trinity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Choose Trinity?</Text>
          <Text style={styles.sectionSubtitle}>Teachers and students choose Trinity because:</Text>
          
          {whyChooseItems.map((item, index) => (
            <View key={index} style={styles.whyItem}>
              <View style={styles.whyIconContainer}>
                <Ionicons name={item.icon as any} size={20} color={theme.primary} />
              </View>
              <Text style={styles.whyText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceVariant, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  content: { padding: 20 },
  heroSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: theme.card, borderRadius: 20, marginBottom: 20 },
  logoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: theme.text, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, color: theme.primary, marginTop: 8, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: theme.primary },
  statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, height: 40, backgroundColor: theme.border },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 16 },
  paragraph: { fontSize: 15, color: theme.textSecondary, lineHeight: 24, marginBottom: 12 },
  cbseBadge: { flexDirection: 'row', backgroundColor: isDark ? '#064e3b' : '#d1fae5', padding: 16, borderRadius: 12, marginBottom: 24, alignItems: 'flex-start' },
  cbseContent: { flex: 1, marginLeft: 12 },
  cbseTitle: { fontSize: 16, fontWeight: '700', color: '#10b981', marginBottom: 4 },
  cbseText: { fontSize: 13, color: isDark ? '#6ee7b7' : '#047857', lineHeight: 20 },
  whyItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  whyIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  whyText: { flex: 1, fontSize: 14, color: theme.textSecondary, lineHeight: 22 },
});

export default TrinityInfoScreen;
