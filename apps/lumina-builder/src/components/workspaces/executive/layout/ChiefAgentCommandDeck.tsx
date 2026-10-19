import {
  BrainCircuit,
  Gavel,
  GraduationCap,
  RadioTower,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { cn } from "@/lib/utils";

import {
  CanonicalKnowledgeIcon,
  EvidenceCoverageIcon,
  KnowledgeHealthIcon,
} from "../../knowledge-v3/layout/ExecutiveOperationIcons";
import { ExecutiveMetricCard } from "../../knowledge-v3/layout/ExecutiveMetricCard";
import type { ExecutiveRibbonMetric } from "../../knowledge-v3/layout/ExecutiveRibbonProvider";
import {
  executiveMaterial,
  lighting,
} from "../../knowledge-v3/theme/appearance";
import {
  currentMission,
  type PreviewTone,
} from "../design/executiveDesignPreview";
import {
  DesignPreviewBadge,
  NotWiredButton,
  tonePill,
  toneDot,
  toneText,
} from "../shared/ExecutiveSection";
import { useExecutiveBriefing } from "../state/useExecutiveBriefing";
import {
  learnNow,
  useExecutiveOffice,
  type ExecutiveOfficeState,
} from "../state/useExecutiveOffice";

/*
 * EW-0: the Chief Agent command deck. Same materials as the Knowledge
 * Operations ribbon (glass, border, reflection, premium icons, metric
 * cards) but its own arrangement: one full-width deck with the Chief
 * Agent's identity and autonomy on the left, and its metrics above a
 * horizontal heartbeat on the right.
 *
 * EW-1: Chief Agent status, autonomy, learning, approvals, Runtime, and the
 * three metrics read Runtime; the headline is the live briefing (EW-1b).
 * Security and the current mission are still the design-preview snapshot.
 */

type Operation = {
  id: string;
  label: string;
  icon: LucideIcon;
  status: string;
  detail: string;
  tone: PreviewTone;
};

const AUTONOMY_LABEL: Record<string, string> = {
  PROPOSE_ONLY: "Propose only",
};

function relativeTime(at: number | undefined): string {
  if (!at) return "never";
  const minutes = Math.round((Date.now() - at) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function waitingCount(office: ExecutiveOfficeState): number | null {
  if (office.operations.status !== "ok" || office.canonicalReviews.status !== "ok") return null;
  return (
    office.operations.data.approvals.filter((approval) => approval.status === "pending").length +
    office.canonicalReviews.data.length
  );
}

function learnedRecords(office: ExecutiveOfficeState): string[] {
  if (office.learning.status !== "ok") return [];
  /* Runtime lists cycles newest first; keep them oldest to newest here. */
  return [...office.learning.data.cycles]
    .sort((left, right) => left.startedAt - right.startedAt)
    .map((cycle) => cycle.learning?.recordId)
    .filter((recordId): recordId is string => typeof recordId === "string");
}

function operationsFor(office: ExecutiveOfficeState): Operation[] {
  const activation = office.activation;
  const learning = office.learning;
  const waiting = waitingCount(office);
  const runtimeAnswered = [office.operations, office.activation, office.learning].some((read) => read.status === "ok");
  const runtimeFailed = [office.operations, office.activation, office.learning].every((read) => read.status === "error");
  const lastCycle =
    learning.status === "ok"
      ? [...learning.data.cycles].sort((left, right) => right.startedAt - left.startedAt)[0]
      : undefined;

  return [
    {
      id: "chief-agent",
      label: "Chief Agent",
      icon: BrainCircuit,
      status: activation.status === "ok" ? (activation.data.active ? "Active" : activation.data.state) : activation.status === "error" ? "Unreadable" : "Checking…",
      detail: activation.status === "ok" ? (AUTONOMY_LABEL[activation.data.autonomyLevel ?? ""] ?? activation.data.autonomyLevel ?? "No autonomy") : activation.status === "error" ? activation.message : "Reading activation",
      tone: activation.status === "ok" ? (activation.data.active ? "healthy" : "warning") : activation.status === "error" ? "error" : "active",
    },
    {
      id: "learning",
      label: "Learning",
      icon: GraduationCap,
      status: learning.status === "ok" ? (learning.data.running ? "Learning now" : lastCycle ? `${lastCycle.outcome.toLowerCase().replace(/_/g, " ")}` : "No cycle yet") : learning.status === "error" ? "Unreadable" : "Checking…",
      detail: learning.status === "ok" ? `${relativeTime(lastCycle?.completedAt ?? lastCycle?.startedAt)} · ${learning.data.pendingCommits.length} commit${learning.data.pendingCommits.length === 1 ? "" : "s"} waiting` : learning.status === "error" ? learning.message : "Reading cycles",
      tone: learning.status === "ok" ? (lastCycle?.outcome === "FAILED" ? "error" : lastCycle?.outcome === "HELD" ? "warning" : learning.data.running ? "active" : "healthy") : learning.status === "error" ? "error" : "active",
    },
    {
      id: "approvals",
      label: "Approvals",
      icon: ShieldCheck,
      status: waiting === null ? "Checking…" : `${waiting} waiting`,
      detail: waiting === null ? "Reading approvals" : waiting === 0 ? "Nothing needs you" : "Your decision needed",
      tone: waiting === null ? "active" : waiting > 0 ? "warning" : "healthy",
    },
    {
      id: "runtime",
      label: "Runtime",
      icon: ServerCog,
      status: runtimeAnswered ? "Online" : runtimeFailed ? "Offline" : "Checking…",
      detail: runtimeAnswered ? "Answering reads" : runtimeFailed ? "No answer" : "Connecting",
      tone: runtimeAnswered ? "healthy" : runtimeFailed ? "error" : "active",
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldAlert,
      status: "2 high",
      detail: "Preview · F-18, signed-out role",
      tone: "warning",
    },
  ];
}

function metricsFor(office: ExecutiveOfficeState): ExecutiveRibbonMetric[] {
  const waiting = waitingCount(office);
  const learned = learnedRecords(office);

  return [
    {
      id: "approvals",
      label: "Pending Approvals",
      value: waiting === null ? "—" : String(waiting),
      detail: waiting === null ? "Reading Runtime" : waiting === 0 ? "Nothing waiting for you" : "Waiting for your decision",
      icon: KnowledgeHealthIcon,
      accent: "text-amber-300",
      surface: "bg-amber-400/15",
    },
    {
      id: "learned",
      label: "Learned Since Activation",
      value: office.learning.status === "ok" ? String(learned.length) : "—",
      detail: learned.length > 0 ? `Latest: ${learned[learned.length - 1]}` : "Learning Records from engineering work",
      icon: EvidenceCoverageIcon,
      accent: "text-violet-300",
      surface: "bg-violet-400/15",
    },
    {
      id: "canonical",
      label: "Canonical Knowledge",
      value: office.knowledge.status === "ok" ? String(office.knowledge.data.canonicalItems) : "—",
      detail: "Items the Chief Agent reasons with",
      icon: CanonicalKnowledgeIcon,
      accent: "text-cyan-300",
      surface: "bg-cyan-400/15",
    },
  ];
}

function AgentMark({ tone }: { tone: PreviewTone }) {
  return (
    <span
      className={cn(
        "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px]",
        "border border-amber-300/45 ring-1 ring-inset ring-cyan-300/20",
        "bg-[radial-gradient(circle_at_30%_20%,rgba(247,215,116,.22),transparent_55%),linear-gradient(145deg,rgba(37,99,235,.18),rgba(8,47,73,.12))]",
        "shadow-[0_0_0_1px_rgba(247,215,116,.12),0_0_28px_rgba(247,215,116,.20),0_0_44px_rgba(37,99,235,.18),inset_0_1px_0_rgba(255,255,255,.10)]",
      )}
    >
      <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 ${toneDot[tone]} shadow-[0_0_12px_rgba(110,231,183,.85)]`} />
      <BrainCircuit aria-hidden="true" className="h-8 w-8 text-amber-200" strokeWidth={1.6} />
    </span>
  );
}

function Identity({ office }: { office: ExecutiveOfficeState }) {
  const briefing = useExecutiveBriefing();
  const activation = office.activation;
  const autonomy =
    activation.status === "ok"
      ? activation.data.active
        ? AUTONOMY_LABEL[activation.data.autonomyLevel ?? ""] ?? activation.data.autonomyLevel ?? "No autonomy"
        : `Not active (${activation.data.state})`
      : activation.status === "error"
        ? "Unreadable"
        : "Checking…";
  const autonomyTone: PreviewTone =
    activation.status === "ok" ? (activation.data.active ? "healthy" : "warning") : activation.status === "error" ? "error" : "active";

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-start gap-5">
        <AgentMark tone={autonomyTone} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80 backdrop-blur-xl">
              Executive Office
            </span>
            <DesignPreviewBadge wiring="partial" />
          </div>
          <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
            <span className="text-gradient-lumina">Chief</span>{" "}
            <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">Agent</span>
          </h1>
        </div>
      </div>

      <h2 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-cyan">
        What should happen next?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
        {briefing.headline}
      </p>

      <div className="mt-6 grid gap-3 rounded-[20px] border border-white/[0.08] bg-slate-950/40 p-4">
        <div className="flex items-center gap-3">
          <ExecutivePremiumIcon icon={Gavel} state={autonomyTone} />
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Autonomy</div>
            <div className={`text-base font-semibold ${toneText[autonomyTone]}`}>{autonomy}</div>
          </div>
        </div>
        <p className="text-xs leading-5 text-sky-300/60">
          The Chief Agent reasons and proposes. It cannot approve, execute, delegate, or spend (ADR-0041). You decide.
        </p>
        <div className="text-[10px] uppercase tracking-[0.14em] text-sky-300/60">
          Current mission · <span className="text-amber-200">{currentMission.title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <NotWiredButton tone="warning">Suspend</NotWiredButton>
          <button
            type="button"
            disabled={office.learningNow}
            onClick={() => void learnNow()}
            title="Learn from every owner commit since the last learning checkpoint"
            className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60 ${tonePill.active}`}
          >
            {office.learningNow ? "Learning…" : "Learn now"}
          </button>
        </div>
        {office.learnNowMessage ? (
          <p className="text-xs leading-5 text-sky-200/80" aria-live="polite">{office.learnNowMessage}</p>
        ) : null}
      </div>
    </div>
  );
}

function Heartbeat({ operations }: { operations: Operation[] }) {
  const attention = operations.some((operation) => operation.tone === "warning" || operation.tone === "error");

  return (
    <section
      aria-label="Executive heartbeat"
      className={cn(
        "relative min-w-0 overflow-hidden",
        executiveMaterial.primary.radius,
        executiveMaterial.primary.border,
        executiveMaterial.primary.glass,
        executiveMaterial.primary.shadow,
      )}
    >
      <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-[9%] top-0 h-px", lighting.executiveReflection)} />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.04] text-white/85">
              <RadioTower aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">Executive heartbeat</p>
              <p className="mt-0.5 truncate text-[9px] text-white/40">Chief Agent and governance state</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] ${attention ? "border-amber-300/30 text-amber-100" : "border-emerald-300/30 text-emerald-100"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${attention ? "bg-amber-300" : "bg-emerald-300"}`} />
            {attention ? "Attention" : "Nominal"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          {operations.map((operation) => (
            <div
              key={operation.id}
              className="flex min-w-0 flex-col gap-2.5 border-b border-r border-white/[0.055] px-4 py-4 transition-colors duration-300 hover:bg-white/[0.035] xl:border-b-0 xl:last:border-r-0"
            >
              <div className="flex items-center justify-between gap-2">
                <ExecutivePremiumIcon icon={operation.icon} state={operation.tone} />
                <span className={`h-2 w-2 rounded-full ${toneDot[operation.tone]}`} />
              </div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{operation.label}</div>
              <div className={`truncate text-sm font-semibold ${toneText[operation.tone]}`}>{operation.status}</div>
              <div className="truncate text-[11px] text-white/45" title={operation.detail}>{operation.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ChiefAgentCommandDeck() {
  const office = useExecutiveOffice();
  const operations = operationsFor(office);
  const metrics = metricsFor(office);

  return (
    <header
      className={cn(
        "group relative min-w-0 overflow-hidden",
        "rounded-[30px]",
        "border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20",
        "bg-slate-950/[0.48] backdrop-blur-[44px] backdrop-saturate-[170%]",
        "shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.20),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.22),transparent_34%),radial-gradient(circle_at_78%_30%,rgba(67,56,202,.16),transparent_32%),radial-gradient(circle_at_95%_90%,rgba(34,211,238,.06),transparent_24%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[7%] top-0 h-px opacity-90 [background:linear-gradient(90deg,transparent_0%,rgba(96,165,250,.10)_12%,rgba(247,215,116,.42)_34%,rgba(255,255,255,.62)_50%,rgba(125,211,252,.28)_69%,rgba(59,130,246,.08)_88%,transparent_100%)]"
      />

      <div className="relative z-10 grid gap-8 px-8 py-8 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)]">
        <Identity office={office} />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <ExecutiveMetricCard key={metric.id} metric={metric} />
            ))}
          </div>
          <Heartbeat operations={operations} />
        </div>
      </div>
    </header>
  );
}
