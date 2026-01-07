import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SPACING, GRID } from '../../theme/designSystem';

interface RowProps {
  children: React.ReactNode;
  gap?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: ViewStyle;
}

const Row: React.FC<RowProps> = ({
  children,
  gap = GRID.gutter,
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style,
}) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Row;
