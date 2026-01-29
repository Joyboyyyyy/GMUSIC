import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Keyboard, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import api from '../utils/api';
import { debounce } from '../utils/helpers';
import { buildingApi, courseApi, teacherApi } from '../services/api.service';
import { SPACING, COMPONENT_SIZES, RADIUS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SearchResult = { id: string; type: 'course' | 'teacher' | 'building'; title: string; subtitle: string; image?: string; extra?: string; };
type TabType = 'all' | 'courses' | 'teachers' | 'buildings';

const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allData, setAllData] = useState<SearchResult[]>([]); // Store all loaded data
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // New state for search loading
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load all data initially when screen opens
  const loadAllData = async () => {
    setLoading(true);
    try {
      const allResults: SearchResult[] = [];

      // Load all courses
      const coursesResponse = await courseApi.getCourses();
      if (coursesResponse.success && coursesResponse.data) {
        coursesResponse.data.forEach((course) => {
          allResults.push({
            id: course.id,
            type: 'course',
            title: course.title || 'Music Course', // Use title property
            subtitle: course.instrument || 'Music Course',
            image: course.previewVideoUrl || undefined,
            extra: course.building?.name ? `at ${course.building.name}` : `₹${course.pricePerSlot}/slot`,
          });
        });
      }

      // Load all teachers
      try {
        const teachersResponse = await teacherApi.getFeaturedTeachers(50); // Get more teachers
        if (teachersResponse.success && teachersResponse.data) {
          teachersResponse.data.forEach((teacher) => {
            allResults.push({
              id: teacher.id,
              type: 'teacher',
              title: teacher.name,
              subtitle: teacher.instruments?.length > 0 
                ? teacher.instruments.join(', ') 
                : 'Music Teacher',
              image: teacher.avatarUrl || undefined,
              extra: `${teacher.students || 0} students • ${teacher.rating || 0}⭐`,
            });
          });
        }
      } catch (error) {
        console.log('[Search] Teachers API not available, skipping...');
      }

      // Load all buildings
      const buildingsResponse = await buildingApi.getAllBuildings();
      if (buildingsResponse.success && buildingsResponse.data) {
        buildingsResponse.data.forEach((building) => {
          allResults.push({
            id: building.id,
            type: 'building',
            title: building.name,
            subtitle: `${building.city}, ${building.state}`,
            image: undefined,
            extra: `${building.courses?.length || 0} courses • ${building.visibilityType?.toLowerCase() || 'public'}`,
          });
        });
      }

      console.log('[Search] Loaded data:', allResults.length, 'items');
      setAllData(allResults); // Store all data
      setResults(allResults); // Show all data initially
      setInitialDataLoaded(true);
    } catch (error) {
      console.error('[Search] Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search function with better debouncing
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) { 
      // If no query, show filtered data from allData
      console.log('[Search] No query, showing all data filtered by tab');
      if (initialDataLoaded && allData.length > 0) {
        filterResultsByTab(allData);
      } else {
        await loadAllData();
      }
      setSearched(false);
      setIsSearching(false);
      return; 
    }
    
    setIsSearching(true);
    setSearched(true);
    
    try {
      const response = await api.get('/api/search', { 
        params: { 
          q: searchQuery.trim(), 
          type: activeTab === 'all' ? undefined : activeTab 
        } 
      });
      
      if (response.data?.success && response.data?.data) {
        console.log('[Search] Search results:', response.data.data.length, 'items');
        setResults(response.data.data);
      } else {
        setResults([]);
      }
    } catch (error) { 
      console.error('[Search] Error:', error); 
      setResults([]); 
    } finally { 
      setIsSearching(false);
    }
  };

  // Filter results by active tab
  const filterResultsByTab = (sourceData: SearchResult[]) => {
    console.log('[Search] Filtering by tab:', activeTab, 'from', sourceData.length, 'items');
    if (activeTab === 'all') {
      setResults(sourceData);
    } else {
      const filtered = sourceData.filter(result => {
        if (activeTab === 'courses') return result.type === 'course';
        if (activeTab === 'teachers') return result.type === 'teacher';
        if (activeTab === 'buildings') return result.type === 'building';
        return true;
      });
      console.log('[Search] Filtered results:', filtered.length, 'items');
      setResults(filtered);
    }
  };

  // Enhanced debounced search with manual timeout management
  const debouncedSearch = useCallback((searchQuery: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 600); // Increased to 600ms for better UX
  }, [activeTab, initialDataLoaded, allData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Load initial data when component mounts
  useEffect(() => {
    loadAllData();
  }, []);

  // Handle search query changes
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      // Clear timeout when query is empty
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setIsSearching(false);
      // Show all data when query is empty
      if (initialDataLoaded && allData.length > 0) {
        filterResultsByTab(allData);
      }
      setSearched(false);
    }
  }, [query, debouncedSearch]);

  // Handle tab changes
  useEffect(() => {
    if (!query.trim() && initialDataLoaded && allData.length > 0) {
      // Filter from allData when changing tabs without search query
      console.log('[Search] Tab changed to:', activeTab);
      filterResultsByTab(allData);
    }
  }, [activeTab, initialDataLoaded, allData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    // After refresh, apply current tab filter if no search query
    if (!query.trim() && allData.length > 0) {
      filterResultsByTab(allData);
    }
    setRefreshing(false);
  };

  const handleResultPress = (item: SearchResult) => {
    Keyboard.dismiss();
    if (item.type === 'course') {
      navigation.navigate('PackDetail', { packId: item.id });
    } else if (item.type === 'building') {
      navigation.navigate('BuildingCourses', { buildingId: item.id, buildingName: item.title });
    } else if (item.type === 'teacher') {
      navigation.navigate('TeacherDetail', { teacherId: item.id });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'course': return 'musical-notes';
      case 'teacher': return 'person';
      case 'building': return 'business';
      default: return 'search';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'course': return theme.primary;
      case 'teacher': return theme.success;
      case 'building': return '#f59e0b';
      default: return theme.textSecondary;
    }
  };

  const getResultCount = (type: TabType) => {
    const sourceData = query.trim() ? results : allData; // Use appropriate data source
    if (type === 'all') return sourceData.length;
    return sourceData.filter(r => r.type === type.slice(0, -1)).length; // Remove 's' from plural
  };

  const styles = createStyles(theme, isDark);

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.resultItem} 
      onPress={() => handleResultPress(item)} 
      activeOpacity={0.7}
    >
      <View style={[styles.resultIcon, { backgroundColor: getIconColor(item.type) + '20' }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.resultImage} />
        ) : (
          <Ionicons name={getIcon(item.type) as any} size={COMPONENT_SIZES.icon.md} color={getIconColor(item.type)} />
        )}
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        {item.extra && <Text style={styles.resultExtra} numberOfLines={1}>{item.extra}</Text>}
      </View>
      <View style={[styles.resultType, { backgroundColor: getIconColor(item.type) + '15' }]}>
        <Text style={[styles.resultTypeText, { color: getIconColor(item.type) }]}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'courses', label: 'Courses', icon: 'musical-notes' },
    { key: 'teachers', label: 'Teachers', icon: 'people' },
    { key: 'buildings', label: 'Buildings', icon: 'business' }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={COMPONENT_SIZES.icon.md} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search courses, teachers, buildings..." 
            placeholderTextColor={theme.textMuted} 
            value={query} 
            onChangeText={(text) => {
              setQuery(text);
              if (text.trim()) {
                setIsSearching(true); // Show searching state immediately
              }
            }}
            autoFocus={false}
            returnKeyType="search" 
            onSubmitEditing={() => {
              // Clear timeout and search immediately on submit
              if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
              }
              performSearch(query);
            }}
          />
          {isSearching && query.trim() ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: SPACING.xs }} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={() => {
              setQuery('');
              setIsSearching(false);
              if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
              }
            }}>
              <Ionicons name="close-circle" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
          style={styles.tabsScroll}
        >
          {tabs.map((tab) => (
            <TouchableOpacity 
              key={tab.key} 
              style={[styles.tab, activeTab === tab.key && styles.tabActive]} 
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#fff' : theme.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {!loading && !isSearching && results.length > 0 && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                    {getResultCount(tab.key)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {(loading && !refreshing) || isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>
            {query.trim() ? 'Searching...' : 'Loading all data...'}
          </Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList 
          data={results} 
          keyExtractor={(item) => `${item.type}-${item.id}`} 
          renderItem={renderItem} 
          contentContainerStyle={styles.resultsList} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      ) : searched ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>
            Try different keywords or check the spelling
          </Text>
          <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
            <Text style={styles.clearButtonText}>Show all data</Text>
          </TouchableOpacity>
        </View>
      ) : !initialDataLoaded ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>Loading...</Text>
          <Text style={styles.emptyText}>Getting all available data</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="apps" size={64} color={theme.textMuted} />
          <Text style={styles.emptyTitle}>Browse everything</Text>
          <Text style={styles.emptyText}>
            {results.length} items available • Use search or filter by category
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    backgroundColor: theme.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: { 
    padding: SPACING.xs, 
    marginRight: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: theme.surfaceVariant,
  },
  searchInputContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surfaceVariant, 
    borderRadius: RADIUS.md, 
    paddingHorizontal: SPACING.sm, 
    height: COMPONENT_SIZES.input.height.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: theme.text, 
    marginLeft: SPACING.xs, 
    marginRight: SPACING.xs 
  },
  tabsContainer: { 
    backgroundColor: theme.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.border 
  },
  tabsScroll: {
    flexGrow: 0,
  },
  tabsScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tab: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm, 
    paddingVertical: SPACING.xs, 
    borderRadius: RADIUS.full, 
    marginRight: SPACING.xs, 
    backgroundColor: theme.surfaceVariant,
    minHeight: 36,
  },
  tabActive: { 
    backgroundColor: theme.primary 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: theme.textSecondary 
  },
  tabTextActive: { 
    color: '#fff' 
  },
  tabBadge: {
    marginLeft: SPACING.xxs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: theme.border,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
  },
  tabBadgeTextActive: {
    color: '#fff',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: { 
    marginTop: SPACING.sm, 
    fontSize: 14, 
    color: theme.textSecondary 
  },
  resultsList: { 
    padding: SPACING.md 
  },
  resultItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surface, 
    borderRadius: RADIUS.md, 
    padding: SPACING.sm, 
    marginBottom: SPACING.sm, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: isDark ? 0.3 : 0.05, 
    shadowRadius: 8, 
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: RADIUS.sm, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden' 
  },
  resultImage: { 
    width: 48, 
    height: 48, 
    borderRadius: RADIUS.sm 
  },
  resultContent: { 
    flex: 1, 
    marginLeft: SPACING.sm 
  },
  resultTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: theme.text 
  },
  resultSubtitle: { 
    fontSize: 13, 
    color: theme.textSecondary, 
    marginTop: 2 
  },
  resultExtra: { 
    fontSize: 12, 
    color: theme.textMuted, 
    marginTop: 2 
  },
  resultType: { 
    paddingHorizontal: SPACING.xs, 
    paddingVertical: 4, 
    borderRadius: RADIUS.xs,
  },
  resultTypeText: { 
    fontSize: 11, 
    fontWeight: '600' 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.xl 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: theme.text, 
    marginTop: SPACING.md 
  },
  emptyText: { 
    fontSize: 14, 
    color: theme.textSecondary, 
    marginTop: SPACING.xs, 
    textAlign: 'center' 
  },
  clearButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: theme.primary,
    borderRadius: RADIUS.sm,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SearchScreen;
