import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ViewStyle } from 'react-native';

export const useSafeAreaStyle = () => {
  const insets = useSafeAreaInsets();
  
  return {
    insets,
    containerStyle: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    } as ViewStyle,
    topPaddingStyle: {
      paddingTop: insets.top,
    } as ViewStyle,
    bottomPaddingStyle: {
      paddingBottom: insets.bottom,
    } as ViewStyle,
  };
};
