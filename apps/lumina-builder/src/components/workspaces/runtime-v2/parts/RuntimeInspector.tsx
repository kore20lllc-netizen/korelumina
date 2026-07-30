import type {
  ComponentType,
  ReactNode,
} from "react";

import {
  Activity,
  CalendarClock,
  CircleDot,
  Cpu,
  Gauge,
  Globe2,
  HeartPulse,
  Layers3,
  MapPin,
  MemoryStick,
  Timer,
  TriangleAlert,
  Zap,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  LuminaButton,
  type LuminaButtonProps,
} from "@/components/lumina/LuminaButton";

import {
  LuminaInspectorSection,
  LuminaPanelHeader,
} from "@/components/lumina/workspace";

import {
  RuntimeEmptyState,
} from "./RuntimeEmptyState";

import {
  RuntimeHealthBadge,
} from "./RuntimeHealthBadge";

import {
  cn,
} from "@/lib/utils";

import type {
  LogEntry,
  RuntimeAction,
  RuntimeProject,
  RuntimeScenario,
} from "@/services/runtime/types";

type ButtonVariant = NonNullable<
  LuminaButtonProps["variant"]
>;

interface ScenarioDefinition {
  scenario: RuntimeScenario;
  label: string;
  description: string;
  variant: ButtonVariant;

  icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
}

const SCENARIOS:
  ScenarioDefinition[] = [
    {
      scenario: "idle",
      label: "Idle",
      description:
        "Apply a low-activity runtime profile.",
      variant: "toolbar",
      icon: Activity,
    },
    {
      scenario: "spike",
      label: "Spike",
      description:
        "Apply a high-load runtime profile.",
      variant: "warning",
      icon: Zap,
    },
    {
      scenario: "outage",
      label: "Outage",
      description:
        "Apply a controlled outage profile.",
      variant: "danger",
      icon: TriangleAlert,
    },
    {
      scenario: "recover",
      label: "Recover",
      description:
        "Apply the runtime recovery profile.",
      variant: "success",
      icon: HeartPulse,
    },
  ];

export interface RuntimeInspectorProps {
  project: RuntimeProject | null;

  logs: LogEntry[];

  pending: Record<
    string,
    boolean
  >;

  onDispatch: (
    action: RuntimeAction,
    projectId: string,
  ) => Promise<void>;

  onScenario?: (
    scenario: RuntimeScenario,
    projectId: string,
  ) => Promise<void>;

  scenarioPending?:
    RuntimeScenario | null;

  className?: string;
}

function titleCase(
  value: string,
): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

