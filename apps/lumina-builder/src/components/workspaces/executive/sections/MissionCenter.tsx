import { useState } from "react";
import { Rocket } from "lucide-react";

import type { MissionOwnerStep, MissionRecord } from "@/services/executiveOfficeService";

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
import { missionStepKey, runMissionStep, useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * MS-5b: the owner's lifecycle steps. A Chief Agent proposal (a pending
 * approval) is decided in the Approval Center, not here.
 */
const CANCELLABLE: readonly MissionRecord["state"][] = ["draft", "planned", "awaiting_approval", "approved", "executing", "validating", "blocked"];
const STEP_LABEL: Record<MissionOwnerStep, string> = {
  submit: "Submit for approval",
  approve: "Approve",
  reject: "Reject",
  unblock: "Unblock",
  cancel: "Cancel mission",
  archive: "Archive",
};
const STEP_TONE = { submit: "active", approve: "healthy", reject: "error", unblock: "active", cancel: "error", archive: "active" } as const;
const NEEDS_REASON: readonly MissionOwnerStep[] = ["reject", "unblock", "cancel"];

function MissionActions({ mission, pendingApprovals }: { mission: MissionRecord; pendingApprovals: number }) {
  const office = useExecutiveOffice();
  const [asking, setAsking] = useState<MissionOwnerStep | null>(null);
  const [reason, setReason] = useState("");
  const key = missionStepKey(mission.id);
  const busy = office.missionBusy[key];
  const failure = office.missionErrors[key];

  const steps: MissionOwnerStep[] = [
    ...(mission.state === "planned" ? (["submit"] as const) : []),
    ...(mission.state === "awaiting_approval" && pendingApprovals === 0 ? (["approve", "reject"] as const) : []),
    ...(mission.state === "blocked" ? (["unblock"] as const) : []),
    ...(CANCELLABLE.includes(mission.state) ? (["cancel"] as const) : []),
    ...(mission.state === "knowledge_extracted" || mission.state === "cancelled" ? (["archive"] as const) : []),
  ];
  if (steps.length === 0) return null;

  const take = async (step: MissionOwnerStep, why?: string) => {
    if (await runMissionStep(mission.id, step, why)) {
      setAsking(null);
      setReason("");
    }
  };

  return (
    <div className="grid gap-2">
      {mission.state === "awaiting_approval" && pendingApprovals > 0 ? (
        <div className="text-xs text-amber-200/80">Decide this proposal in the Approval Center.</div>
      ) : null}

      {asking ? (
        <textarea
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={`Why ${STEP_LABEL[asking].toLowerCase()}? (required)`}
          className="[color-scheme:dark] w-full resize-none rounded-[14px] border border-rose-300/[0.25] bg-slate-950/[0.42] px-3 py-2 text-sm text-sky-100 placeholder:text-slate-500 outline-none focus:border-rose-300/50"
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {asking ? (
          <>
            <button
              type="button"
              disabled={Boolean(busy) || reason.trim().length === 0}
              onClick={() => void take(asking, reason.trim())}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill[STEP_TONE[asking]]}`}
            >
              {busy ? "Recording…" : `Confirm ${STEP_LABEL[asking].toLowerCase()}`}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => setAsking(null)}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 disabled:opacity-50"
            >
              Back
            </button>
          </>
        ) : (
          steps.map((step) => (
            <button
              key={step}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => (NEEDS_REASON.includes(step) ? setAsking(step) : void take(step))}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill[STEP_TONE[step]]}`}
            >
              {busy === step ? "Recording…" : STEP_LABEL[step]}
            </button>
          ))
        )}
      </div>

      {failure ? (
        <div className="rounded-[12px] border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
          Not recorded: {failure}
        </div>
      ) : null}
    </div>
  );
}

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

                <MissionActions mission={mission} pendingApprovals={pending} />
              </div>
            </LuminaFlagshipCard>
          );
        })}
      </div>
    </ExecutiveSection>
  );
}
