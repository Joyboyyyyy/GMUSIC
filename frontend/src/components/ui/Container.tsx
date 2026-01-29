import React from 'react';
import { View, ViewStyle, ScrollView, ScrollViewProps } from 'react-native';
import { GRID, SPACING, LAYOUT } from '../../theme/designSystem';
import { useThemeStore, getTheme } from '../../store/themeStore';

interface ContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  style?: ViewStyle;
  noPadding?: boolean;
  center?: boolean;
  safeArea?: boolean;
}

const Container: React.FC<ContainerProps> = ({
  children,
  scroll = false,
  scrollProps,
  style,
  noPadding = false,
  center = false,
  safeArea = false,
}) => {
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: noPadding ? 0 : GRID.getMargin(),
    ...(center && LAYOUT.flex.center),
    ...(safeArea && LAYOUT.safeArea.container),
  };

  if (scroll) {
    return (
      <ScrollView
        style={[{ flex: 1, backgroundColor: theme.background }]}
        contentContainerStyle={[
          { 
            paddingHorizontal: noPadding ? 0 : GRID.getMargin(),
            ...(safeArea && { paddingTop: SPACING.getSafeAreaPadding('top') }),
          },
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
