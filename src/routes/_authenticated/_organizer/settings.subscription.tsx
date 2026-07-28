import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionPage } from "@/features/subscription/components/SubscriptionPage";

export const Route = createFileRoute("/_authenticated/_organizer/settings/subscription")({
  head: () => ({ meta: [{ title: "Assinatura e limites · IS Arena" }] }),
  component: SubscriptionPage,
});
