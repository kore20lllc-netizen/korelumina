import { History } from "lucide-react";

import { activity } from "../design/executiveDesignPreview";
import { ExecutiveSection } from "../shared/ExecutiveSection";

export function ActivityCenter() {
  return (
    <ExecutiveSection
      id="executive-activity"
      icon={History}
      eyebrow="Activity Center"
      title="The operational history of KoreLumina"
      description="Missions, runtime events, deployments, approvals, knowledge promotion, recovery, and engineering decisions, newest first."
    >
      <ol className="relative grid gap-3 border-l border-cyan-300/20 pl-5">
        {activity.map((event) => (
          <li key={`${event.at}-${event.title}`} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border border-cyan-300/60 bg-slate-950" />
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">{event.at} · {event.type}</div>
            <div className="mt-0.5 text-sm text-sky-100/85">{event.title}</div>
          </li>
        ))}
      </ol>
    </ExecutiveSection>
  );
}
