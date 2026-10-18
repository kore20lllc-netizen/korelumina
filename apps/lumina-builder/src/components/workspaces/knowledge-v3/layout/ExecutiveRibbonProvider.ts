import type React from "react";

import {
  KnowledgeHealthIcon,
  EvidenceCoverageIcon,
  CanonicalKnowledgeIcon,
} from "./ExecutiveOperationIcons";
import type {
  Checked,
  KnowledgeOperationsTruth,
} from "./useKnowledgeOperationsTruth";

export type ExecutiveRibbonMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  surface: string;
};

/*
 * UI-1: the header tiles are computed from real Runtime checks. While a
 * check is running the tile says so; a failed check says it failed.
 */
function tile(
  value: Checked<unknown>,
  render: () => { value: string; detail: string },
): { value: string; detail: string } {
  if (value.status === "loading") return { value: "…", detail: "Checking the Runtime" };
  if (value.status === "error") return { value: "—", detail: "Check failed" };
  return render();
}

export function getExecutiveRibbonMetrics(
  truth: KnowledgeOperationsTruth,
): ExecutiveRibbonMetric[] {
  const modules = truth.modules;
  const overview = truth.overview;

  return [
    {
      id: "knowledge-health",
      label: "Knowledge Health",
      ...tile(modules, () =>
        modules.status === "ok"
          ? {
              value: `${modules.data.complete}/${modules.data.total}`,
              detail: "Day-0 curriculum modules complete",
            }
          : { value: "—", detail: "" },
      ),
      icon: KnowledgeHealthIcon,
      accent: "text-emerald-300",
      surface: "bg-emerald-400/15",
    },
    {
      id: "evidence",
      label: "Evidence Coverage",
      ...tile(overview, () =>
        overview.status === "ok"
          ? {
              value: overview.data.evidenceTotal.toLocaleString(),
              detail:
                modules.status === "ok"
                  ? `Evidence records; ${modules.data.corpusItems} curriculum items in the corpus`
                  : "Evidence records on file",
            }
          : { value: "—", detail: "" },
      ),
      icon: EvidenceCoverageIcon,
      accent: "text-violet-300",
      surface: "bg-violet-400/15",
    },
    {
      id: "canonical",
      label: "Canonical Knowledge",
      ...tile(overview, () =>
        overview.status === "ok"
          ? {
              value: overview.data.canonicalItems.toLocaleString(),
              detail: "Approved canonical records",
            }
          : { value: "—", detail: "" },
      ),
      icon: CanonicalKnowledgeIcon,
      accent: "text-amber-300",
      surface: "bg-amber-400/15",
    },
  ];
}
