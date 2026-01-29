import { create } from 'zustand';

interface QuietHours {
  enabled: boolean;
  start: string; // "22:00"
  end: string;   // "07:00"
}

interface NotificationState {
  allowNotifications: boolean;
  courseUpdates: boolean;
  reminders: boolean;
  offers: boolean;
  messages: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'none';
  quietHours: QuietHours;
  toggle: (key: string) => void;
  setFrequency: (value: 'daily' | 'weekly' | 'none') => void;
  setQuietHours: (data: Partial<QuietHours>) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  allowNotifications: true,
  courseUpdates: true,
  reminders: true,
  offers: false,
  messages: true,
  reminderFrequency: 'daily',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },

  toggle: (key: string) => {
    set((state) => ({
      ...state,
      [key]: !(state as any)[key],
    }));
  },

  setFrequency: (value: 'daily' | 'weekly' | 'none') => {
    set({ reminderFrequency: value });
  },

  setQuietHours: (data: Partial<QuietHours>) => {
    set((state) => ({
      quietHours: { ...state.quietHours, ...data },
    }));
  },
}));

