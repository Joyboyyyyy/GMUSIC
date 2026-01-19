import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { Text } from '../components/ui';
import { SPACING, COMPONENT_SIZES, RADIUS } from '../theme/designSystem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AboutScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);

  const policyItems = [
    { 
      title: 'Terms of Use', 
      onPress: () => Alert.alert('Coming Soon', 'Terms of Use will be available soon') 
    },
    { 
      title: 'Privacy Policy', 
      onPress: () => Alert.alert('Coming Soon', 'Privacy Policy will be available soon') 
    },
    { 
      title: 'Cookie Policy', 
      onPress: () => Alert.alert('Coming Soon', 'Cookie Policy will be available soon') 
    },
    { 
      title: 'Refund Policy', 
      onPress: () => Alert.alert('Coming Soon', 'Refund Policy will be available soon') 
    },
  ];

  const styles = createStyles(theme, isDark);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={COMPONENT_SIZES.icon.md} color={theme.text} />
        </TouchableOpacity>
        <Text variant="h3" style={{ color: theme.text }}>About Gretex</Text>
        <View style={{ width: COMPONENT_SIZES.icon.md }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Policy Links */}
        <View style={styles.policySection}>
          {policyItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.policyItem}
              onPress={item.onPress}
            >
              <Text variant="body" style={{ color: theme.text }}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.screenPadding, 
    paddingVertical: SPACING.md,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: { 
    width: COMPONENT_SIZES.touchTarget.md, 
    height: COMPONENT_SIZES.touchTarget.md, 
    justifyContent: 'center', 
    alignItems: 'flex-start',
  },
  policySection: {
    paddingTop: SPACING.md,
  },
  policyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    minHeight: 56,
    backgroundColor: theme.background,
  },
});

export default AboutScreen;
