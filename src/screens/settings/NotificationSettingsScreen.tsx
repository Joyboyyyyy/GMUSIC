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

  const frequencyOptions: Array<'daily' | 'weekly' | 'none'> = ['daily', 'weekly', 'none'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={24} color="#7c3aed" />
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
              trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
              thumbColor={allowNotifications ? '#7c3aed' : '#f3f4f6'}
            />
          </View>
        </View>

        {/* OS Permission Status */}
        {allowNotifications && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#7c3aed" />
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
                <Ionicons name="book" size={22} color="#7c3aed" />
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
                trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                thumbColor={courseUpdates ? '#7c3aed' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="alarm" size={22} color="#7c3aed" />
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
                trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                thumbColor={reminders ? '#7c3aed' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="pricetag" size={22} color="#7c3aed" />
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
                trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                thumbColor={offers ? '#7c3aed' : '#f3f4f6'}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <Ionicons name="chatbubble" size={22} color="#7c3aed" />
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
                trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                thumbColor={messages ? '#7c3aed' : '#f3f4f6'}
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
                <Ionicons name="moon" size={22} color="#7c3aed" />
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
                trackColor={{ false: '#e5e7eb', true: '#c4b5fd' }}
                thumbColor={quietHours.enabled ? '#7c3aed' : '#f3f4f6'}
              />
            </View>

            {quietHours.enabled && (
              <View style={styles.timeContainer}>
                <View style={styles.timeCard}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <TouchableOpacity style={styles.timePicker}>
                    <Ionicons name="time" size={18} color="#7c3aed" />
                    <Text style={styles.timeText}>{quietHours.start}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeHint}>Notifications pause</Text>
                </View>

                <View style={styles.timeCard}>
                  <Text style={styles.timeLabel}>End</Text>
                  <TouchableOpacity style={styles.timePicker}>
                    <Ionicons name="time" size={18} color="#7c3aed" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: '#1f2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f3e8ff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5b21b6',
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
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeHint: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

export default NotificationSettingsScreen;

