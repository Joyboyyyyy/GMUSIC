import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore, getTheme, Theme } from '../../store/themeStore';

const NotificationSettingsScreen = () => {
  const {
    allowNotifications,
    courseUpdates,
    reminders,
    offers,
    messages,
    reminderFrequency,
    quietHours,
    toggle,
    setFrequency,
    setQuietHours,
  } = useNotificationStore();
  const { isDark } = useThemeStore();
  const theme = getTheme(isDark);
  const styles = createStyles(theme, isDark);

  const frequencyOptions: Array<'daily' | 'weekly' | 'none'> = ['daily', 'weekly', 'none'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color={theme.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Allow Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  Enable to receive updates and reminders
                </Text>
              </View>
            </View>
            <Switch
              value={allowNotifications}
              onValueChange={() => toggle('allowNotifications')}
              trackColor={{ false: theme.border, true: '#c4b5fd' }}
              thumbColor={allowNotifications ? theme.primary : theme.surfaceVariant}
            />
          </View>
        </View>

        {/* OS Permission Status */}
        {allowNotifications && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={styles.infoText}>
              To receive push notifications, ensure they're enabled in your device settings.
            </Text>
          </View>
        )}

        {/* Notification Types */}
        {allowNotifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="book" size={22} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Course Updates</Text>
                  <Text style={styles.settingSubtitle}>
                    New lessons and content
                  </Text>
                </View>
              </View>
              <Switch
                value={courseUpdates}
                onValueChange={() => toggle('courseUpdates')}
                trackColor={{ false: theme.border, true: '#c4b5fd' }}
                thumbColor={courseUpdates ? theme.primary : theme.surfaceVariant}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="alarm" size={22} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Practice Reminders</Text>
                  <Text style={styles.settingSubtitle}>
                    Daily or weekly practice reminders
                  </Text>
                </View>
              </View>
              <Switch
                value={reminders}
                onValueChange={() => toggle('reminders')}
                trackColor={{ false: theme.border, true: '#c4b5fd' }}
                thumbColor={reminders ? theme.primary : theme.surfaceVariant}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="pricetag" size={22} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Special Offers</Text>
                  <Text style={styles.settingSubtitle}>
                    Discounts and promotions
                  </Text>
                </View>
              </View>
              <Switch
                value={offers}
                onValueChange={() => toggle('offers')}
                trackColor={{ false: theme.border, true: '#c4b5fd' }}
                thumbColor={offers ? theme.primary : theme.surfaceVariant}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="chatbubble" size={22} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Messages</Text>
                  <Text style={styles.settingSubtitle}>
                    Direct messages from instructors
                  </Text>
                </View>
              </View>
              <Switch
                value={messages}
                onValueChange={() => toggle('messages')}
                trackColor={{ false: theme.border, true: '#c4b5fd' }}
                thumbColor={messages ? theme.primary : theme.surfaceVariant}
              />
            </View>
          </View>
        )}


        {/* Quiet Hours */}
        {allowNotifications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon" size={22} color={theme.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Enable Quiet Hours</Text>
                  <Text style={styles.settingSubtitle}>
                    Mute notifications during specified hours
                  </Text>
                </View>
              </View>
              <Switch
                value={quietHours.enabled}
                onValueChange={(value) => setQuietHours({ enabled: value })}
                trackColor={{ false: theme.border, true: '#c4b5fd' }}
                thumbColor={quietHours.enabled ? theme.primary : theme.surfaceVariant}
              />
            </View>

            {quietHours.enabled && (
              <View style={styles.timeContainer}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <TouchableOpacity style={styles.timePicker}>
                    <Ionicons name="time" size={18} color={theme.primary} />
                    <Text style={styles.timeText}>{quietHours.start}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeHint}>Notifications pause</Text>
                </View>

                <View style={styles.timeCard}>
                  <Text style={styles.timeLabel}>End</Text>
                  <TouchableOpacity style={styles.timePicker}>
                    <Ionicons name="time" size={18} color={theme.primary} />
                    <Text style={styles.timeText}>{quietHours.end}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeHint}>Notifications resume</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.primary,
    lineHeight: 18,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  frequencyTextActive: {
    color: '#fff',
  },
  timeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  timeHint: {
    fontSize: 11,
    color: theme.textMuted,
  },
});

export default NotificationSettingsScreen;

