import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useThemeStore, getTheme } from '../store/themeStore';
import { Text } from '../components/ui';
import { SPACING, COMPONENT_SIZES } from '../theme/designSystem';

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

  const styles = createStyles(theme);

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

        {/* App Store Link Section */}
        <View style={styles.storeSection}>
          <Text variant="caption" style={{ color: theme.textMuted, marginBottom: SPACING.md }}>
            Gretex in the Play Store
          </Text>
          <TouchableOpacity 
            style={styles.storeItem}
            onPress={() => Alert.alert('Coming Soon', 'Play Store link will be available soon')}
          >
            <Text variant="body" style={{ color: theme.text }}>Gretex - Music Learning</Text>
            <Ionicons name="chevron-forward" size={COMPONENT_SIZES.icon.sm} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text variant="body" style={{ color: theme.textSecondary, lineHeight: 24 }}>
            Gretex is a music learning platform featuring expert instructors and comprehensive courses. 
            Take courses in instruments like Guitar, Piano, Drums, and Vocals with professional guidance. 
            Learn from certified teachers, book flexible time slots, and earn Trinity College London certifications. 
            Join thousands of students who are mastering new skills, advancing their musical journey, and 
            exploring their passion for music on Gretex.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>) => StyleSheet.create({
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
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  storeSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  descriptionSection: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
});

export default AboutScreen;
