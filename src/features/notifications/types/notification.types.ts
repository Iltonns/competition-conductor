export const NOTIFICATION_TYPES = [
  "organization_invitation",
  "registration_submitted",
  "registration_review_requested",
  "match_changed",
  "referee_assigned",
  "publication_published",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface InternalNotification {
  id: string;
  organization_id: string;
  championship_id: string | null;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInbox {
  unread_count: number;
  items: InternalNotification[];
}

export interface NotificationPreference {
  notification_type: NotificationType;
  internal_enabled: boolean;
  email_enabled: boolean;
}

export interface NotificationPreferencesContext {
  organization_id: string;
  email_available: boolean;
  preferences: NotificationPreference[];
}
