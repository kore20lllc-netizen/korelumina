import {
  Archive,
  BookOpenText,
  GitCommitHorizontal,
  Landmark,
  MessagesSquare,
  ScrollText,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  cn,
} from "@/lib/utils";

import type {
  EducationalArtifact,
} from "../model";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LearningStatusBadge,
  flagshipAppearance,
} from "../presentation";

interface GenesisCorpusOverviewProps {
  artifacts: EducationalArtifact[];
  selectedCategory: string;
  onCategoryChange(category: string): void;
}

const CATEGORIES = [
  {
    id: "all",
    label: "All sources",
    description:
      "Complete modeled Genesis foundation",
    icon: Archive,
    iconState: "active" as const,
  },
  {
    id: "constitutional",
    label: "Constitutional evolution",
    description:
      "Canon, Constitution and amendments",
    icon: Landmark,
    iconState: "warning" as const,
  },
  {
    id: "architecture",
    label: "Architectural evolution",
    description:
      "Architecture, reconciliations and decisions",
    icon: ScrollText,
    iconState: "active" as const,
  },
  {
    id: "history",
    label: "Repository chronology",
    description:
      "Recovery, missions and operational history",
    icon: GitCommitHorizontal,
    iconState: "active" as const,
  },
  {
    id: "documentation",
    label: "Approved documentation",
    description:
      "Governing and instructional material",
    icon: BookOpenText,
    iconState: "healthy" as const,
  },
  {
    id: "conversation",
    label: "Educational conversations",
    description:
      "Validated conversations and decision history",
    icon: MessagesSquare,
    iconState: "warning" as const,
  },
] as const;

function countByCategory(
  artifacts: EducationalArtifact[],
  category: string,
): number {
  if (category === "all") {
    return artifacts.length;
  }

  if (category === "constitutional") {
    return artifacts.filter(
      (artifact) =>
        artifact.kind === "canon" ||
        artifact.kind === "constitution" ||
        artifact.kind === "amendment",
    ).length;
  }

  if (category === "architecture") {
    return artifacts.filter(
      (artifact) =>
        artifact.kind === "architecture" ||
        artifact.kind === "reconciliation" ||
        artifact.kind === "adr" ||
        artifact.kind === "edr" ||
        artifact.kind === "decision",
    ).length;
  }

  if (category === "history") {
    return artifacts.filter(
      (artifact) =>
        artifact.kind === "mission" ||
        artifact.kind === "runtime-documentation",
    ).length;
  }

  if (category === "conversation") {
    return artifacts.filter(
      (artifact) =>
        artifact.kind === "conversation",
    ).length;
  }

  return artifacts.filter(
    (artifact) =>
      artifact.kind !== "conversation" &&
      artifact.kind !== "mission",
  ).length;
}

export function GenesisCorpusOverview({
  artifacts,
  selectedCategory,
  onCategoryChange,
}: GenesisCorpusOverviewProps) {
  return (
    <LuminaFlagshipPanel
      title="Genesis Corpus"
      description="Historical educational foundation assembled from governed repository, documentation, decision and conversation sources"
      emphasis="strong"
      toolbar={
        <LearningStatusBadge tone="complete">
          Lineage continuous
        </LearningStatusBadge>
      }
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map(
          ({
            id,
            label,
            description,
            icon: Icon,
            iconState,
          }) => {
            const active =
              selectedCategory === id;

            return (
              <LuminaFlagshipCard
                key={id}
                as="button"
                interactive
                selected={active}
                onClick={() => {
                  onCategoryChange(id);
                }}
                aria-pressed={active}
                className={cn(
                  "p-4 text-left",
                  active
                    ? [
                        "border-cyan-200/62",
                        "bg-[linear-gradient(135deg,rgba(8,27,62,0.80),rgba(31,17,67,0.68),rgba(6,24,55,0.76))]",
                        "ring-0",
                        "shadow-[inset_0_1px_0_rgba(186,230,253,0.10),0_0_26px_rgba(34,211,238,0.12),0_16px_36px_rgba(2,6,23,0.24)]",
                      ].join(" ")
                    : [
                        "bg-[linear-gradient(135deg,rgba(3,12,35,0.64),rgba(15,12,42,0.54),rgba(3,14,37,0.62))]",
                        "shadow-[inset_0_1px_0_rgba(186,230,253,0.07),0_0_18px_rgba(37,99,235,0.10),0_12px_28px_rgba(2,6,23,0.17)]",
                        "hover:bg-[linear-gradient(135deg,rgba(5,18,49,0.76),rgba(24,16,58,0.64),rgba(5,20,48,0.72))]",
                        "hover:shadow-[inset_0_1px_0_rgba(186,230,253,0.08),0_16px_34px_rgba(2,6,23,0.24)]",
                      ].join(" "),
                )}
              >

                <div className="relative flex items-start justify-between gap-4">
                  <div className="shrink-0">
                    <ExecutivePremiumIcon
                      icon={Icon}
                      state={iconState}
                    />
                  </div>

                  <span
                    className={cn(
                      "text-2xl font-semibold tracking-[-0.03em]",
                      active
                        ? "text-cyan-100"
                        : "text-sky-200",
                    )}
                  >
                    {countByCategory(
                      artifacts,
                      id,
                    )}
                  </span>
                </div>

                <div
                  className={cn(
                    "relative mt-4 text-sm font-semibold",
                    active
                      ? "text-amber-400"
                      : "text-sky-200",
                  )}
                >
                  {label}
                </div>

                <div className="relative mt-1 text-xs leading-5 text-sky-500/76">
                  {description}
                </div>

                <div
                  className={cn(
                    "relative mt-4 h-px w-full",
                    active
                      ? "bg-gradient-to-r from-cyan-300/44 via-violet-300/22 to-transparent"
                      : "bg-cyan-300/10",
                  )}
                />
              </LuminaFlagshipCard>
            );
          },
        )}
      </div>
    </LuminaFlagshipPanel>
  );
}
