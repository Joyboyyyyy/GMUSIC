import React, { memo } from 'react';
import { FlatList, ListRenderItem, ViewStyle } from 'react-native';
import { SPACING } from '../theme/designSystem';

interface OptimizedHorizontalListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  itemWidth?: number;
  contentContainerStyle?: ViewStyle;
  showsHorizontalScrollIndicator?: boolean;
}

function OptimizedHorizontalListComponent<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth = 180,
  contentContainerStyle,
  showsHorizontalScrollIndicator = false,
}: OptimizedHorizontalListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={[
        { paddingHorizontal: SPACING.screenPadding },
        contentContainerStyle,
      ]}
      
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={50}
      initialNumToRender={3}
      windowSize={5}
      
      // Fixed item layout for better performance
      getItemLayout={(data, index) => ({
        length: itemWidth + SPACING.sm, // item width + margin
        offset: (itemWidth + SPACING.sm) * index,
        index,
      })}
      
      // Optimize memory usage
      decelerationRate="fast"
      snapToInterval={itemWidth + SPACING.sm}
      snapToAlignment="start"
    />
  );
}

// Memoize the component to prevent unnecessary re-renders
export const OptimizedHorizontalList = memo(OptimizedHorizontalListComponent) as <T>(
  props: OptimizedHorizontalListProps<T>
) => React.JSX.Element;