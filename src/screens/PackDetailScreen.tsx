import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { mockPacks, mockTracks } from '../data/mockData';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import { useCartStore, CartItem } from '../store/cartStore';
import { requireAuth } from '../utils/auth';

type PackDetailScreenRouteProp = RouteProp<RootStackParamList, 'PackDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PackDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PackDetailScreenRouteProp>();
  const { packId } = route.params;
  const { isAuthenticated } = useAuthStore();
  const { hasPack } = useLibraryStore();
  const { hasPurchased } = usePurchasedCoursesStore();
  const { addToCart } = useCartStore();

  const pack = mockPacks.find((p) => p.id === packId);
  const tracks = mockTracks[packId] || [];
  // Check both stores for backward compatibility
  const isPurchased = hasPurchased(packId) || hasPack(packId);

  if (!pack) {
    return (
      <View style={styles.container}>
        <Text>Pack not found</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      id: `${pack.id}-${Date.now()}`,
      packId: pack.id,
      title: pack.title,
      price: pack.price,
      thumbnailUrl: pack.thumbnailUrl,
      teacher: {
        name: pack.teacher.name,
      },
    };
    addToCart(cartItem);
    Alert.alert('Added to Cart', `${pack.title} has been added to your cart`);
  };

  const handleBuyNow = () => {
    requireAuth(
      isAuthenticated,
      navigation,
      () => {
        navigation.navigate('Checkout', { pack });
      },
      'Please login to purchase this lesson pack',
      { name: 'Checkout', params: { pack } }
    );
  };

  const handleTrackPress = (trackId: string) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    // Preview tracks are always accessible
    if (track.isPreview) {
      navigation.navigate('TrackPlayer', { packId, trackId });
      return;
    }

    // Purchased tracks are accessible to authenticated users
    if (isPurchased) {
      navigation.navigate('TrackPlayer', { packId, trackId });
      return;
    }

    // Non-preview, non-purchased tracks require authentication
    requireAuth(
      isAuthenticated,
      navigation,
      () => {
        // After login, user can purchase or access if already purchased
        Alert.alert(
          'Premium Content',
          'Purchase this pack to access all lessons',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Buy Now',
              onPress: () => navigation.navigate('Checkout', { pack }),
            },
          ]
        );
      },
      'Please login to access this lesson'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image source={{ uri: pack.thumbnailUrl }} style={styles.heroImage} />

        <View style={styles.content}>
          {/* Pack Info */}
          <View style={styles.header}>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pack.level}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
                <Text style={[styles.badgeText, { color: '#1e40af' }]}>{pack.category}</Text>
              </View>
            </View>
            <Text style={styles.title}>{pack.title}</Text>
            <Text style={styles.description}>{pack.description}</Text>
          </View>

          {/* Teacher Info */}
          <TouchableOpacity style={styles.teacherSection}>
            <Image
              source={{ uri: pack.teacher.avatarUrl }}
              style={styles.teacherAvatar}
            />
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherLabel}>Instructor</Text>
              <Text style={styles.teacherName}>{pack.teacher.name}</Text>
              <View style={styles.teacherStats}>
                <View style={styles.stat}>
                  <Ionicons name="star" size={14} color="#f59e0b" />
                  <Text style={styles.statText}>{pack.teacher.rating}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="people" size={14} color="#6b7280" />
                  <Text style={styles.statText}>
                    {pack.teacher.students.toLocaleString()} students
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="play-circle" size={24} color="#7c3aed" />
              <Text style={styles.statValue}>{pack.tracksCount}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={24} color="#7c3aed" />
              <Text style={styles.statValue}>{Math.floor(pack.duration / 60)}h</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#7c3aed" />
              <Text style={styles.statValue}>
                {(pack.studentsCount / 1000).toFixed(1)}k
              </Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#7c3aed" />
              <Text style={styles.statValue}>{pack.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Curriculum */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Course Content</Text>
            <View style={styles.tracksList}>
              {tracks.map((track, index) => (
                <TouchableOpacity
                  key={track.id}
                  style={styles.trackItem}
                  onPress={() => handleTrackPress(track.id)}
                >
                  <View style={styles.trackLeft}>
                    <View style={styles.trackNumber}>
                      <Text style={styles.trackNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.trackInfo}>
                      <Text style={styles.trackTitle}>{track.title}</Text>
                      {track.description && (
                        <Text style={styles.trackDescription} numberOfLines={1}>
                          {track.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.trackRight}>
                    {track.isPreview && (
                      <View style={styles.previewBadge}>
                        <Text style={styles.previewText}>Preview</Text>
                      </View>
                    )}
                    <Text style={styles.trackDuration}>{track.duration}min</Text>
                    {(track.isPreview || isPurchased) ? (
                      <Ionicons name="play-circle" size={24} color="#7c3aed" />
                    ) : (
                      <Ionicons name="lock-closed" size={20} color="#9ca3af" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      {!isPurchased && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.price}>₹{pack.price}</Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={20} color="#7c3aed" />
              <Text style={styles.addToCartButtonText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
              <Text style={styles.buyButtonText}>Buy Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isPurchased && (
        <View style={styles.bottomBarPurchased}>
          <View style={styles.purchasedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={styles.purchasedText}>Purchased</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroImage: {
    width: '100%',
    height: 380,
    backgroundColor: '#e5e7eb',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  teacherSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  teacherInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  teacherLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  teacherStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  tracksList: {
    gap: 12,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  trackLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  trackNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  trackDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  trackRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  previewBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  trackDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
  bottomBar: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#7c3aed',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  bottomBarPurchased: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  buyButton: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  purchasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  purchasedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
});

export default PackDetailScreen;

