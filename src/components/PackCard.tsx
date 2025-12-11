import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MusicPack } from '../types';
import { useCartStore, CartItem } from '../store/cartStore';

interface PackCardProps {
  pack: MusicPack;
  onPress: () => void;
  fullWidth?: boolean;
}

const PackCard: React.FC<PackCardProps> = ({ pack, onPress, fullWidth }) => {
  const { addToCart } = useCartStore();

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
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

  return (
    <TouchableOpacity style={[styles.container, fullWidth && styles.fullWidthContainer]} onPress={onPress}>
      <Image source={{ uri: pack.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {pack.title}
        </Text>
        <Text style={styles.teacher}>{pack.teacher.name}</Text>
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.ratingText}>{pack.rating}</Text>
            <Text style={styles.students}>({pack.studentsCount.toLocaleString()})</Text>
          </View>
          <Text style={styles.price}>₹{pack.price}</Text>
        </View>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pack.level}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pack.tracksCount} lessons</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={14} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  fullWidthContainer: {
    width: '100%',
    marginRight: 0,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  teacher: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 4,
  },
  students: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  addToCartButton: {
    flexDirection: 'row',
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PackCard;

