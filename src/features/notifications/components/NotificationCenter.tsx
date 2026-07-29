import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNotificationInbox } from "../hooks/useNotifications";
import { safeNotificationPath } from "../utils/notification-display";

export function NotificationCenter() {
  const inbox = useNotificationInbox();
  const unread = inbox.data?.unread_count ?? 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-[#f0f2f5] text-[#1c2733] transition hover:bg-white"
          aria-label={unread ? `Notificações: ${unread} não lidas` : "Notificações"}
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-neon px-1 text-[9px] font-bold text-neon-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle>Notificações</SheetTitle>
              <SheetDescription>Atualizações internas das suas organizações.</SheetDescription>
            </div>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                disabled={inbox.markAllRead.isPending}
                onClick={() => inbox.markAllRead.mutate()}
              >
                <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          {inbox.isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando...
            </div>
          ) : inbox.isError ? (
            <p className="p-6 text-sm text-destructive">
              Não foi possível carregar as notificações.
            </p>
          ) : !inbox.data?.items.length ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="mt-1 text-xs text-muted-foreground">
                As atualizações relevantes aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {inbox.data.items.map((notification) => {
                const path = safeNotificationPath(notification.action_url);
                return (
                  <button
                    key={notification.id}
                    type="button"
                    className={cn(
                      "w-full px-5 py-4 text-left transition hover:bg-muted/50",
                      !notification.read_at && "bg-primary/[0.045]",
                    )}
                    onClick={async () => {
                      if (!notification.read_at) {
                        await inbox.markRead.mutateAsync(notification.id);
                      }
                      if (path) window.location.assign(path);
                    }}
                  >
                    <div className="flex gap-3">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          notification.read_at ? "bg-muted" : "bg-neon",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{notification.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                          {notification.message}
                        </span>
                        <span className="mt-2 block text-[10px] text-muted-foreground">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
