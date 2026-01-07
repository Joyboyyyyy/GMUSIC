import React from 'react';
import { View } from 'react-native';
import { SPACING } from '../../theme/designSystem';

type SpacerSize = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';

interface SpacerProps {
  size?: SpacerSize;
  horizontal?: boolean;
  custom?: number;
}

const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  horizontal = false,
  custom,
}) => {
  const space = custom ?? SPACING[size];

  return (
    <View
      style={
        horizontal
          ? { width: space }
          : { height: space }
      }
    />
  );
};

export default Spacer;
