import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useThemeStore, getTheme } from '../../store/themeStore';
import ProtectedScreen from '../../components/ProtectedScreen';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BookRoomScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  const handleChooseDateTime = () => navigation.navigate('SelectBuilding');

  return (
    <ProtectedScreen requireAuth={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Jamming Room</Text>
            <Text style={styles.subtitle}>Reserve a jamming room for your music sessions</Text>
          </View>

          <View style={styles.featuresContainer}>
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={handleChooseDateTime}
              activeOpacity={0.7}
            >
              <View style={styles.featureIcon}>
                <Ionicons name="calendar-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.featureTitle}>Choose Date & Time</Text>
              <Text style={styles.featureText}>Select your preferred date and available time slot</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color={theme.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedScreen>
  );
};

const createStyles = (theme: ReturnType<typeof getTheme>, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.textSecondary, lineHeight: 24 },
  featuresContainer: { paddingHorizontal: 20, marginBottom: 32 },
  featureCard: { 
    backgroundColor: theme.card, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  featureIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  featureTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  featureText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  arrowContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  },
});

export default BookRoomScreen;
