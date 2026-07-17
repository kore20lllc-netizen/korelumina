import {
  Activity,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  Database,
  MessagesSquare,
  Network,
  RadioTower,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  LuminaButton,
} from "@/components/lumina/LuminaButton";

import {
  LuminaWorkspacePanel,
  LuminaWorkspaceToolbar,
} from "@/components/lumina/workspace";

import {
  KnowledgeOperationCard,
} from "./KnowledgeOperationCard";

import type {
  KnowledgeOperationAccent,
} from "./KnowledgeOperationCard";

import type {
  KnowledgeWorkspace,
} from "../workspaces";

export interface KnowledgeWorkspaceToolbarProps {
  activeWorkspace: KnowledgeWorkspace;
  onWorkspaceChange(
    workspace: KnowledgeWorkspace,
  ): void;
  onRefresh(): void;
}

interface OperationDefinition {
  value: KnowledgeWorkspace;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: KnowledgeOperationAccent;
}

const OPERATIONS: OperationDefinition[] = [
  {
    value: "overview",
    label: "Overview",
    description:
      "Executive knowledge posture, readiness, health, and priority state.",
    icon: Activity,
    accent: "cyan",
  },
  {
    value: "acquisition",
    label: "Acquisition",
    description:
      "Authoritative sources, ingestion pipelines, failures, and recovery.",
    icon: RadioTower,
    accent: "emerald",
  },
  {
    value: "evidence",
    label: "Evidence",
    description:
      "Evidence processing, validation, provenance, and acceptance state.",
    icon: Database,
    accent: "violet",
  },
  {
    value: "graph",
    label: "Knowledge Graph",
    description:
      "Relationships, lineage, topology, traversal, and graph integrity.",
    icon: Network,
    accent: "blue",
  },
  {
    value: "canonical",
    label: "Canonical Review",
    description:
      "Human-governed promotion, publication, confidence, and version history.",
    icon: BookOpenCheck,
    accent: "gold",
  },
  {
    value: "learning",
    label: "Learning",
    description:
      "Validated patterns, organizational improvement, and promotion readiness.",
    icon: BrainCircuit,
    accent: "magenta",
  },
  {
    value: "conversations",
    label: "Conversations",
    description:
      "Historical engineering ingestion, decision recovery, and provenance.",
    icon: MessagesSquare,
    accent: "blue",
  },
  {
    value: "certifications",
    label: "Certifications",
    description:
      "Verified UI, functional, governance, build, and consumption assurance.",
    icon: BadgeCheck,
    accent: "cyan",
  },
  {
    value: "governance",
    label: "Governance",
    description:
      "Policies, authority, reviews, approvals, exceptions, and audit history.",
    icon: ShieldCheck,
    accent: "orange",
  },
];

const WORKSPACE_LABELS: Record<
  KnowledgeWorkspace,
  string
> = {
  overview: "Overview",
  acquisition: "Acquisition",
  evidence: "Evidence",
  graph: "Knowledge Graph",
  canonical: "Canonical Review",
  learning: "Learning",
  conversations: "Conversations",
  certifications: "Certifications",
  governance: "Governance",
};

export function KnowledgeWorkspaceToolbar({
  activeWorkspace,
  onWorkspaceChange,
  onRefresh,
}: KnowledgeWorkspaceToolbarProps) {
  return (
    <div className="space-y-4">
      <LuminaWorkspaceToolbar
        leading={
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Active operational domain
            </div>

            <div className="mt-1 truncate text-sm font-semibold text-foreground">
              {WORKSPACE_LABELS[activeWorkspace]}
            </div>
          </div>
        }
        center={
          <div className="hidden min-w-0 flex-1 md:block">
            <div className="truncate text-xs text-muted-foreground">
              Governed knowledge processing, validation, preservation, and Chief Agent readiness
            </div>
          </div>
        }
        trailing={
          <div className="flex items-center gap-2">
            <LuminaButton
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title="Universal knowledge search requires the authoritative search service."
            >
              <Search className="h-3.5 w-3.5" />
              Search
            </LuminaButton>

            <LuminaButton
              type="button"
              variant="toolbar"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </LuminaButton>
          </div>
        }
      />

      <LuminaWorkspacePanel
        title="Knowledge Operations"
        subtitle="Select an operational domain"
        className="h-auto p-0"
      >
        <div
          role="navigation"
          aria-label="Knowledge operational domains"
          className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2"
        >
          {OPERATIONS.map(
            ({
              value,
              label,
              description,
              icon,
              accent,
            }) => (
              <KnowledgeOperationCard
                key={value}
                title={label}
                description={description}
                icon={icon}
                accent={accent}
                active={
                  activeWorkspace === value
                }
                onClick={() => {
                  onWorkspaceChange(
                    value,
                  );
                }}
              />
            ),
          )}
        </div>
      </LuminaWorkspacePanel>
    </div>
  );
}

export default KnowledgeWorkspaceToolbar;
