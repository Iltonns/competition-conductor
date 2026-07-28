import { supabase } from "@/integrations/supabase/client";
import type {
  NotificationInbox,
  NotificationPreference,
  NotificationPreferencesContext,
} from "../types/notification.types";

async function rpc<T>(name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(name as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function getMyNotifications(limit = 30) {
  return rpc<NotificationInbox>("get_my_notifications", { p_limit: limit });
}

export function markMyNotificationRead(notificationId: string) {
  return rpc<void>("mark_my_notification_read", { p_notification_id: notificationId });
}

export function markAllMyNotificationsRead() {
  return rpc<number>("mark_all_my_notifications_read");
}

export function getMyNotificationPreferences(organizationId: string) {
  return rpc<NotificationPreferencesContext>("get_my_notification_preferences", {
    p_organization_id: organizationId,
  });
}

export function saveMyNotificationPreferences(
  organizationId: string,
  preferences: NotificationPreference[],
) {
  return rpc<NotificationPreferencesContext>("save_my_notification_preferences", {
    p_organization_id: organizationId,
    p_preferences: preferences,
  });
}
