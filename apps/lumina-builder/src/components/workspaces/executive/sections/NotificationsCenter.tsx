import { Bell } from "lucide-react";

import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";
import { composeNotifications } from "../state/executiveRecords";
import { acknowledgeCritical, useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * EW-3: wired. Classified from live records.
 * MS-2026-0004 (E2.T2): the owner acknowledges Critical conditions; each
 * acknowledgement is a Runtime record of who saw which condition, and when.
 */
export function NotificationsCenter() {
  const office = useExecutiveOffice();
  const notifications = composeNotifications(office);

  return (
    <ExecutiveSection
      id="executive-notifications"
      icon={Bell}
      eyebrow="Notifications"
      title="Classified by priority"
      description="Critical, High, Normal, and Informational. Critical notifications always require acknowledgement."
      wiring="live"
    >
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {notifications.map((notification) => (
          <li key={notification.priority} className="grid gap-2 rounded-[16px] border border-cyan-300/15 bg-slate-950/40 p-4">
            <span className={`w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[notification.tone]}`}>{notification.priority}</span>
            <div className="text-sm font-semibold text-sky-50">{notification.title}</div>
            <div className="text-xs leading-5 text-sky-300/60">{notification.detail}</div>
            {notification.unacknowledged?.length ? (
              <button
                type="button"
                disabled={office.acknowledging}
                onClick={() => void acknowledgeCritical(notification.unacknowledged ?? [])}
                className={`w-fit rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.error}`}
              >
                {office.acknowledging ? "Recording…" : "Acknowledge"}
              </button>
            ) : null}
            {notification.priority === "Critical" && office.acknowledgeError ? (
              <div className="rounded-[12px] border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">Not recorded: {office.acknowledgeError}</div>
            ) : null}
          </li>
        ))}
      </ul>
    </ExecutiveSection>
  );
}
