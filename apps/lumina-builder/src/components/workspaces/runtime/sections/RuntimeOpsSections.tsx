import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ExternalLink, GitCommitVertical, Radio, ScrollText, ServerCog } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import type { HealthStatus, LogLevel, RuntimeState } from "@/services/runtime/types";
import { cn } from "@/lib/utils";

import { ExecutiveCardHeading, ExecutiveSection, ExecutiveTile, toneDot, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { Sparkline } from "../shared/Sparkline";
import { EVENT_TONE, HEALTH_LABEL, HEALTH_TONE, LOG_LEVELS, LOG_TONE, STATE_LABEL, STATE_TONE, clock, duration } from "../shared/runtimePresentation";
import type { RuntimeOpsView } from "../state/useRuntimeOpsView";

/* MS-2026-0011: the Runtime Operations sections, each a Knowledge Operations flagship panel on live Runtime data. */

const HEALTHS: readonly (HealthStatus | "all")[] = ["all", "healthy", "degraded", "critical", "offline"];
const STATES: readonly (RuntimeState | "all")[] = ["all", "running", "starting", "restarting", "stopped", "error"];

function Chip<T extends string>({ value, current, onSelect, label }: { value: T; current: T; onSelect: (value: T) => void; label: string }) {
  const on = value === current;
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onSelect(value)}
      className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${on ? tonePill.active : "border-white/10 text-white/45 hover:text-white/70"}`}
    >
      {label}
    </button>
  );
}

function Waiting({ view }: { view: RuntimeOpsView }) {
  return (
    <p className={`text-sm ${view.status === "error" ? toneText.error : "text-sky-300/70"}`}>
      {view.status === "error" ? view.error?.message ?? "Runtime could not be reached." : "Reading Runtime…"}
    </p>
  );
}

export function ProjectsSection({ view }: { view: RuntimeOpsView }) {
  return (
    <ExecutiveSection id="runtime-ops-projects" icon={Boxes} eyebrow="Projects" title="Every project Runtime manages" description="Live state, health and resource use. Select a project to act on it and read its logs." wiring="live">
      <input
        ref={view.searchRef}
        value={view.query}
        onChange={(event) => view.setQuery(event.target.value)}
        placeholder="Search projects (press /)"
        aria-label="Search projects"
        className="rounded-[14px] border border-cyan-300/25 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 outline-none placeholder:text-white/30 focus:border-cyan-300/60"
      />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Health">
          {HEALTHS.map((health) => (
            <Chip<HealthStatus | "all"> key={health} value={health} current={view.health} onSelect={view.setHealth} label={health === "all" ? "Any health" : HEALTH_LABEL[health]} />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="State">
          {STATES.map((state) => (
            <Chip<RuntimeState | "all"> key={state} value={state} current={view.state} onSelect={view.setState} label={state === "all" ? "Any state" : STATE_LABEL[state]} />
          ))}
        </div>
      </div>
      {view.status !== "ready" ? (
        <Waiting view={view} />
      ) : view.projects.length === 0 ? (
        <p className="text-sm text-sky-300/70">{(view.snapshot?.projects.length ?? 0) === 0 ? "No projects yet. Import one in Imports." : "No project matches these filters."}</p>
      ) : (
        <ul className="grid gap-2">
          {view.projects.map((project) => {
            const selected = view.selected?.id === project.id;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => view.select(project.id)}
                  aria-pressed={selected}
                  className={cn("grid w-full gap-1 rounded-[16px] border bg-slate-950/40 px-4 py-3 text-left transition-colors", selected ? "border-cyan-300/50" : "border-white/[0.06] hover:border-white/20")}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", toneDot[STATE_TONE[project.state]], project.state === "starting" || project.state === "restarting" ? "animate-pulse" : "")} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/90">{project.name}</span>
                    <span className={`shrink-0 text-[11px] ${toneText[HEALTH_TONE[project.health.status]]}`}>{HEALTH_LABEL[project.health.status]}</span>
                  </span>
                  <span className="truncate text-[11px] text-sky-300/60">
                    {STATE_LABEL[project.state]}
                    {project.process?.framework ? ` · ${project.process.framework}` : ""}
                    {project.state === "running" ? ` · CPU ${project.metrics.cpuPct}% · ${Math.round(project.metrics.memUsedMb)} MB · up ${duration(project.uptimeMs)}` : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ExecutiveSection>
  );
}

export function ProjectSection({ view }: { view: RuntimeOpsView }) {
  const project = view.selected;
  const busy = project ? Boolean(view.pending[project.id]) : false;
  const running = project?.state === "running" || project?.state === "starting" || project?.state === "restarting";
  return (
    <ExecutiveSection
      id="runtime-ops-project"
      icon={ServerCog}
      iconState={project ? HEALTH_TONE[project.health.status] : "active"}
      eyebrow="Selected project"
      title={project ? project.name : "No project selected"}
      description={project ? `${project.id} · what Runtime reports about its process, with its controls.` : "Select a project to see its process and act on it."}
      wiring="live"
      actions={
        project ? (
          <div className="flex flex-wrap gap-2">
            {!running ? (
              <button type="button" disabled={busy} onClick={() => view.request("start", project.id)} className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60 ${tonePill.healthy}`}>
                {busy ? "Working…" : "Start"}
              </button>
            ) : null}
            <button type="button" disabled={busy} onClick={() => view.request("restart", project.id)} className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60 ${tonePill.warning}`}>
              {busy ? "Working…" : "Restart"}
            </button>
            {running ? (
              <button type="button" disabled={busy} onClick={() => view.request("shutdown", project.id)} className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60 ${tonePill.error}`}>
                {busy ? "Working…" : "Stop"}
              </button>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {!project ? (
        view.status === "ready" ? <p className="text-sm text-sky-300/70">No project selected.</p> : <Waiting view={view} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <ExecutiveTile label="State" value={STATE_LABEL[project.state]} detail={project.startedAt ? `Started ${new Date(project.startedAt).toLocaleString()}` : "Not started in this Runtime session"} tone={STATE_TONE[project.state]} />
            <ExecutiveTile label="Health" value={HEALTH_LABEL[project.health.status]} detail={project.health.reasons.join(" ")} tone={HEALTH_TONE[project.health.status]} />
            <ExecutiveTile label="Uptime" value={project.state === "running" ? duration(project.uptimeMs) : "—"} detail={project.process?.exitedAt ? `Last exited ${new Date(project.process.exitedAt).toLocaleString()}` : undefined} tone="active" />
            <ExecutiveTile
              label="Automatic restarts"
              value={String(project.process?.restarts ?? 0)}
              detail={project.process?.lastFailureReason ?? (project.process?.lastRestartAt ? `Last ${new Date(project.process.lastRestartAt).toLocaleString()}` : "None in Runtime's current window")}
              tone={(project.process?.restarts ?? 0) > 0 ? "warning" : "healthy"}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <LuminaFlagshipCard as="article" className="rounded-[18px] p-4">
              <div className="relative z-10">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">CPU</span>
                  <span className="text-sm font-semibold text-cyan-100">{project.state === "running" ? `${project.metrics.cpuPct}%` : "—"}</span>
                </div>
                <Sparkline values={project.metrics.cpuSeries} label={`CPU of ${project.name}`} />
              </div>
            </LuminaFlagshipCard>
            <LuminaFlagshipCard as="article" className="rounded-[18px] p-4">
              <div className="relative z-10">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300/70">Memory</span>
                  <span className="text-sm font-semibold text-violet-100">{project.state === "running" ? `${Math.round(project.metrics.memUsedMb)} MB` : "—"}</span>
                </div>
                <Sparkline values={project.metrics.memSeries} label={`Memory of ${project.name}`} className="text-violet-300" />
              </div>
            </LuminaFlagshipCard>
          </div>
          <LuminaFlagshipCard as="article" className="rounded-[18px] p-4">
            <div className="relative z-10 grid gap-2 text-xs leading-5 text-sky-300/75">
              <ExecutiveCardHeading icon={ServerCog} tone="active">Process</ExecutiveCardHeading>
              <div>Framework: <span className="text-white/85">{project.process?.framework ?? "unknown"}</span></div>
              <div>
                Address:{" "}
                {project.process?.url ? (
                  <a href={project.process.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-200 hover:text-cyan-100">
                    {project.process.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-white/50">not serving</span>
                )}
              </div>
              <div>Process ID: <span className="text-white/85">{project.process?.pid ?? "—"}</span> · Log lines: <span className="text-white/85">{project.process?.logLines ?? 0}</span></div>
              {project.process?.lastError ? <div className={toneText.error}>Last error: {project.process.lastError}</div> : null}
            </div>
          </LuminaFlagshipCard>
        </>
      )}
    </ExecutiveSection>
  );
}

