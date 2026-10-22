import type { ReactNode } from "react";

import type { RepositoryAuditReport } from "@/services/repositoryAuditService";

import { toneText } from "../../executive/shared/ExecutiveSection";
import type { Loadable } from "../state/useRepoAudit";

/* Loading, a Runtime error, or no audit yet: said plainly, never filled with sample data. */
export function ReportGate({ report, children }: { report: Loadable<RepositoryAuditReport | null>; children: (report: RepositoryAuditReport) => ReactNode }) {
  if (report.status === "loading") return <p className="text-sm text-sky-300/70">Reading the latest audit…</p>;
  if (report.status === "error") return <p className={`text-sm ${toneText.error}`}>{report.message}</p>;
  if (!report.data) return <p className="text-sm text-sky-300/70">This project has not been audited yet. Run a scan to see its findings.</p>;
  return <>{children(report.data)}</>;
}
