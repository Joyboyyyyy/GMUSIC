import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl } from '../config/api';

export interface Building {
  id: string;
  name: string;
  city: string;
  address: string;
  visibilityType: 'PUBLIC' | 'PRIVATE';
  courseCount?: number;
}

interface BuildingSearchInputProps {
  value: Building | null;
  onChange: (building: Building | null) => void;
  placeholder?: string;
}

const BuildingSearchInput: React.FC<BuildingSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search your building...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBuildings = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl(`api/buildings/search?q=${encodeURIComponent(searchQuery)}`));
      const data = await response.json();

      if (data.success && data.data) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('[BuildingSearch] Error:', err);
      setError('Unable to search buildings');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchBuildings(query);
        setShowDropdown(true);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchBuildings]);

  const handleSelect = (building: Building) => {
    onChange(building);
    setQuery('');
    setShowDropdown(false);
    setResults([]);
  };

  const handleClear = () => {
    onChange(null);
    setQuery('');
    setResults([]);
  };

  // If a building is selected, show it
  if (value) {
    return (
      <View style={styles.selectedContainer}>
        <View style={styles.selectedContent}>
          <Ionicons name="business" size={20} color="#7c3aed" />
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{value.name}</Text>
            <Text style={styles.selectedCity}>{value.city}</Text>
          </View>
          <View style={[styles.badge, value.visibilityType === 'PUBLIC' ? styles.publicBadge : styles.privateBadge]}>
            <Ionicons
              name={value.visibilityType === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
              size={12}
              color={value.visibilityType === 'PUBLIC' ? '#10b981' : '#f59e0b'}
            />
            <Text style={[styles.badgeText, value.visibilityType === 'PUBLIC' ? styles.publicText : styles.privateText]}>
              {value.visibilityType === 'PUBLIC' ? 'Public' : 'Private'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
          <Ionicons name="close-circle" size={22} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
        />
        {isLoading && <ActivityIndicator size="small" color="#7c3aed" style={styles.loader} />}
      </View>

      {showDropdown && (
        <View style={styles.dropdown}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : results.length === 0 && query.length >= 2 && !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={24} color="#9ca3af" />
              <Text style={styles.emptyText}>No buildings found</Text>
            </View>
          ) : (
            <ScrollView style={styles.resultsList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {results.map((item) => (
                <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => handleSelect(item)}>
                  <View style={styles.resultIcon}>
                    <Ionicons name="business" size={20} color="#7c3aed" />
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultCity}>{item.city}</Text>
                  </View>
                  <View style={[styles.badge, item.visibilityType === 'PUBLIC' ? styles.publicBadge : styles.privateBadge]}>
                    <Ionicons
                      name={item.visibilityType === 'PUBLIC' ? 'globe-outline' : 'lock-closed-outline'}
                      size={10}
                      color={item.visibilityType === 'PUBLIC' ? '#10b981' : '#f59e0b'}
                    />
                    <Text style={[styles.badgeText, item.visibilityType === 'PUBLIC' ? styles.publicText : styles.privateText]}>
                      {item.visibilityType === 'PUBLIC' ? 'Public' : 'Private'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  loader: {
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  resultsList: {
    maxHeight: 250,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  resultCity: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  publicBadge: {
    backgroundColor: '#d1fae5',
  },
  privateBadge: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  publicText: {
    color: '#10b981',
  },
  privateText: {
    color: '#f59e0b',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  selectedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedCity: {
    fontSize: 13,
    color: '#6b7280',
  },
  clearBtn: {
    padding: 4,
  },
});

export default BuildingSearchInput;
