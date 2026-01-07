import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useLibraryStore } from '../store/libraryStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import { useCourseStore } from '../store/courseStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import PackCard from '../components/PackCard';
import ProtectedScreen from '../components/ProtectedScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LibraryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { purchasedPacks } = useLibraryStore();
  const { purchasedCourseIds } = usePurchasedCoursesStore();
  const { courses, fetchCourses, refreshCourses, isLoading } = useCourseStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchCourses(); }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refreshCourses(); setRefreshing(false); }, []);

  const myPurchasedPacks = courses.filter((pack) => purchasedCourseIds.includes(pack.id));
  const displayPacks = myPurchasedPacks.length > 0 ? myPurchasedPacks : purchasedPacks;
  const handlePackPress = (packId: string) => navigation.navigate('PackDetail', { packId });

  const styles = createStyles(theme, isDark);

  if (isLoading && displayPacks.length === 0) {
    return (
      <ProtectedScreen>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}><Text style={styles.title}>My Library</Text><Text style={styles.subtitle}>Your purchased lessons</Text></View>
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
        </SafeAreaView>
      </ProtectedScreen>
    );
  }

  if (displayPacks.length === 0) {
    return (
      <ProtectedScreen>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}><Text style={styles.title}>My Library</Text><Text style={styles.subtitle}>Your purchased lessons</Text></View>
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={100} color={theme.textMuted} />
            <Text style={styles.emptyTitle}>Your library is empty</Text>
            <Text style={styles.emptyText}>Start learning by purchasing your first lesson pack</Text>
            <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Main', { screen: 'Browse' })}>
              <Text style={styles.browseButtonText}>Browse Lessons</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ProtectedScreen>
    );
  }

  return (
    <ProtectedScreen>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}>
          <View style={styles.header}>
            <Text style={styles.title}>My Library</Text>
            <Text style={styles.subtitle}>{displayPacks.length} {displayPacks.length === 1 ? 'pack' : 'packs'} purchased</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}><Ionicons name="play-circle" size={24} color={theme.primary} /></View>
              <Text style={styles.statValue}>{displayPacks.length}</Text>
              <Text style={styles.statLabel}>Active Packs</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}><Ionicons name="time" size={24} color={theme.success} /></View>
              <Text style={styles.statValue}>{Math.floor(displayPacks.reduce((acc, pack) => acc + pack.duration, 0) / 60)}h</Text>
              <Text style={styles.statLabel}>Total Content</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}><Ionicons name="trophy" size={24} color="#f59e0b" /></View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Continue Learning</Text></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {displayPacks.map((pack) => <PackCard key={pack.id} pack={pack} onPress={() => handlePackPress(pack.id)} />)}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>All My Packs</Text></View>
            <FlatList key="library-grid-2" data={displayPacks} keyExtractor={(item) => item.id} numColumns={2} contentContainerStyle={styles.grid} columnWrapperStyle={styles.gridRow} showsVerticalScrollIndicator={false} scrollEnabled={false} renderItem={({ item }) => <View style={styles.gridItem}><PackCard pack={item} onPress={() => handlePackPress(item.id)} /></View>} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 24 },
  browseButton: { flexDirection: 'row', backgroundColor: theme.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center', gap: 8 },
  browseButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: theme.card, padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.surfaceVariant, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  statLabel: { fontSize: 11, color: theme.textSecondary, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  horizontalScroll: { paddingHorizontal: 20 },
  grid: { paddingHorizontal: 12 },
  gridRow: { justifyContent: 'space-between', marginBottom: 16 },
  gridItem: { width: '48%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default LibraryScreen;
