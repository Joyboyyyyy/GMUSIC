import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { mockPacks, categories } from '../data/mockData';
import { Category } from '../types';
import PackCard from '../components/PackCard';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BrowseScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredPacks =
    selectedCategory === 'All'
      ? mockPacks
      : mockPacks.filter((pack) => pack.category === selectedCategory);

  const handlePackPress = (packId: string) => {
    navigation.navigate('PackDetail', { packId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.subtitle}>Explore lessons by category</Text>
      </View>

      {/* Categories Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'All' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'All' && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryChip,
                selectedCategory === category.name && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.name && styles.categoryChipTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredPacks.length} {filteredPacks.length === 1 ? 'lesson' : 'lessons'} found
        </Text>
      </View>

      {/* Packs Grid */}
      <FlatList
        data={filteredPacks}
        keyExtractor={(item) => item.id}
        numColumns={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <PackCard pack={item} onPress={() => handlePackPress(item.id)} fullWidth={true} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
    minHeight: 40,
  },
  categoryChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  categoryIcon: {
    fontSize: 20,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  grid: {
    paddingHorizontal: 0,
    paddingBottom: 10,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: '100%',
    marginBottom: 16,
  },
});

export default BrowseScreen;

