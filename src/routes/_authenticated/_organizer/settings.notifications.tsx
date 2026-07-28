import { createFileRoute } from "@tanstack/react-router";
import { NotificationPreferencesPage } from "@/features/notifications/components/NotificationPreferencesPage";

export const Route = createFileRoute("/_authenticated/_organizer/settings/notifications")({
  component: NotificationPreferencesPage,
});
