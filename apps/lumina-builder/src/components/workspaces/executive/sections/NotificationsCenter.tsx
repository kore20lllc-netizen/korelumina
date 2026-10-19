import { Bell } from "lucide-react";

import { ExecutiveSection, NotWiredButton, tonePill } from "../shared/ExecutiveSection";
import { composeNotifications } from "../state/executiveRecords";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

/* EW-3: wired. Classified from live records; acknowledging Critical is not wired yet. */
export function NotificationsCenter() {
  const notifications = composeNotifications(useExecutiveOffice());

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
            {notification.priority === "Critical" && notification.title !== "None" ? <NotWiredButton>Acknowledge</NotWiredButton> : null}
          </li>
        ))}
      </ul>
    </ExecutiveSection>
  );
}
