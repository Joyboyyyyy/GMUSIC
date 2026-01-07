import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import api from '../utils/api';
import { debounce } from '../utils/helpers';

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
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true); setSearched(true);
    try {
      const response = await api.get('/api/search', { params: { q: searchQuery.trim(), type: activeTab === 'all' ? undefined : activeTab } });
      if (response.data?.success && response.data?.data) setResults(response.data.data);
      else setResults([]);
    } catch (error) { console.error('[Search] Error:', error); setResults([]); }
    finally { setLoading(false); }
  };

  const debouncedSearch = useCallback(debounce((q: string) => performSearch(q), 400), [activeTab]);

  useEffect(() => {
    if (query.trim()) debouncedSearch(query);
    else { setResults([]); setSearched(false); }
  }, [query, activeTab]);

  const handleResultPress = (item: SearchResult) => {
    Keyboard.dismiss();
    if (item.type === 'course') navigation.navigate('PackDetail', { packId: item.id });
    else if (item.type === 'building') navigation.navigate('BuildingCourses', { buildingId: item.id, buildingName: item.title });
  };

  const getIcon = (type: string) => type === 'course' ? 'musical-notes' : type === 'teacher' ? 'person' : type === 'building' ? 'business' : 'search';
  const getIconColor = (type: string) => type === 'course' ? theme.primary : type === 'teacher' ? theme.success : type === 'building' ? '#f59e0b' : theme.textSecondary;

  const styles = createStyles(theme, isDark);

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleResultPress(item)} activeOpacity={0.7}>
      <View style={[styles.resultIcon, { backgroundColor: getIconColor(item.type) + '20' }]}>
        {item.image ? <Image source={{ uri: item.image }} style={styles.resultImage} /> : <Ionicons name={getIcon(item.type) as any} size={24} color={getIconColor(item.type)} />}
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>{item.subtitle}</Text>
        {item.extra && <Text style={styles.resultExtra} numberOfLines={1}>{item.extra}</Text>}
      </View>
      <View style={styles.resultType}><Text style={[styles.resultTypeText, { color: getIconColor(item.type) }]}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text></View>
    </TouchableOpacity>
  );

  const tabs: { key: TabType; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'courses', label: 'Courses' }, { key: 'teachers', label: 'Teachers' }, { key: 'buildings', label: 'Buildings' }];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search courses, teachers, buildings..." placeholderTextColor={theme.textMuted} value={query} onChangeText={setQuery} autoFocus returnKeyType="search" onSubmitEditing={() => performSearch(query)} />
          {query.length > 0 && <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color={theme.textMuted} /></TouchableOpacity>}
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /><Text style={styles.loadingText}>Searching...</Text></View>
      ) : results.length > 0 ? (
        <FlatList data={results} keyExtractor={(item) => `${item.type}-${item.id}`} renderItem={renderItem} contentContainerStyle={styles.resultsList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" />
      ) : searched ? (
        <View style={styles.emptyContainer}><Ionicons name="search-outline" size={64} color={theme.textMuted} /><Text style={styles.emptyTitle}>No results found</Text><Text style={styles.emptyText}>Try different keywords or check the spelling</Text></View>
      ) : (
        <View style={styles.emptyContainer}><Ionicons name="search" size={64} color={theme.textMuted} /><Text style={styles.emptyTitle}>Search for anything</Text><Text style={styles.emptyText}>Find courses, teachers, and buildings</Text></View>
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  backButton: { padding: 8, marginRight: 8 },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.inputBackground, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 16, color: theme.text, marginLeft: 8, marginRight: 8 },
  tabsContainer: { flexDirection: 'row', backgroundColor: theme.card, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: theme.surfaceVariant },
  tabActive: { backgroundColor: theme.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: theme.textSecondary },
  tabTextActive: { color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: theme.textSecondary },
  resultsList: { padding: 16 },
  resultItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 12, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  resultIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  resultImage: { width: 48, height: 48, borderRadius: 12 },
  resultContent: { flex: 1, marginLeft: 12 },
  resultTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  resultSubtitle: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  resultExtra: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  resultType: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: theme.surfaceVariant },
  resultTypeText: { fontSize: 11, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 16 },
  emptyText: { fontSize: 14, color: theme.textSecondary, marginTop: 8, textAlign: 'center' },
});

export default SearchScreen;
