import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

export function NotificationsCenter() {
  const { notifications, markAllNotificationsRead, notificationsOpen, setNotificationsOpen } = useWorkspace();
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_6px_hsl(255_90%_65%/0.9)]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="glass-strong border-border w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="text-[12px] font-medium">Notifications</div>
          <button
            onClick={markAllNotificationsRead}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <CheckCheck className="h-3 w-3" /> Mark all read
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-[12px] text-muted-foreground">All caught up.</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={cn("px-4 py-3 border-b border-border/60 last:border-0 flex gap-3", n.unread && "bg-surface-1/50")}>
                <span
                  className={cn(
                    "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                    n.kind === "success" ? "bg-cyan" : n.kind === "warn" ? "bg-gold" : "bg-brand",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}