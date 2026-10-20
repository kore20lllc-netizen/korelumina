import { Activity } from "lucide-react";

import type { MissionRecord } from "@/services/executiveOfficeService";

import type { PreviewTone } from "../design/executiveDesignPreview";
import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";
import { STATE_LABEL, STATE_TONE, shortSha, sortMissions } from "../state/missionView";
import { missionBuildKey, recordMissionBuild, useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * MS-5 (ADR-0044 Decision 6): wired, and nothing is simulated. Missions in
 * execution show their linked commits and the live validation checks
 * (MS-4); the owner records whether the recovery anchor passed
 * `npm run build`. Learning cycles show what they captured and which
 * commits they linked to missions.
 */

const SHOWN: readonly MissionRecord["state"][] = ["executing", "validating", "completed"];

const CYCLE_TONE: Record<string, PreviewTone> = {
  CAPTURED: "healthy",
  HELD: "warning",
  FAILED: "error",
};

function MissionExecution({ mission }: { mission: MissionRecord }) {
  const office = useExecutiveOffice();
  const key = missionBuildKey(mission.id);
  const busy = office.missionBusy[key];
  const failure = office.missionErrors[key];
  const anchor = mission.recoveryAnchor;
  const verifiable = anchor && (mission.state === "executing" || mission.state === "validating");
  const latest = anchor ? [...(mission.verifications ?? [])].reverse().find((verification) => verification.sha === anchor) : undefined;
  const passed = mission.checks?.filter((check) => check.passed).length ?? 0;

  return (
    <li className="grid gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-sky-50">{mission.id} · {mission.title}</div>
          <div className="text-xs leading-5 text-sky-300/60">
            {mission.linkedCommits.length} linked commit{mission.linkedCommits.length === 1 ? "" : "s"} · recovery anchor <span className="font-mono">{shortSha(anchor)}</span>
            {mission.checks ? ` · ${passed} of ${mission.checks.length} checks passed` : ""}
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[STATE_TONE[mission.state]]}`}>{STATE_LABEL[mission.state]}</span>
      </div>

      {mission.checks ? (
        <ul className="grid gap-1.5" aria-label={`${mission.id} validation`}>
          {mission.checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-xs leading-5">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${check.passed ? "bg-emerald-300" : "bg-amber-300"}`} />
              <span className="text-sky-100/80">
                {check.label}
                <span className="text-sky-300/60"> · {check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {verifiable ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-300/60">
            npm run build at <span className="font-mono">{shortSha(anchor)}</span>{latest ? ` · recorded ${latest.result}` : ""}
          </span>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void recordMissionBuild(mission.id, anchor, "passed")}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.healthy}`}
          >
            {busy === "passed" ? "Recording…" : "Passed"}
          </button>
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void recordMissionBuild(mission.id, anchor, "failed")}
            className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.error}`}
          >
            {busy === "failed" ? "Recording…" : "Failed"}
          </button>
        </div>
      ) : null}

      {failure ? (
        <div className="rounded-[12px] border border-rose-300/25 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
          Not recorded: {failure}
        </div>
      ) : null}
    </li>
  );
}

export function ExecutionCenter() {
  const office = useExecutiveOffice();
  const missions = office.missions.status === "ok"
    ? sortMissions(office.missions.data.filter((mission) => SHOWN.includes(mission.state)))
    : [];
  const cycles = office.learning.status === "ok"
    ? [...office.learning.data.cycles].sort((left, right) => right.startedAt - left.startedAt).slice(0, 3)
    : [];
  const activation = office.activation.status === "ok" ? office.activation.data : null;

  const items: Array<{ title: string; state: string; detail: string; tone: PreviewTone }> = [
    ...cycles.map((cycle) => ({
      title: `Learning cycle: ${cycle.commits.length} commit${cycle.commits.length === 1 ? "" : "s"}`,
      state: cycle.outcome.toLowerCase(),
      detail: [
        new Date(cycle.completedAt ?? cycle.startedAt).toLocaleString(),
        cycle.learning?.recordId ? `wrote ${cycle.learning.recordId}` : "",
        cycle.missionLinks?.length
          ? `linked ${cycle.missionLinks.filter((link) => link.result !== "ignored").length} to missions`
          : "",
        cycle.reasons.join("; "),
      ].filter(Boolean).join(" · "),
      tone: CYCLE_TONE[cycle.outcome] ?? "active",
    })),
    ...(activation
      ? [{
          title: "Chief Agent operations",
          state: activation.autonomyLevel ?? activation.state,
          detail: activation.autonomyLevel === "PROPOSE_ONLY"
            ? "It reasons and proposes; no action executes at this autonomy level (ADR-0041)."
            : activation.reason,
          tone: "active" as PreviewTone,
        }]
      : []),
  ];

  return (
    <ExecutiveSection
      id="executive-execution"
      icon={Activity}
      eyebrow="Execution Center"
      title="Live execution stays observable"
      description="Missions in execution with their linked commits and validation, the build result you record for each recovery anchor, and recent learning cycles."
      wiring="live"
    >
      <ul className="grid gap-2.5">
        {office.missions.status === "loading" ? (
          <li className="text-sm text-sky-300/60">Reading execution…</li>
        ) : null}
        {office.missions.status === "error" ? (
          <li className="rounded-[14px] border border-rose-300/25 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-100">
            Missions unavailable: {office.missions.message}
          </li>
        ) : null}
        {office.missions.status === "ok" && missions.length === 0 ? (
          <li className="rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-3 text-sm text-sky-300/70">
            No mission is executing. A mission starts with its first commit carrying a Mission trailer.
          </li>
        ) : null}

        {missions.map((mission) => (
          <MissionExecution key={mission.id} mission={mission} />
        ))}

        {items.map((item) => (
          <li key={item.title + item.detail} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-sky-50">{item.title}</div>
              <div className="text-xs leading-5 text-sky-300/60">{item.detail}</div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[item.tone]}`}>{item.state}</span>
          </li>
        ))}
      </ul>
    </ExecutiveSection>
  );
}
