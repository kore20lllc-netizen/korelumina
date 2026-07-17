import {
  Activity,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Database,
  GitPullRequestArrow,
  MessagesSquare,
  Network,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import type {
  KnowledgeOperationsSnapshot,
} from "@korelumina/platform-sdk";

import {
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

import type {
  KnowledgeWorkspace,
} from "../workspaces";

export interface KnowledgeWorkspaceSidebarProps {
  activeWorkspace: KnowledgeWorkspace;
  snapshot: KnowledgeOperationsSnapshot | null;
  onWorkspaceChange(
    workspace: KnowledgeWorkspace,
  ): void;
}

interface NavigationItem {
  value: KnowledgeWorkspace;
  label: string;
  description: string;
  icon: LucideIcon;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    value: "overview",
    label: "Overview",
    description: "Executive knowledge posture",
    icon: Activity,
  },
  {
    value: "acquisition",
    label: "Acquisition",
    description: "Sources and ingestion",
    icon: RadioTower,
  },
  {
    value: "evidence",
    label: "Evidence",
    description: "Processing and validation",
    icon: Database,
  },
  {
    value: "graph",
    label: "Knowledge Graph",
    description: "Relationships and lineage",
    icon: Network,
  },
  {
    value: "canonical",
    label: "Canonical Review",
    description: "Human-governed promotion",
    icon: BookOpenCheck,
  },
  {
    value: "learning",
    label: "Learning",
    description: "Validated organizational improvement",
    icon: BrainCircuit,
  },
  {
    value: "conversations",
    label: "Conversations",
    description: "Historical engineering ingestion",
    icon: MessagesSquare,
  },
  {
    value: "certifications",
    label: "Certifications",
    description: "Operational assurance",
    icon: BadgeCheck,
  },
  {
    value: "governance",
    label: "Governance",
    description: "Authority, policy, and audit",
    icon: ShieldCheck,
  },
];

function formatReadiness(
  value: number | undefined,
): string {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "Awaiting telemetry";
  }

  const normalized =
    value <= 1
      ? value * 100
      : value;

  return `${Math.round(
    Math.max(
      0,
      Math.min(
        100,
        normalized,
      ),
    ),
  )}% readiness`;
}

export function KnowledgeWorkspaceSidebar({
  activeWorkspace,
  snapshot,
  onWorkspaceChange,
}: KnowledgeWorkspaceSidebarProps) {
  return (
    <LuminaWorkspacePanel
      title="Knowledge Operations"
      subtitle="Operational domains"
      className="min-h-[42rem] overflow-hidden p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <nav
          aria-label="Knowledge Operations"
          className="flex-1 space-y-1.5 overflow-y-auto p-3"
        >
          {NAVIGATION_ITEMS.map(
            ({
              value,
              label,
              description,
              icon: Icon,
            }) => {
              const active =
                activeWorkspace === value;

              return (
                <button
                  key={value}
                  type="button"
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  onClick={() => {
                    onWorkspaceChange(
                      value,
                    );
                  }}
                  className={[
                    "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left",
                    "transition-[background-color,border-color,box-shadow] duration-200",
                    active
                      ? [
                          "[border-color:var(--lumina-border-emphasis)]",
                          "[background:var(--lumina-surface-selected)]",
                          "[box-shadow:var(--lumina-shadow-selected)]",
                        ].join(" ")
                      : [
                          "border-transparent",
                          "hover:[border-color:var(--lumina-border-standard)]",
                          "hover:[background:var(--lumina-surface-interactive)]",
                        ].join(" "),
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      active
                        ? [
                            "[border-color:var(--lumina-border-emphasis)]",
                            "[background:var(--lumina-surface-selected)]",
                          ].join(" ")
                        : [
                            "[border-color:var(--lumina-border-standard)]",
                            "[background:var(--lumina-surface-compact)]",
                          ].join(" "),
                    ].join(" ")}
                  >
                    <Icon
                      className={[
                        "h-4 w-4",
                        active
                          ? "text-cyan"
                          : "text-muted-foreground group-hover:text-foreground",
                      ].join(" ")}
                      strokeWidth={1.75}
                    />
                  </span>

                  <span className="min-w-0">
                    <span
                      className={[
                        "block truncate text-xs font-semibold",
                        active
                          ? "text-foreground"
                          : "text-foreground/90",
                      ].join(" ")}
                    >
                      {label}
                    </span>

                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {description}
                    </span>
                  </span>
                </button>
              );
            },
          )}
        </nav>

        <footer className="border-t p-3 [border-color:var(--lumina-border-standard)]">
          <div
            className={[
              "rounded-2xl border p-3",
              "[border-color:var(--lumina-border-standard)]",
              "[background:var(--lumina-surface-compact)]",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <div
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                <GitPullRequestArrow
                  className="h-4 w-4 text-violet-200"
                  strokeWidth={1.75}
                />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Chief Agent supply
                </div>

                <div className="mt-1 truncate text-xs font-medium text-foreground">
                  {formatReadiness(
                    snapshot?.summary.healthScore,
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[10px] leading-4 text-muted-foreground">
              Knowledge Operations exposes governed readiness and consumption status. Chief Agent interaction remains outside this workspace.
            </div>
          </div>
        </footer>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default KnowledgeWorkspaceSidebar;
