import { Rocket } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import { ExecutiveSection, tonePill, toneText } from "../shared/ExecutiveSection";
import {
  MISSION_STAGES,
  STATE_LABEL,
  STATE_TONE,
  isOpenMission,
  missionProgress,
  missionTasks,
  pendingMissionApprovals,
  shortSha,
  sortMissions,
  stageIndex,
} from "../state/missionView";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * MS-5 (ADR-0044): wired. Every mission is a Runtime record; this shows
 * each one's lifecycle, objective, owner, approvals, risks, recovery anchor
 * and the knowledge it produced. Proposals are decided in the Approval
 * Center; task status and build verification in Planning and Execution.
 */
export function MissionCenter() {
  const office = useExecutiveOffice();
  const approvals = office.operations.status === "ok" ? office.operations.data.approvals : [];
  const missions = office.missions.status === "ok" ? sortMissions(office.missions.data.filter((mission) => mission.state !== "archived")) : [];
  const open = missions.filter(isOpenMission).length;

  return (
    <ExecutiveSection
      id="executive-missions"
      icon={Rocket}
      eyebrow="Mission Center"
      title="Every objective is a mission"
      description="Plan → Approval → Execution → Validation → Completion → Knowledge. Each mission shows its progress, owner, approvals, risks, recovery anchor, and the knowledge it produced."
      wiring="live"
      actions={
        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[open > 0 ? "active" : "healthy"]}`}>
          {open} open
        </span>
      }
    >
      <div className="grid gap-4">
        {office.missions.status === "loading" ? (
          <div className="text-sm text-sky-300/60">Reading missions…</div>
        ) : null}
        {office.missions.status === "error" ? (
          <div className="rounded-[14px] border border-rose-300/25 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-100">
            Missions unavailable: {office.missions.message}
          </div>
        ) : null}
        {office.missions.status === "ok" && missions.length === 0 ? (
          <div className="rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-3.5 py-3 text-sm text-sky-300/70">
            No missions yet. Ask the Chief Agent to propose one.
          </div>
        ) : null}

        {missions.map((mission) => {
          const tone = STATE_TONE[mission.state];
          const reached = stageIndex(mission);
          const tasks = missionTasks(mission);
          const pending = pendingMissionApprovals(mission, approvals);
          return (
            <LuminaFlagshipCard key={mission.id} as="article" className="rounded-[20px] p-4">
              <div className="relative z-10 grid gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">{mission.id} · {mission.priority} · {mission.type}</div>
                    <div className={`mt-1 text-lg font-semibold ${toneText[tone]}`}>{mission.title}</div>
                    <div className="mt-1 text-xs leading-5 text-sky-300/70">{mission.objective}</div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[tone]}`}>
                    {missionProgress(mission)}% · {STATE_LABEL[mission.state]}
                  </span>
                </div>

                <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-6" aria-label={`${mission.title} lifecycle`}>
                  {MISSION_STAGES.map((stage, index) => (
                    <li key={stage.label} className={`rounded-full border px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] ${index <= reached ? "border-cyan-300/40 bg-cyan-400/10 text-cyan-100" : "border-slate-600/40 text-slate-400"}`}>
                      {stage.label}
                    </li>
                  ))}
                </ol>

                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  {[
                    ["Owner", `Chief Agent · proposed by ${mission.proposedBy.id}`],
                    ["Plan", tasks.length ? `${tasks.filter((task) => task.status !== "todo").length} of ${tasks.length} tasks done or dropped` : "No plan yet"],
                    ["Approvals", pending ? `${pending} pending in the Approval Center` : "None pending"],
                    ["Risks", mission.risks.join("; ") || "None recorded"],
                    ["Recovery anchor", `${shortSha(mission.recoveryAnchor)}${mission.linkedCommits.length ? ` · ${mission.linkedCommits.length} linked commit${mission.linkedCommits.length === 1 ? "" : "s"}` : ""}`],
                    ["Knowledge produced", mission.producedKnowledge.join(", ") || "None yet"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-sky-300/60">{label}</dt>
                      <dd className={`mt-0.5 text-sky-100/80 ${label === "Recovery anchor" ? "font-mono" : ""}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </LuminaFlagshipCard>
          );
        })}
      </div>
    </ExecutiveSection>
  );
}
