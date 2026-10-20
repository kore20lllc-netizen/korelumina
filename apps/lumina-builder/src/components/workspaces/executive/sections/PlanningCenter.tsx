import { useState } from "react";
import { Network } from "lucide-react";

import type { MissionRecord, MissionTaskRecord } from "@/services/executiveOfficeService";

import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";
import { STATE_LABEL, sortMissions } from "../state/missionView";
import { missionTaskKey, updateMissionTask, useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * MS-5 (ADR-0044 Decision 4): wired. The plan is the mission's plan:
 * objective, mission, epics and tasks with their acceptance criteria. While
 * a mission is approved or in execution, the owner marks tasks done, drops
 * them with a reason, or reopens them; Runtime validates on that evidence
 * (MS-4). Roadmaps and sprints are not records yet, so they are not shown.
 */

const PLANNABLE: readonly MissionRecord["state"][] = ["draft", "planned", "awaiting_approval", "approved", "executing", "validating", "blocked"];
const WORKING: readonly MissionRecord["state"][] = ["approved", "executing", "validating"];

const TASK_TONE = { todo: "active", done: "healthy", dropped: "warning" } as const;
const TASK_LABEL = { todo: "To do", done: "Done", dropped: "Dropped" } as const;

function TaskRow({ mission, task, depth }: { mission: MissionRecord; task: MissionTaskRecord; depth: number }) {
  const office = useExecutiveOffice();
  const [dropping, setDropping] = useState(false);
  const [reason, setReason] = useState("");
  const key = missionTaskKey(mission.id, task.id);
  const busy = office.missionBusy[key];
  const failure = office.missionErrors[key];
  const editable = WORKING.includes(mission.state);

  return (
    <li
      className="grid gap-2 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 py-2.5 pr-3"
      style={{ paddingLeft: `${12 + depth * 18}px` }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90">Task</span>
        <span className="min-w-0 flex-1 text-sm text-sky-100/85" title={task.acceptanceCriteria.length ? `Acceptance: ${task.acceptanceCriteria.join("; ")}` : undefined}>
          <span className="mr-2 font-mono text-[11px] text-sky-300/50">{mission.id} · {task.id}</span>
          {task.title}
        </span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill[TASK_TONE[task.status]]}`}>
          {busy ? "Saving…" : TASK_LABEL[task.status]}
        </span>
        {editable && !dropping ? (
          <div className="flex flex-wrap gap-1.5">
            {task.status === "todo" ? (
              <>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => void updateMissionTask(mission.id, task.id, "done")}
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.healthy}`}
                >
                  Done
                </button>
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => setDropping(true)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.warning}`}
                >
                  Drop
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void updateMissionTask(mission.id, task.id, "todo")}
                className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 disabled:opacity-50"
              >
                Reopen
              </button>
            )}
          </div>
        ) : null}
      </div>

      {task.status === "dropped" && task.dropReason ? (
        <div className="text-xs leading-5 text-sky-300/60">Dropped: {task.dropReason}</div>
      ) : null}

      {dropping ? (
        <div className="grid gap-2">
          <textarea
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Why is this task dropped? (required)"
            className="[color-scheme:dark] w-full resize-none rounded-[14px] border border-amber-300/[0.25] bg-slate-950/[0.42] px-3 py-2 text-sm text-sky-100 placeholder:text-slate-500 outline-none focus:border-amber-300/50"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busy) || reason.trim().length === 0}
              onClick={async () => {
                if (await updateMissionTask(mission.id, task.id, "dropped", reason.trim())) {
                  setDropping(false);
                  setReason("");
                }
              }}
              className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50 ${tonePill.warning}`}
            >
              {busy ? "Dropping…" : "Confirm drop"}
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => setDropping(false)}
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
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

function PlanNode({ level, title, depth }: { level: string; title: string; depth: number }) {
  return (
    <li
      className="flex items-center gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 py-2.5 pr-3"
      style={{ paddingLeft: `${12 + depth * 18}px` }}
    >
      <span className="w-20 shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90">{level}</span>
      <span className="text-sm text-sky-100/85">{title}</span>
    </li>
  );
}

export function PlanningCenter() {
  const office = useExecutiveOffice();
  const missions = office.missions.status === "ok"
    ? sortMissions(office.missions.data.filter((mission) => PLANNABLE.includes(mission.state)))
    : [];

  return (
    <ExecutiveSection
      id="executive-planning"
      icon={Network}
      eyebrow="Planning Center"
      title="From objective to task"
      description="Objective → Mission → Epic → Task, for every open mission. Mark tasks done or drop them with a reason; Runtime validates on that evidence."
      wiring="live"
    >
      <div className="grid gap-5">
        {office.missions.status === "loading" ? (
          <div className="text-sm text-sky-300/60">Reading plans…</div>
        ) : null}
        {office.missions.status === "error" ? (
          <div className="rounded-[14px] border border-rose-300/25 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-100">
            Plans unavailable: {office.missions.message}
          </div>
        ) : null}
        {office.missions.status === "ok" && missions.length === 0 ? (
          <div className="rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-3.5 py-3 text-sm text-sky-300/70">
            No open mission has a plan.
          </div>
        ) : null}

        {missions.map((mission) => (
          <ol key={mission.id} className="grid gap-2" aria-label={`${mission.title} plan`}>
            <PlanNode level="Objective" title={mission.objective} depth={0} />
            <PlanNode level="Mission" title={`${mission.id} · ${mission.title} · ${STATE_LABEL[mission.state]}`} depth={1} />
            {mission.plan ? (
              mission.plan.epics.map((epic) => (
                <li key={epic.id} className="grid gap-2">
                  <ol className="grid gap-2">
                    <PlanNode level="Epic" title={epic.title} depth={2} />
                    {epic.tasks.map((task) => (
                      <TaskRow key={task.id} mission={mission} task={task} depth={3} />
                    ))}
                  </ol>
                </li>
              ))
            ) : (
              <PlanNode level="Plan" title="No plan yet" depth={2} />
            )}
          </ol>
        ))}
      </div>
    </ExecutiveSection>
  );
}
