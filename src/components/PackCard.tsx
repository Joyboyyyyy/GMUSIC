import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MusicPack } from '../types';
import { useThemeStore, getTheme } from '../store/themeStore';
import BlinkitCartButton from './BlinkitCartButton';

interface PackCardProps {
  pack: MusicPack;
  onPress: () => void;
  fullWidth?: boolean;
}

const PackCard: React.FC<PackCardProps> = ({ pack, onPress, fullWidth }) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme);

  return (
    <TouchableOpacity style={[styles.container, fullWidth && styles.fullWidthContainer]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: pack.thumbnailUrl }} style={styles.thumbnail} />
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>₹{pack.price}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{pack.title}</Text>
        <Text style={styles.teacher}>{pack.teacher.name}</Text>
        
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>{pack.rating}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pack.level}</Text>
            </View>
          </View>
          <BlinkitCartButton pack={pack} size="small" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
  container: { width: 200, marginRight: 12, backgroundColor: theme.card, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  fullWidthContainer: { width: '100%', marginRight: 0 },
  imageContainer: { position: 'relative' },
  thumbnail: { width: '100%', height: 120, backgroundColor: theme.surfaceVariant },
  priceBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: theme.card, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  priceText: { fontSize: 14, fontWeight: '700', color: theme.primary },
  content: { padding: 12 },
  title: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4, lineHeight: 18 },
  teacher: { fontSize: 12, color: theme.textSecondary, marginBottom: 10 },
  footer: { gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 12, fontWeight: '600', color: theme.text },
  badge: { backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 10, color: theme.primary, fontWeight: '600' },
});

export default PackCard;
