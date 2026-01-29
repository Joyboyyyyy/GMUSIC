import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MusicPack } from '../types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { usePurchasedCoursesStore } from '../store/purchasedCoursesStore';
import BlinkitCartButton from './BlinkitCartButton';
import { OptimizedImage } from './OptimizedImage';
import { getEnhancedShadow, GRID, RADIUS } from '../theme/designSystem';

interface PackCardProps {
  pack: MusicPack;
  onPress: () => void;
  fullWidth?: boolean;
}

const PackCard: React.FC<PackCardProps> = ({ pack, onPress, fullWidth }) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const { hasPurchased, purchasedCourseIds } = usePurchasedCoursesStore();
  const isOwned = hasPurchased(pack.id);
  const styles = createStyles(theme, isDark, fullWidth);

  // Check if course has ended (if endDate is available in pack)
  const courseEndDate = (pack as any).endDate ? new Date((pack as any).endDate) : null;
  const isCourseEnded = courseEndDate && new Date() > courseEndDate;

  // Debug logging
  React.useEffect(() => {
    console.log(`[PackCard] 🎴 Rendering card for: ${pack.title}`);
    console.log(`[PackCard]   - Course ID: ${pack.id}`);
    console.log(`[PackCard]   - Is Owned: ${isOwned}`);
    console.log(`[PackCard]   - Course Ended: ${isCourseEnded}`);
    console.log(`[PackCard]   - All Purchased IDs:`, purchasedCourseIds);
  }, [pack.id, pack.title, isOwned, purchasedCourseIds, isCourseEnded]);

  return (
    <TouchableOpacity style={[styles.container, fullWidth && styles.fullWidthContainer]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <OptimizedImage 
          uri={pack.thumbnailUrl} 
          style={styles.thumbnail}
          width={180}
          height={120}
          fallbackIcon="musical-notes-outline"
        />
        {isOwned && isCourseEnded ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        ) : isOwned ? (
          <View style={styles.ownedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={styles.ownedText}>Owned</Text>
          </View>
        ) : (
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>₹{pack.price}</Text>
          </View>
        )}
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
          {!isOwned && !isCourseEnded && <BlinkitCartButton pack={pack} size="small" />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean, fullWidth?: boolean) => {
  // For grid layout (FlatList with numColumns), use flex: 1 to fill available space
  // For horizontal scroll, use fixed width from responsive dimensions
  const cardDimensions = GRID.getResponsiveCardDimensions();
  const gridGap = GRID.getGridGap();
  
  return StyleSheet.create({
    container: { 
      flex: fullWidth ? 1 : undefined,
      width: fullWidth ? undefined : cardDimensions.width,
      marginHorizontal: fullWidth ? 0 : cardDimensions.marginHorizontal,
      marginBottom: fullWidth ? 0 : 16,
      marginRight: fullWidth ? 0 : gridGap / 2,
      marginLeft: fullWidth ? 0 : gridGap / 2,
      backgroundColor: theme.card, 
      borderRadius: RADIUS.md, 
      overflow: 'hidden', 
      // Enhanced shadows for light mode
      ...getEnhancedShadow('md', isDark),
      // Fallback border for light mode when card background matches screen background
      ...((!isDark && theme.card === theme.background) && {
        borderWidth: 1,
        borderColor: (theme as any).cardBorder || theme.border,
      }),
    },
    fullWidthContainer: { flex: 1, width: undefined, marginHorizontal: 0, marginBottom: 0, marginRight: 0, marginLeft: 0 },
    imageContainer: { position: 'relative' },
    thumbnail: { width: '100%', height: 120, backgroundColor: theme.surfaceVariant },
    priceBadge: { 
      position: 'absolute', 
      bottom: 8, 
      right: 8, 
      backgroundColor: theme.card, 
      paddingHorizontal: 10, 
      paddingVertical: 4, 
      borderRadius: 6, 
      ...getEnhancedShadow('sm', isDark),
      // Enhanced border for light mode
      ...((!isDark) && {
        borderWidth: 1,
        borderColor: (theme as any).borderSubtle || theme.border,
      }),
    },
    priceText: { fontSize: 14, fontWeight: '700', color: theme.primary },
    ownedBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#22c55e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    ownedText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    completedBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    completedText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    content: { padding: 12 },
    title: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 4, lineHeight: 18 },
    teacher: { fontSize: 12, color: theme.textSecondary, marginBottom: 10 },
    footer: { gap: 10 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { fontSize: 12, fontWeight: '600', color: theme.text },
    badge: { 
      backgroundColor: theme.primaryLight, 
      paddingHorizontal: 8, 
      paddingVertical: 3, 
      borderRadius: 4,
      // Enhanced border for light mode
      ...((!isDark) && {
        borderWidth: 0.5,
        borderColor: (theme as any).borderSubtle || theme.border,
      }),
    },
    badgeText: { fontSize: 10, color: theme.primary, fontWeight: '600' },
  });
};

// Memoize to prevent unnecessary re-renders
export default memo(PackCard, (prevProps, nextProps) => {
  return prevProps.pack.id === nextProps.pack.id;
});
