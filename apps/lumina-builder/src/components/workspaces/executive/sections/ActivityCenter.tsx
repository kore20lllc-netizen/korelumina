import { History } from "lucide-react";

import { ExecutiveSection } from "../shared/ExecutiveSection";
import { composeActivity } from "../state/executiveRecords";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

/* EW-3: wired. Composed from activation, learning, decision and canonical records. */
function when(at: number): string {
  const date = new Date(at);
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
}

export function ActivityCenter() {
  const office = useExecutiveOffice();
  const activity = composeActivity(office);
  const reading = office.operations.status === "loading" || office.learning.status === "loading";

  return (
    <ExecutiveSection
      id="executive-activity"
      icon={History}
      eyebrow="Activity Center"
      title="The operational history of KoreLumina"
      description="Missions, runtime events, deployments, approvals, knowledge promotion, recovery, and engineering decisions, newest first."
      wiring="live"
    >
      <ol className="relative grid gap-3 border-l border-cyan-300/20 pl-5">
        {activity.length === 0 ? (
          <li className="text-sm text-sky-300/60">{reading ? "Reading the operational history…" : "No activity recorded yet."}</li>
        ) : null}
        {activity.map((event) => (
          <li key={event.key} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border border-cyan-300/60 bg-slate-950" />
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">{when(event.at)} · {event.type}</div>
            <div className="mt-0.5 text-sm text-sky-100/85">{event.title}</div>
          </li>
        ))}
      </ol>
    </ExecutiveSection>
  );
}