export function LogsSection({ view }: { view: RuntimeOpsView }) {
  const [minimum, setMinimum] = useState<LogLevel>("debug");
  const [follow, setFollow] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  const shown = useMemo(() => {
    const floor = LOG_LEVELS.indexOf(minimum);
    return view.logs.filter((entry) => LOG_LEVELS.indexOf(entry.level) >= floor).slice(-400);
  }, [view.logs, minimum]);
  useEffect(() => {
    if (follow && viewport.current) viewport.current.scrollTop = viewport.current.scrollHeight;
  }, [shown, follow]);
  return (
    <ExecutiveSection
      id="runtime-ops-logs"
      icon={ScrollText}
      eyebrow="Logs"
      title={view.selected ? `Output of ${view.selected.name}` : "Output"}
      description="What the project's process writes, as Runtime streams it."
      wiring="live"
      actions={
        <button type="button" aria-pressed={follow} onClick={() => setFollow((value) => !value)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${follow ? tonePill.healthy : "border-white/10 text-white/50"}`}>
          {follow ? "Following" : "Paused"}
        </button>
      }
    >
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Minimum log level">
        {LOG_LEVELS.map((level) => (
          <Chip<LogLevel> key={level} value={level} current={minimum} onSelect={setMinimum} label={`${level} +`} />
        ))}
      </div>
      <div ref={viewport} className="min-h-[360px] overflow-y-auto rounded-[14px] border border-white/[0.06] bg-slate-950/70 p-3 font-mono text-[11px] leading-5" role="log" aria-live="polite">
        {shown.length === 0 ? (
          <span className="text-white/40">{view.status === "ready" ? "No output yet." : "Reading Runtime…"}</span>
        ) : (
          shown.map((entry) => (
            <div key={entry.id} className="flex gap-3">
              <span className="shrink-0 text-white/30">{clock(entry.at)}</span>
              <span className={`shrink-0 uppercase ${LOG_TONE[entry.level]}`}>{entry.level}</span>
              <span className={`min-w-0 whitespace-pre-wrap break-words ${LOG_TONE[entry.level]}`}>{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </ExecutiveSection>
  );
}

export function EventsSection({ view }: { view: RuntimeOpsView }) {
  return (
    <ExecutiveSection id="runtime-ops-events" icon={Radio} eyebrow="Events" title="What happened" description="Runtime's events for the selected project, newest first." wiring="live">
      {view.events.length === 0 ? (
        <p className="text-sm text-sky-300/70">{view.status === "ready" ? "No events yet." : "Reading Runtime…"}</p>
      ) : (
        <ul className="grid gap-2">
          {view.events.map((event) => (
            <li key={event.id} className="flex min-w-0 items-start gap-3 rounded-[12px] border border-white/[0.06] bg-slate-950/40 px-3 py-2">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[EVENT_TONE[event.severity]]}`} />
              <div className="min-w-0 flex-1">
                <div className={`text-xs ${toneText[EVENT_TONE[event.severity]]}`}>{event.message}</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">{event.kind} · {clock(event.at)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ExecutiveSection>
  );
}

export function LifecycleSection({ view }: { view: RuntimeOpsView }) {
  return (
    <ExecutiveSection id="runtime-ops-lifecycle" icon={GitCommitVertical} eyebrow="Lifecycle" title="Build, boot and stop" description="Each phase of the selected project's process, with how long it took." wiring="live">
      {view.timeline.length === 0 ? (
        <p className="text-sm text-sky-300/70">{view.status === "ready" ? "No lifecycle steps yet." : "Reading Runtime…"}</p>
      ) : (
        <ol className="grid gap-2">
          {view.timeline.map((step) => (
            <li key={step.id} className="flex min-w-0 items-center justify-between gap-3 rounded-[12px] border border-white/[0.06] bg-slate-950/40 px-3 py-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white/85">{step.label}</div>
                <div className="text-[10px] uppercase tracking-[0.12em] text-cyan-300/60">{step.phase}</div>
              </div>
              <div className="shrink-0 text-right text-[11px] text-sky-300/70">
                <div>{clock(step.at)}</div>
                {step.durationMs ? <div className="text-white/45">{duration(step.durationMs)}</div> : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </ExecutiveSection>
  );
}
