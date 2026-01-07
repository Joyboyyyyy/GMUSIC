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

  const handleGetStarted = () => navigation.navigate('SelectBuilding');

  return (
    <ProtectedScreen requireAuth={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Book a Room</Text>
            <Text style={styles.subtitle}>Reserve a practice room for your music sessions</Text>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="calendar-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.featureTitle}>Choose Date & Time</Text>
              <Text style={styles.featureText}>Select your preferred date and available time slot</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="location-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.featureTitle}>Select Building</Text>
              <Text style={styles.featureText}>Choose from available practice rooms</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="checkmark-circle-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.featureTitle}>Instant Confirmation</Text>
              <Text style={styles.featureText}>Get immediate booking confirmation</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={isDark ? '#fbbf24' : '#6b7280'} />
              <Text style={styles.infoText}>You can browse available rooms without logging in. Login is required only when confirming your booking.</Text>
            </View>
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
  featureCard: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  featureIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  featureTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  featureText: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  buttonContainer: { paddingHorizontal: 20, marginBottom: 24 },
  primaryButton: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  infoContainer: { paddingHorizontal: 20, marginBottom: 32 },
  infoRow: { flexDirection: 'row', backgroundColor: isDark ? '#422006' : '#fef3c7', borderRadius: 12, padding: 16, gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: isDark ? '#fcd34d' : '#92400e', lineHeight: 18 },
});

export default BookRoomScreen;
