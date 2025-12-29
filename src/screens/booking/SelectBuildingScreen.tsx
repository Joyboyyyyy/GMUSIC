import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useBookingStore } from '../../store/bookingStore';
import api from '../../utils/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Building {
  id: string;
  name: string;
  isActive: boolean;
}

const SelectBuildingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setBuildingId } = useBookingStore();
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadBuildings();
  }, []);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await api.get('/api/buildings');
      
      // Filter only active buildings
      const activeBuildings = response.data.filter(
        (building: Building) => building.isActive === true
      );
      
      setBuildings(activeBuildings);
    } catch (err: any) {
      console.error('[SelectBuildingScreen] Error loading buildings:', err);
      setError(true);
      Alert.alert(
        'Error',
        'Failed to load buildings. Please try again later.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setBuildingId(buildingId);
  };

  const handleContinue = () => {
    if (selectedBuilding) {
      navigation.navigate('SelectSlot', {
        buildingId: selectedBuilding,
      });
    }
  };

  const renderBuilding = ({ item }: { item: Building }) => {
    const isSelected = selectedBuilding === item.id;

    return (
      <TouchableOpacity
        style={[styles.buildingCard, isSelected && styles.buildingCardSelected]}
        onPress={() => handleBuildingSelect(item.id)}
      >
        <View style={styles.buildingHeader}>
          <View style={styles.buildingIcon}>
            <Ionicons name="business-outline" size={24} color="#7c3aed" />
          </View>
          <View style={styles.buildingInfo}>
            <Text style={styles.buildingName}>{item.name}</Text>
          </View>
          {isSelected && (
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#7c3aed" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Building</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Choose a building to see available rooms
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.loadingText}>Loading buildings...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
              <Text style={styles.emptyTitle}>Failed to Load Buildings</Text>
              <Text style={styles.emptyText}>
                Please check your connection and try again.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadBuildings}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : buildings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No Rooms Available</Text>
              <Text style={styles.emptyText}>
                No rooms are currently available for booking.
              </Text>
            </View>
          ) : (
            <FlatList
              data={buildings}
              keyExtractor={(item) => item.id}
              renderItem={renderBuilding}
              scrollEnabled={false}
              contentContainerStyle={styles.buildingsList}
            />
          )}
        </View>
      </ScrollView>

      {selectedBuilding && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  buildingsList: {
    gap: 12,
  },
  buildingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buildingCardSelected: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf5ff',
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  buildingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  checkIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default SelectBuildingScreen;

