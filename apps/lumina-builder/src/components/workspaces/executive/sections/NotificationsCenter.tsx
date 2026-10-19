import { Bell } from "lucide-react";

import { notifications } from "../design/executiveDesignPreview";
import { ExecutiveSection, NotWiredButton, tonePill } from "../shared/ExecutiveSection";

export function NotificationsCenter() {
  return (
    <ExecutiveSection
      id="executive-notifications"
      icon={Bell}
      eyebrow="Notifications"
      title="Classified by priority"
      description="Critical, High, Normal, and Informational. Critical notifications always require acknowledgement."
    >
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {notifications.map((notification) => (
          <li key={notification.priority} className="grid gap-2 rounded-[16px] border border-cyan-300/15 bg-slate-950/40 p-4">
            <span className={`w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[notification.tone]}`}>{notification.priority}</span>
            <div className="text-sm font-semibold text-sky-50">{notification.title}</div>
            <div className="text-xs leading-5 text-sky-300/60">{notification.detail}</div>
            {notification.priority === "Critical" ? <NotWiredButton>Acknowledge</NotWiredButton> : null}
          </li>
        ))}
      </ul>
    </ExecutiveSection>
  );
}
