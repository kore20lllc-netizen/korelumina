import type React from "react";

import {
  KnowledgeHealthIcon,
  EvidenceCoverageIcon,
  CanonicalKnowledgeIcon,
} from "./ExecutiveOperationIcons";

export type ExecutiveRibbonMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  surface: string;
};

export function getExecutiveRibbonMetrics(): ExecutiveRibbonMetric[] {
  return [
    {
      id: "knowledge-health",
      label: "Knowledge Health",
      value: "—",
      detail: "Runtime unavailable",
      icon: KnowledgeHealthIcon,
      accent: "text-emerald-300",
      surface: "bg-emerald-400/15",
    },
    {
      id: "evidence",
      label: "Evidence Coverage",
      value: "—",
      detail: "Awaiting pipeline",
      icon: EvidenceCoverageIcon,
      accent: "text-violet-300",
      surface: "bg-violet-400/15",
    },
    {
      id: "canonical",
      label: "Canonical Knowledge",
      value: "—",
      detail: "Publication unavailable",
      icon: CanonicalKnowledgeIcon,
      accent: "text-amber-300",
      surface: "bg-amber-400/15",
    },
  ];
}
