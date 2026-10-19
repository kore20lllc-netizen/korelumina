import { Rocket } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import { missionLifecycle, missions } from "../design/executiveDesignPreview";
import { ExecutiveSection, tonePill, toneText } from "../shared/ExecutiveSection";

export function MissionCenter() {
  return (
    <ExecutiveSection
      id="executive-missions"
      icon={Rocket}
      eyebrow="Mission Center"
      title="Every objective is a mission"
      description="Vision → Objective → Mission → Execution → Validation → Knowledge. Each mission shows its progress, agents, approvals, risks, recovery anchor, and the knowledge it produced."
    >
      <div className="grid gap-4">
        {missions.map((mission) => (
          <LuminaFlagshipCard key={mission.id} as="article" className="rounded-[20px] p-4">
            <div className="relative z-10 grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">{mission.id}</div>
                  <div className={`mt-1 text-lg font-semibold ${toneText[mission.tone]}`}>{mission.title}</div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[mission.tone]}`}>
                  {mission.progress}% · {mission.stage}
                </span>
              </div>

              <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" aria-label={`${mission.title} lifecycle`}>
                {missionLifecycle.map((stage, index) => {
                  const reached = index <= missionLifecycle.indexOf(mission.stage as (typeof missionLifecycle)[number]);
                  return (
                    <li key={stage} className={`rounded-full border px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] ${reached ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-slate-600/40 text-slate-400"}`}>
                      {stage}
                    </li>
                  );
                })}
              </ol>

              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div><dt className="text-sky-300/60">Agents</dt><dd className="mt-0.5 text-sky-100/80">{mission.agents.join(", ") || "None assigned"}</dd></div>
                <div><dt className="text-sky-300/60">Approvals</dt><dd className="mt-0.5 text-sky-100/80">{mission.approvals} pending</dd></div>
                <div><dt className="text-sky-300/60">Risks</dt><dd className="mt-0.5 text-sky-100/80">{mission.risks.join("; ") || "None"}</dd></div>
                <div><dt className="text-sky-300/60">Recovery anchor</dt><dd className="mt-0.5 font-mono text-sky-100/80">{mission.recoveryAnchor ?? "Not set"}</dd></div>
                <div><dt className="text-sky-300/60">Knowledge produced</dt><dd className="mt-0.5 text-sky-100/80">{mission.knowledge.join(", ") || "None yet"}</dd></div>
              </dl>
            </div>
          </LuminaFlagshipCard>
        ))}
      </div>
    </ExecutiveSection>
  );
}
