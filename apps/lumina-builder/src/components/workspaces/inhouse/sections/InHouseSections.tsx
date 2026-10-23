import { AlertTriangle, BookOpen, Boxes, Flag, Gauge, ServerCog, ShieldCheck, Smartphone, Stethoscope, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

import type { PreviewTone } from "../../executive/design/executiveDesignPreview";
import { ExecutiveCardHeading, ExecutiveSection, toneDot, tonePill, toneText } from "../../executive/shared/ExecutiveSection";
import { relativeTime, scoreTone } from "../../repo-audit/shared/auditPresentation";
import { rememberAuditProject } from "../../repo-audit/state/useRepoAudit";
import { STATE_LABEL, STATE_TONE } from "../../runtime/shared/runtimePresentation";
import type { AttentionItem, InHouseConsole } from "../state/useInHouseConsole";

/* MS-2026-0011: the In-House Dev sections, each a Knowledge Operations flagship panel on live data. */

type Target = AttentionItem["target"];

function useOpen() {
  const { setView } = useWorkspace();
  return (target: Target) => {
    if (target.view === "engagements") {
      document.getElementById("inhouse-engagements")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (target.view === "repo-audit" && target.projectId) rememberAuditProject(target.projectId);
    setView(target.view);
  };
}

function OpenButton({ onClick, children, tone = "active" }: { onClick: () => void; children: string; tone?: PreviewTone }) {
  return (
    <button type="button" onClick={onClick} className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tonePill[tone]}`}>
      {children}
    </button>
  );
}

interface Tool {
  id: string;
  label: string;
  icon: LucideIcon;
  purpose: string;
  live: string | null;
  tone: PreviewTone;
  view: "repo-audit" | "runtime-operations" | "deployment-diagnostics" | "executive-office" | "knowledge-operations";
}

function toolsFor(view: InHouseConsole): Tool[] {
  const overall = view.runtime.snapshot?.overall;
  const total = view.projects.length;
  return [
    {
      id: "repo-audit",
      label: "Repo Audit",
      icon: ShieldCheck,
      purpose: "Audits a project's dependencies, secrets, code, build, environment and architecture, and exports a client report.",
      live: total ? `${view.audited} of ${total} projects audited · ${view.critical} critical finding${view.critical === 1 ? "" : "s"}` : null,
      tone: view.critical ? "error" : "active",
      view: "repo-audit",
    },
    {
      id: "runtime-operations",
      label: "Runtime Operations",
      icon: ServerCog,
      purpose: "Starts, restarts and stops each project's process, with its logs, events and lifecycle.",
      live: overall ? `${overall.running} of ${overall.total} running` : view.runtime.status === "error" ? "Runtime unreachable" : null,
      tone: view.runtime.status === "error" ? "error" : "active",
      view: "runtime-operations",
    },
    {
      id: "deployment-diagnostics",
      label: "Deployment Diagnostics",
      icon: Stethoscope,
      purpose: "Runtime health, registry, logs and operations, for diagnosing a project that will not run.",
      live: null,
      tone: "active",
      view: "deployment-diagnostics",
    },
    {
      id: "executive-office",
      label: "Executive Office",
      icon: Flag,
      purpose: "Missions, approvals and the Chief Agent's proposals.",
      live: view.missions.status === "ok" ? `${view.openMissions.length} open mission${view.openMissions.length === 1 ? "" : "s"} · ${view.awaiting.length} awaiting you` : null,
      tone: view.awaiting.length ? "warning" : "active",
      view: "executive-office",
    },
    {
      id: "knowledge-operations",
      label: "Knowledge Operations",
      icon: BookOpen,
      purpose: "Governed knowledge: learning records, reviews and their lifecycle.",
      live: null,
      tone: "active",
      view: "knowledge-operations",
    },
  ];
}

export function ToolsSection({ view }: { view: InHouseConsole }) {
  const open = useOpen();
  return (
    <ExecutiveSection id="inhouse-tools" icon={Wrench} eyebrow="Tools" title="The internal tools" description="Every tool here is live. Mobile packaging is listed as not built, because no Runtime service exists for it yet." wiring="live">
      <ul className="grid gap-2.5">
        {toolsFor(view).map((tool) => (
          <li key={tool.id}>
            <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
              <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <ExecutiveCardHeading icon={tool.icon} tone={tool.tone}>{tool.label}</ExecutiveCardHeading>
                  <p className="mt-2 text-xs leading-5 text-sky-100/75">{tool.purpose}</p>
                  {tool.live ? <p className={`mt-1 text-xs leading-5 ${toneText[tool.tone]}`}>{tool.live}</p> : null}
                </div>
                <OpenButton onClick={() => open({ view: tool.view as Target["view"] })}>Open</OpenButton>
              </div>
            </LuminaFlagshipCard>
          </li>
        ))}
        <li>
          <LuminaFlagshipCard as="article" className="rounded-[20px] p-4">
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <ExecutiveCardHeading icon={Smartphone}>Mobile packaging</ExecutiveCardHeading>
                <p className="mt-2 text-xs leading-5 text-sky-100/75">
                  Packaging a project as iOS and Android apps with Capacitor. Runtime has no mobile packaging service yet, so nothing here can initialize, sync or build a native project.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">Not built</span>
            </div>
          </LuminaFlagshipCard>
        </li>
      </ul>
    </ExecutiveSection>
  );
}

export function AttentionSection({ view }: { view: InHouseConsole }) {
  const open = useOpen();
  return (
    <ExecutiveSection id="inhouse-attention" icon={AlertTriangle} iconState={view.attention.some((item) => item.tone === "error") ? "error" : view.attention.length ? "warning" : "healthy"} eyebrow="Attention" title="What needs the team now" description="Repairs without an engineer, failed projects, critical and high audit findings, projects never audited, and missions awaiting your approval." wiring="live">
      {view.attention.length === 0 ? (
        <p className="text-sm text-sky-300/70">
          {view.runtime.status === "loading" ? "Reading…" : view.runtime.status === "error" ? "Runtime is unreachable, so projects cannot be checked." : "Nothing needs attention."}
        </p>
      ) : (
        <ul className="grid gap-2">
          {view.attention.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-3">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", toneDot[item.tone])} />
                <div className="min-w-0">
                  <div className={`text-sm font-semibold ${toneText[item.tone]}`}>{item.title}</div>
                  <div className="text-xs leading-5 text-sky-300/60">{item.detail}</div>
                </div>
              </div>
              <OpenButton tone={item.tone} onClick={() => open(item.target)}>
                {item.target.view === "repo-audit" ? "Audit" : item.target.view === "runtime-operations" ? "Operate" : item.target.view === "engagements" ? "Open queue" : "Review"}
              </OpenButton>
            </li>
          ))}
        </ul>
      )}
    </ExecutiveSection>
  );
}

export function ProjectsSection({ view }: { view: InHouseConsole }) {
  const open = useOpen();
  return (
    <ExecutiveSection id="inhouse-projects" icon={Boxes} eyebrow="Projects" title="Every project, run and audited" description="Each project's Runtime state beside its latest Repo Audit grade." wiring="live">
      {view.projects.length === 0 ? (
        <p className={`text-sm ${view.runtime.status === "error" ? toneText.error : "text-sky-300/70"}`}>
          {view.runtime.status === "error" ? view.runtime.error?.message ?? "Runtime could not be reached." : view.runtime.status === "loading" ? "Reading Runtime…" : "No projects yet. Import one in Imports."}
        </p>
      ) : (
        <ul className="grid gap-2">
          {view.projects.map((project) => {
            const audit = view.audits[project.id];
            const report = audit?.status === "ok" ? audit.data.report : null;
            const score = report?.summary.score ?? null;
            const gradeTone = report ? scoreTone(score) : "active";
            return (
              <li key={project.id} className="grid gap-3 rounded-[14px] border border-cyan-300/15 bg-slate-950/40 px-4 py-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-sky-50">{project.name}</div>
                  <div className="truncate font-mono text-[11px] text-sky-300/50">{project.id}</div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDot[STATE_TONE[project.state]])} />
                  <span className={toneText[STATE_TONE[project.state]]}>{STATE_LABEL[project.state]}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2.5 text-xs">
                  <Gauge className={`h-3.5 w-3.5 shrink-0 ${toneText[gradeTone]}`} />
                  {!audit || audit.status === "loading" ? (
                    <span className="text-sky-300/60">Reading audit…</span>
                  ) : audit.status === "error" ? (
                    <span className={toneText.error}>Audit unreadable: {audit.message}</span>
                  ) : report ? (
                    <span className="min-w-0 truncate">
                      <span className={`font-semibold ${toneText[gradeTone]}`}>Grade {report.summary.grade ?? "not scored"}{score !== null ? ` · ${score}` : ""}</span>
                      <span className="text-sky-300/60"> · {report.summary.counts.critical} critical · {report.summary.counts.high} high · {relativeTime(report.completedAt)}</span>
                    </span>
                  ) : (
                    <span className="text-sky-300/60">{audit.data.running ? "Audit running…" : "Never audited"}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <OpenButton onClick={() => open({ view: "repo-audit", projectId: project.id })}>Audit</OpenButton>
                  <OpenButton onClick={() => open({ view: "runtime-operations" })}>Operate</OpenButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ExecutiveSection>
  );
}
