import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buildingApi } from '../services/api.service';

export interface Building {
  id: string;
  name: string;
  city: string;
  state?: string;
  visibilityType: 'PUBLIC' | 'PRIVATE';
}

interface BuildingDropdownProps {
  value: Building | null;
  onChange: (building: Building | null) => void;
  placeholder?: string;
}

const BuildingDropdown: React.FC<BuildingDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select a building',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      // Use search endpoint with empty query to get all buildings (public + private)
      // This endpoint doesn't require authentication
      const response = await buildingApi.searchBuildings('', 100);
      if (response.success && response.data) {
        setBuildings(response.data);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      // Fallback to public buildings only
      try {
        const publicResponse = await buildingApi.getPublicBuildings();
        if (publicResponse.success && publicResponse.data) {
          setBuildings(publicResponse.data);
        }
      } catch (e) {
        console.error('Error fetching public buildings:', e);
      }
    }
    setLoading(false);
  };

  const handleSelect = (building: Building) => {
    onChange(building);
    setIsOpen(false);
  };

  const renderItem = ({ item }: { item: Building }) => (
    <TouchableOpacity
      style={[styles.item, value?.id === item.id && styles.itemSelected]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemIcon}>
          <Ionicons name="business" size={20} color="#7c3aed" />
        </View>
        <View style={styles.itemText}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemCity}>{item.city}{item.state ? `, ${item.state}` : ''}</Text>
        </View>
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
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        {value ? (
          <View style={styles.selectedContent}>
            <View style={styles.selectedIcon}>
              <Ionicons name="business" size={18} color="#7c3aed" />
            </View>
            <View style={styles.selectedText}>
              <Text style={styles.selectedName} numberOfLines={1}>{value.name}</Text>
              <Text style={styles.selectedCity}>{value.city}</Text>
            </View>
            <View style={[styles.badge, value.visibilityType === 'PUBLIC' ? styles.publicBadge : styles.privateBadge]}>
              <Text style={[styles.badgeText, value.visibilityType === 'PUBLIC' ? styles.publicText : styles.privateText]}>
                {value.visibilityType === 'PUBLIC' ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Building</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Loading buildings...</Text>
              </View>
            ) : buildings.length > 0 ? (
              <FlatList
                data={buildings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="business-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No buildings available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  selectedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedText: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedCity: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  itemSelected: {
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemCity: {
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default BuildingDropdown;
