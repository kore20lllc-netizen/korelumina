import { readJSON, writeJSON, subscribe, uid } from "@/lib/persistence";
import type { Notification } from "@/lib/mockData";

const NS = "notifications";

function load(): Notification[] { return readJSON<Notification[]>(NS, "all", []); }
function save(n: Notification[]) { writeJSON(NS, "all", n); }

function timeLabel(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return "Just now";
  if (d < 3600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return "Yesterday";
}

export const notificationService = {
  list(): Notification[] {
    return load().map((n) => ({ ...n, time: typeof n.time === "string" && /^\d+$/.test(n.time) ? timeLabel(Number(n.time)) : n.time }));
  },
  unreadCount(): number { return load().filter((n) => n.unread).length; },
  push(input: Omit<Notification, "id" | "time" | "unread"> & { unread?: boolean }): Notification {
    const n: Notification = { id: uid("ntf"), time: String(Date.now()), unread: input.unread ?? true, ...input };
    save([n, ...load()].slice(0, 100));
    return n;
  },
  markAllRead(): void { save(load().map((n) => ({ ...n, unread: false }))); },
  clear(): void { save([]); },
  onChange(cb: () => void) { return subscribe(NS, cb); },
};