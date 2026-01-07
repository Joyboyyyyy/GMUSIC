import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useCourseStore } from '../store/courseStore';
import { useThemeStore, getTheme } from '../store/themeStore';
import { Category } from '../types';
import PackCard from '../components/PackCard';
import FloatingCartBar from '../components/FloatingCartBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BrowseRouteProp = RouteProp<RootStackParamList, 'Browse'>;

const CATEGORIES: { name: Category | 'All'; icon: string; ionicon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'All', icon: '🎵', ionicon: 'apps' },
  { name: 'Guitar', icon: '🎸', ionicon: 'musical-note' },
  { name: 'Piano', icon: '🎹', ionicon: 'musical-notes' },
  { name: 'Drums', icon: '🥁', ionicon: 'disc' },
  { name: 'Vocal Training', icon: '🎤', ionicon: 'mic' },
];

const BrowseScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BrowseRouteProp>();
  const initialCategory = route.params?.category as Category | 'All' | undefined;
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>(initialCategory || 'All');
  const { courses, fetchCourses, refreshCourses, isLoading } = useCourseStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [refreshing, setRefreshing] = useState(false);
  const [cartBarVisible, setCartBarVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scaleAnims = useRef(CATEGORIES.map(() => new Animated.Value(1))).current;

  useEffect(() => { fetchCourses(); }, []);

  // Update category when navigating with params
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCourses();
    setRefreshing(false);
  }, []);

  const packs = courses;
  const filteredPacks = selectedCategory === 'All' 
    ? packs 
    : packs.filter((pack) => {
        // Match category case-insensitively (backend sends GUITAR, frontend uses Guitar)
        const packCategory = (pack.category || '').toUpperCase();
        const selectedCat = selectedCategory.toUpperCase().replace(' ', '_');
        // Handle "Vocal Training" -> "VOCALS"
        if (selectedCat === 'VOCAL_TRAINING') return packCategory === 'VOCALS';
        return packCategory === selectedCat;
      });
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

  const handleCategoryPress = (category: Category | 'All', index: number) => {
    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.spring(scaleAnims[index], { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }),
    ]).start();
    setSelectedCategory(category);
  };

  const styles = createStyles(theme, isDark);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="musical-notes-outline" size={48} color={theme.textMuted} />
      <Text style={styles.emptyStateTitle}>No Courses Available</Text>
      <Text style={styles.emptyStateText}>{selectedCategory === 'All' ? 'New courses will appear here when added.' : `No ${selectedCategory} courses available yet.`}</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={16} color={theme.primary} />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const CategoryChip = ({ item, index }: { item: typeof CATEGORIES[0]; index: number }) => {
    const isSelected = selectedCategory === item.name;
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnims[index] }] }}>
        <TouchableOpacity
          style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
          onPress={() => handleCategoryPress(item.name, index)}
          activeOpacity={0.8}
        >
          <View style={[styles.categoryIconWrapper, isSelected && styles.categoryIconWrapperActive]}>
            <Text style={styles.categoryEmoji}>{item.icon}</Text>
          </View>
          <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
            {item.name}
          </Text>
          {isSelected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.subtitle}>Explore lessons by category</Text>
      </View>

      <View style={styles.categoriesWrapper}>
        {CATEGORIES.map((item, index) => (
          <CategoryChip key={item.name} item={item} index={index} />
        ))}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredPacks.length} {filteredPacks.length === 1 ? 'lesson' : 'lessons'} found
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredPacks.length > 0 ? (
        <FlatList
          key="browse-list-1"
          data={filteredPacks}
          keyExtractor={(item) => item.id}
          numColumns={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <PackCard pack={item} onPress={() => handlePackPress(item.id)} fullWidth={true} />
            </View>
          )}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'empty'}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
          renderItem={() => null}
        />
      )}
      
      <FloatingCartBar visible={cartBarVisible} />
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  categoriesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 14,
    borderRadius: 20,
    backgroundColor: theme.card,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChipActive: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? theme.surfaceVariant : '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapperActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryEmoji: { fontSize: 14 },
  categoryChipText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.text,
  },
  categoryChipTextActive: { color: '#fff' },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -2,
  },
  resultsHeader: { paddingHorizontal: 20, paddingVertical: 10 },
  resultsText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
  grid: { paddingHorizontal: 0, paddingBottom: 100 },
  gridItem: { width: '100%', marginBottom: 16 },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60, 
    paddingHorizontal: 20, 
    marginHorizontal: 20, 
    marginTop: 40,
    backgroundColor: theme.card, 
    borderRadius: 16 
  },
  emptyStateTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginTop: 16, marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.primaryLight, gap: 6 },
  refreshButtonText: { fontSize: 14, fontWeight: '600', color: theme.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyContainer: { flex: 1 },
});

export default BrowseScreen;
