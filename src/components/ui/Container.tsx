import React from 'react';
import { View, ViewStyle, ScrollView, ScrollViewProps } from 'react-native';
import { GRID, SPACING } from '../../theme/designSystem';
import { useThemeStore, getTheme } from '../../store/themeStore';

interface ContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  style?: ViewStyle;
  noPadding?: boolean;
  center?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  scroll = false,
  scrollProps,
  style,
  noPadding = false,
  center = false,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: noPadding ? 0 : GRID.margin,
    ...(center && { justifyContent: 'center', alignItems: 'center' }),
  };

  if (scroll) {
    return (
      <ScrollView
        style={[{ flex: 1, backgroundColor: theme.background }]}
        contentContainerStyle={[
          { paddingHorizontal: noPadding ? 0 : GRID.margin },
          style,
        ]}
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
};

export default Container;