function formatUptime(
  uptimeMs: number,
): string {
  if (
    !Number.isFinite(
      uptimeMs,
    ) ||
    uptimeMs <= 0
  ) {
    return "Not running";
  }

  const totalSeconds =
    Math.floor(
      uptimeMs / 1_000,
    );

  const days =
    Math.floor(
      totalSeconds /
        86_400,
    );

  const hours =
    Math.floor(
      (
        totalSeconds %
        86_400
      ) / 3_600,
    );

  const minutes =
    Math.floor(
      (
        totalSeconds %
        3_600
      ) / 60,
    );

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${totalSeconds}s`;
}

function formatStartedAt(
  timestamp: number,
): string {
  if (
    !Number.isFinite(
      timestamp,
    ) ||
    timestamp <= 0
  ) {
    return "Not started";
  }

  return new Date(
    timestamp,
  ).toLocaleString();
}

function formatMemory(
  usedMb: number,
  totalMb: number,
): string {
  if (
    !Number.isFinite(
      usedMb,
    )
  ) {
    return "Unavailable";
  }

  if (
    !Number.isFinite(
      totalMb,
    ) ||
    totalMb <= 0
  ) {
    return `${usedMb.toFixed(1)} MB`;
  }

  const percent =
    (
      usedMb /
      totalMb
    ) * 100;

  return (
    `${usedMb.toFixed(1)} MB · ` +
    `${percent.toFixed(2)}%`
  );
}

export function RuntimeInspector({
  project,
  onScenario,
  scenarioPending = null,
  className,
}: RuntimeInspectorProps) {
  if (!project) {
    return (
      <div
        className={cn(
          "h-full",
          className,
        )}
      >
        <RuntimeEmptyState
          variant="projects"
        />
      </div>
    );
  }

  const activeScenario =
    project.scenario ??
    "normal";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <LuminaPanelHeader
        title={project.name}
        subtitle={[
          project.env,
          project.region,
          project.version,
        ].join(" · ")}
        leading={
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Runtime Inspector
          </div>
        }
        trailing={
          <RuntimeHealthBadge
            status={
              project.health.status
            }
            score={
              project.health.score
            }
          />
        }
      />

      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList
          className={cn(
            "mx-5 mt-5 self-start rounded-2xl border p-1.5 shadow-[0_10px_36px_rgba(0,0,0,.18)]",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-interactive)]",
          )}
        >
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>

          <TabsTrigger value="process">
            Process
          </TabsTrigger>

          <TabsTrigger value="configuration">
            Config
          </TabsTrigger>

          <TabsTrigger value="recovery">
            Recovery
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="m-0 min-h-0 flex-1 overflow-y-auto p-5"
        >
          <div className="space-y-7">
            <LuminaInspectorSection>
              <SectionLabel>
                Runtime identity
              </SectionLabel>

              <DetailGroup>
                <DetailRow
                  icon={Globe2}
                  label="Environment"
                  value={titleCase(
                    project.env,
                  )}
                />

                <DetailRow
                  icon={MapPin}
                  label="Region"
                  value={project.region}
                />

                <DetailRow
                  icon={Layers3}
                  label="Framework"
                  value={project.version}
                />

                <DetailRow
                  icon={CircleDot}
                  label="State"
                  value={titleCase(
                    project.state,
                  )}
                />
              </DetailGroup>
            </LuminaInspectorSection>

            <LuminaInspectorSection>
              <SectionLabel>
                Lifecycle
              </SectionLabel>

              <DetailGroup>
                <DetailRow
                  icon={CalendarClock}
                  label="Started"
                  value={formatStartedAt(
                    project.startedAt,
                  )}
                  stacked
                />

                <DetailRow
                  icon={Timer}
                  label="Uptime"
                  value={formatUptime(
                    project.uptimeMs,
                  )}
                />
              </DetailGroup>
            </LuminaInspectorSection>

            <LuminaInspectorSection>
              <div className="flex items-center justify-between gap-4">
                <SectionLabel>
                  Health diagnosis
                </SectionLabel>

                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {project.health.score}
                  /100
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {project.health.reasons.length >
                0 ? (
                  project.health.reasons.map(
                    (reason) => (
                      <div
                        key={reason}
                        className={cn(
                          "flex gap-4 border px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,.12)]",
                          "[border-radius:var(--lumina-radius-inner)]",
                          "[border-color:var(--lumina-border-standard)]",
                          "[background:var(--lumina-surface-compact)]",
                        )}
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />

                        <span className="text-xs leading-5 text-foreground/90">
                          {reason}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <EmptyDetail>
                    No health signals reported.
                  </EmptyDetail>
                )}
              </div>
            </LuminaInspectorSection>
          </div>
        </TabsContent>

        <TabsContent
          value="process"
          className="m-0 min-h-0 flex-1 overflow-y-auto p-5"
        >
          <LuminaInspectorSection>
            <SectionLabel>
              Live process
            </SectionLabel>

            <DetailGroup>
              <DetailRow
                icon={Cpu}
                label="CPU"
                value={`${project.metrics.cpuPct.toFixed(2)}%`}
              />

              <DetailRow
                icon={MemoryStick}
                label="Memory"
                value={formatMemory(
                  project.metrics.memUsedMb,
                  project.metrics.memTotalMb,
                )}
                stacked
              />

              <DetailRow
                icon={Gauge}
                label="Requests / sec"
                value={project.metrics.rps.toFixed(1)}
              />

              <DetailRow
                icon={Timer}
                label="p95 latency"
                value={`${project.metrics.p95Ms.toFixed(0)} ms`}
              />

              <DetailRow
                icon={TriangleAlert}
                label="Error rate"
                value={`${project.metrics.errorRatePct.toFixed(2)}%`}
              />
            </DetailGroup>
          </LuminaInspectorSection>
        </TabsContent>

        <TabsContent
          value="configuration"
          className="m-0 min-h-0 flex-1 overflow-y-auto p-5"
        >
          <LuminaInspectorSection>
            <SectionLabel>
              Runtime configuration
            </SectionLabel>

            <DetailGroup>
              <DetailRow
                icon={Globe2}
                label="Environment"
                value={project.env}
              />

              <DetailRow
                icon={Layers3}
                label="Framework"
                value={project.version}
              />

              <DetailRow
                icon={MapPin}
                label="Region"
                value={project.region}
              />

              <DetailRow
                icon={CircleDot}
                label="Scenario"
                value={titleCase(
                  activeScenario,
                )}
              />
            </DetailGroup>
          </LuminaInspectorSection>
        </TabsContent>

        <TabsContent
          value="recovery"
          className="m-0 min-h-0 flex-1 overflow-y-auto p-5"
        >
          <div className="space-y-7">
            <LuminaInspectorSection>
              <div className="flex items-center justify-between gap-4">
                <SectionLabel>
                  Runtime scenario
                </SectionLabel>

                <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-cyan">
                  {titleCase(
                    activeScenario,
                  )}
                </span>
              </div>

              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Apply controlled runtime conditions for operational validation and Chief Agent training.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {SCENARIOS.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const active =
                      activeScenario ===
                      item.scenario;

                    const isPending =
                      scenarioPending ===
                      item.scenario;

                    const disabled =
                      scenarioPending !==
                      null;

                    return (
                      <LuminaButton
                        key={item.scenario}
                        type="button"
                        variant={item.variant}
                        size="sm"
                        disabled={disabled}
                        aria-pressed={active}
                        aria-busy={isPending}
                        title={item.description}
                        className={cn(
                          "justify-start min-h-11",
                          active && [
                            "ring-2 scale-[1.02]",
                            "ring-cyan/80",
                            "brightness-110",
                            "[box-shadow:0_0_24px_hsl(var(--cyan)/0.48)]",
                          ],
                          isPending &&
                            "animate-pulse",
                          disabled &&
                            "cursor-wait opacity-75",
                        )}
                        onClick={() => {
                          if (!onScenario) {
                            return;
                          }

                          void onScenario(
                            item.scenario,
                            project.id,
                          );
                        }}
                      >
                        <Icon
                          className="h-3.5 w-3.5"
                          strokeWidth={1.75}
                        />

                        {item.label}
                      </LuminaButton>
                    );
                  },
                )}
              </div>

              {!onScenario && (
                <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                  Scenario API is disconnected.
                </div>
              )}
            </LuminaInspectorSection>

            <LuminaInspectorSection>
              <SectionLabel>
                Control status
              </SectionLabel>

              <div className="mt-3 space-y-2">
                <StatusCheck
                  label="Runtime selected"
                  healthy
                />

                <StatusCheck
                  label="Scenario API connected"
                  healthy={Boolean(
                    onScenario,
                  )}
                />

                <StatusCheck
                  label="Scenario synchronized"
                  healthy={
                    scenarioPending ===
                    null
                  }
                />

                <StatusCheck
                  label="Runtime process alive"
                  healthy={
                    project.state ===
                    "running"
                  }
                />
              </div>
            </LuminaInspectorSection>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionLabel({
  children,
}: {
  children: string;
}) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/80">
      {children}
    </div>
  );
}

function DetailGroup({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-4 overflow-hidden border divide-y shadow-[0_8px_28px_rgba(0,0,0,.16)]",
        "[border-radius:var(--lumina-radius-inner)]",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
        "[&>*]:[border-color:var(--lumina-border-standard)]",
      )}
    >
      {children}
    </div>
  );
}

interface DetailRowProps {
  icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  label: string;
  value: string;
  stacked?: boolean;
}

function DetailRow({
  icon: Icon,
  label,
  value,
  stacked = false,
}: DetailRowProps) {
  return (
    <div className="flex gap-4 px-5 py-4">
      <Icon
        className="mt-1 h-4.5 w-4.5 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
      />

      <div
        className={cn(
          "min-w-0 flex-1",
          stacked
            ? "space-y-1"
            : "flex items-center justify-between gap-4",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.20em] text-muted-foreground">
          {label}
        </span>

        <span
          className={cn(
            "min-w-0 text-sm font-semibold tracking-[-0.02em] tabular-nums text-foreground",
            stacked
              ? "break-words"
              : "truncate text-right",
          )}
          title={value}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StatusCheck({
  label,
  healthy,
}: {
  label: string;
  healthy: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border px-4 py-4 shadow-[0_8px_22px_rgba(0,0,0,.12)]",
        "[border-radius:var(--lumina-radius-inner)]",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
      )}
    >
      <span className="text-sm font-medium text-foreground">
        {label}
      </span>

      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          healthy
            ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.62)]"
            : "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,.58)]",
        )}
      />
    </div>
  );
}

function EmptyDetail({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border px-5 py-6 text-center text-sm text-muted-foreground",
        "[border-radius:var(--lumina-radius-inner)]",
        "[border-color:var(--lumina-border-standard)]",
        "[background:var(--lumina-surface-compact)]",
      )}
    >
      {children}
    </div>
  );
}

export default RuntimeInspector;
