export interface NotificationSettings {
  emailAlerts: boolean;
  medicationMissed: boolean;
  moodAlerts: boolean;
  helpRequested: boolean;
  inactivityAlerts: boolean;
  dailySummary: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailAlerts: true,
  medicationMissed: true,
  moodAlerts: true,
  helpRequested: true,
  inactivityAlerts: true,
  dailySummary: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

export function parseNotificationSettings(raw: unknown): NotificationSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_NOTIFICATION_SETTINGS;
  return { ...DEFAULT_NOTIFICATION_SETTINGS, ...(raw as Partial<NotificationSettings>) };
}

export interface ProfileSettings {
  id: string;
  full_name: string;
  role: "caregiver";
  email: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  notification_settings: NotificationSettings;
  created_at: string;
}

export interface ManagedElderSettings {
  elderId: string;
  profileId: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  notification_settings: NotificationSettings;
  hasAuthAccount: boolean;
}
