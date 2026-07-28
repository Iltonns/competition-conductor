import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyNotificationPreferences,
  getMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
  saveMyNotificationPreferences,
} from "../api/notifications";
import type { NotificationPreference } from "../types/notification.types";

const inboxKey = ["notification-inbox"] as const;

export function useNotificationInbox() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: inboxKey });
  const query = useQuery({
    queryKey: inboxKey,
    queryFn: () => getMyNotifications(40),
    refetchInterval: 60_000,
  });
  return {
    ...query,
    markRead: useMutation({
      mutationFn: markMyNotificationRead,
      onSuccess: refresh,
    }),
    markAllRead: useMutation({
      mutationFn: markAllMyNotificationsRead,
      onSuccess: refresh,
    }),
  };
}

export function useNotificationPreferences(organizationId: string | null) {
  const queryClient = useQueryClient();
  const key = ["notification-preferences", organizationId] as const;
  const query = useQuery({
    queryKey: key,
    queryFn: () => getMyNotificationPreferences(organizationId!),
    enabled: Boolean(organizationId),
  });
  return {
    ...query,
    save: useMutation({
      mutationFn: (preferences: NotificationPreference[]) =>
        saveMyNotificationPreferences(organizationId!, preferences),
      onSuccess: (data) => queryClient.setQueryData(key, data),
    }),
  };
}
