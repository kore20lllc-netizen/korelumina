import type { FindingSeverity, RepositoryAuditReport, RepositoryFinding } from "./repositoryAuditService";

/*
 * MS-2026-0012: a report to hand to a client, made from the real audit.
 * The person preparing it chooses what goes in and adds their own words;
 * the findings, scores and coverage are the audit's, unchanged. Secret
 * values are never in an audit report, so never in this one.
 */

export interface ClientReportOptions {
  clientName: string;
  title: string;
  preparedBy: string;
  /* A PNG or JPEG data URL, shown on the cover. */
  logoDataUrl: string | null;
  severities: readonly FindingSeverity[];
  includeArchived: boolean;
  summary: string;
  recommendations: string;
  includeAppendix: boolean;
}

/* Same rule as the Runtime engine: archived or backup copies are not the product. */
const ARCHIVED_PATH = /(^|\/)(archive|archived|backups?|legacy|deprecated|\.reconstruction)(\/|$)|\.(backup|bak|orig)(\.[\w-]+)?(\/|$)/i;

export function isArchivedFinding(finding: RepositoryFinding): boolean {
  return (
    finding.rule === "architecture.broken-imports-archived" ||
    / \(archived code\)$/.test(finding.title) ||
    (finding.evidence.length > 0 && finding.evidence.every((evidence) => ARCHIVED_PATH.test(evidence.file)))
  );
}

export function selectClientFindings(report: RepositoryAuditReport, options: Pick<ClientReportOptions, "severities" | "includeArchived">): RepositoryFinding[] {
  const severities = new Set(options.severities);
  return report.findings.filter((finding) => severities.has(finding.severity) && (options.includeArchived || !isArchivedFinding(finding)));
}

const CATEGORY_WORD: Record<string, string> = {
  security: "security",
  build: "build health",
  dependency: "dependencies",
  architecture: "architecture",
  environment: "configuration",
  quality: "code quality",
};

/* A plain-language starting point; the person preparing the report edits it. */
export function draftExecutiveSummary(report: RepositoryAuditReport, included: readonly RepositoryFinding[]): string {
  const date = new Date(report.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 } as Record<FindingSeverity, number>;
  for (const finding of included) counts[finding.severity] += 1;
  const parts: string[] = [];
  parts.push(
    `We reviewed the ${report.projectId} repository on ${date}${report.manifest.commit ? ` (commit ${report.manifest.commit.slice(0, 8)})` : ""}, covering ${report.manifest.inventory.totalFiles} files.`,
  );
  if (report.summary.score !== null) {
    parts.push(`It scores ${report.summary.score} out of 100 (grade ${report.summary.grade}).`);
  }
  const serious = counts.critical + counts.high;
  if (included.length === 0) {
    parts.push("No issues at the levels included in this report were found.");
  } else {
    const levels = [
      counts.critical ? `${counts.critical} critical` : null,
      counts.high ? `${counts.high} high-priority` : null,
      counts.medium ? `${counts.medium} medium` : null,
      counts.low ? `${counts.low} low` : null,
      counts.info ? `${counts.info} informational` : null,
    ].filter(Boolean);
    const list = levels.length > 1 ? `${levels.slice(0, -1).join(", ")} and ${levels[levels.length - 1]}` : levels[0];
    parts.push(`This report covers ${list} finding${included.length === 1 ? "" : "s"}.`);
    if (serious > 0) {
      const top = included.filter((finding) => finding.severity === "critical" || finding.severity === "high").slice(0, 3);
      parts.push(`The most important to address first: ${top.map((finding) => finding.title).join("; ")}.`);
    }
  }
  const weakest = report.summary.categories
    .filter((category) => category.status !== "not-checked" && category.score !== null)
    .sort((left, right) => (left.score ?? 100) - (right.score ?? 100))[0];
  if (weakest && (weakest.score ?? 100) < 90) parts.push(`The area needing the most attention is ${CATEGORY_WORD[weakest.category]}.`);
  /* What could not be checked, in plain sentences. */
  if (report.coverage.advisories.status !== "checked") {
    parts.push(`Known vulnerabilities in third-party packages were not checked, because ${report.coverage.advisories.reason ?? "the check could not run"}.`);
  }
  const build = report.summary.categories.find((category) => category.category === "build");
  if (report.mode !== "deep") {
    parts.push("The project was not built for this review, so build health is not covered.");
  } else if (build && build.status !== "checked") {
    parts.push(`Build health was only partly checked: ${build.notes.join("; ").replace(/\.$/, "")}.`);
  }
  return parts.join(" ");
}

const SEVERITY_COLOR: Record<FindingSeverity, [number, number, number]> = {
  critical: [190, 18, 60],
  high: [225, 29, 72],
  medium: [217, 119, 6],
  low: [14, 116, 144],
  info: [100, 116, 139],
};
const SEVERITY_LABEL: Record<FindingSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low", info: "Info" };
const CATEGORY_LABEL: Record<string, string> = {
  security: "Security",
  build: "Build health",
  dependency: "Dependencies",
  architecture: "Architecture",
  environment: "Configuration",
  quality: "Quality",
};

function imageFormat(dataUrl: string): "PNG" | "JPEG" | null {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  return null;
}

function safeFileName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
}

export async function exportClientReportPdf(report: RepositoryAuditReport, options: ClientReportOptions): Promise<string> {
  const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new JsPdf({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 56;
  const included = selectClientFindings(report, options);
  const date = new Date(report.completedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  /* Cover. */
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, width, height, "F");
  let y = 96;
  const format = options.logoDataUrl ? imageFormat(options.logoDataUrl) : null;
  if (options.logoDataUrl && format) {
    const properties = doc.getImageProperties(options.logoDataUrl);
    const logoHeight = 56;
    const logoWidth = Math.min(200, (properties.width / properties.height) * logoHeight);
    doc.addImage(options.logoDataUrl, format, margin, y - 40, logoWidth, logoHeight);
    y += 48;
  }
  doc.setTextColor(217, 164, 65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("REPOSITORY HEALTH REVIEW", margin, y + 40);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(30);
  const titleLines = doc.splitTextToSize(options.title || "Repository health review", width - margin * 2);
  doc.text(titleLines, margin, y + 84);
  y += 84 + titleLines.length * 34;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(186, 230, 253);
  if (options.clientName) doc.text(`Prepared for ${options.clientName}`, margin, y + 10);
  if (options.preparedBy) doc.text(`Prepared by ${options.preparedBy}`, margin, y + 32);
  doc.text(date, margin, y + 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(64);
  doc.setTextColor(255, 255, 255);
  doc.text(report.summary.score === null ? "—" : String(report.summary.score), margin, height - 170);
  doc.setFontSize(16);
  doc.setTextColor(217, 164, 65);
  doc.text(report.summary.grade ? `out of 100 · grade ${report.summary.grade}` : "not scored", margin, height - 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Repository ${report.projectId}${report.manifest.commit ? ` · commit ${report.manifest.commit.slice(0, 8)}` : ""} · ${report.manifest.inventory.totalFiles} files · ${report.mode === "deep" ? "deep audit" : "scan"}`,
    margin,
    height - 110,
  );

  /* Summary and scores. */
  doc.addPage();
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Executive summary", margin, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(options.summary.trim() || draftExecutiveSummary(report, included), width - margin * 2);
  doc.text(summaryLines, margin, 100, { lineHeightFactor: 1.5 });
  y = 100 + summaryLines.length * 16.5 + 24;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Area", "Score", "Coverage"]],
    body: report.summary.categories.map((category) => [
      CATEGORY_LABEL[category.category] ?? category.category,
      category.score === null ? "—" : String(category.score),
      category.status === "checked" ? "Fully checked" : category.status === "partial" ? `Partly checked. ${category.notes.join(" ")}` : `Not checked. ${category.notes.join(" ")}`,
    ]),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 0: { cellWidth: 110, fontStyle: "bold" }, 1: { cellWidth: 50, halign: "center" } },
  });
  y = lastY() + 30;

  if (options.recommendations.trim()) {
    if (y > height - 160) {
      doc.addPage();
      y = 72;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("Recommendations", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(options.recommendations.trim(), width - margin * 2);
    doc.text(lines, margin, y + 28, { lineHeightFactor: 1.5 });
  }

  /* Findings. */
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("Findings", margin, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(
    included.length === 0
      ? "No findings at the levels included in this report."
      : `${included.length} finding${included.length === 1 ? "" : "s"}, most important first. Each was found in the code itself; the appendix lists where.`,
    margin,
    92,
    { maxWidth: width - margin * 2 },
  );
  if (included.length > 0) {
    autoTable(doc, {
      startY: 108,
      margin: { left: margin, right: margin },
      head: [["#", "Priority", "Finding", "Recommended fix"]],
      body: included.map((finding, index) => [String(index + 1), SEVERITY_LABEL[finding.severity], `${finding.title}\n${finding.detail}`, finding.remedy ?? ""]),
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 56, fontStyle: "bold" }, 2: { cellWidth: 250 } },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const severity = included[data.row.index]?.severity;
          if (severity) data.cell.styles.textColor = SEVERITY_COLOR[severity];
        }
      },
    });
  }

  /* Appendix. */
  if (options.includeAppendix && included.length > 0) {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text("Appendix: where each finding is", margin, 72);
    autoTable(doc, {
      startY: 92,
      margin: { left: margin, right: margin },
      head: [["#", "Locations"]],
      body: included.map((finding, index) => [
        String(index + 1),
        finding.evidence.length === 0
          ? "Repository-wide"
          : finding.evidence
              .slice(0, 10)
              .map((evidence) => `${evidence.file}${evidence.line ? `:${evidence.line}` : ""}`)
              .join("\n") + (finding.evidence.length > 10 ? `\n+${finding.evidence.length - 10} more` : ""),
      ]),
      styles: { fontSize: 8, cellPadding: 4, font: "courier", valign: "top" },
      headStyles: { fillColor: [15, 23, 42], font: "helvetica" },
      columnStyles: { 0: { cellWidth: 24, font: "helvetica" } },
    });
  }

  /* Method. */
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text("How this review was done", margin, 72);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const method = [
    `The repository's files were read at ${report.manifest.commit ? `commit ${report.manifest.commit.slice(0, 8)}` : "their current state"}; the same commit always produces the same findings.`,
    "Dependencies were compared between what the code imports and what the project declares, and checked against the lockfile.",
    `Committed credentials were looked for in ${report.coverage.filesScannedForSecrets} files by their exact formats; values are never copied into a report. Risky code patterns were checked in ${report.coverage.filesScannedForCode} files.`,
    report.coverage.advisories.status === "checked"
      ? `Known vulnerabilities were checked with ${report.coverage.advisories.source}.`
      : `Known vulnerabilities could not be checked: ${report.coverage.advisories.reason}.`,
    report.mode === "deep" ? "The project's own typecheck and build were run." : "The project was not built for this review; build health was not checked.",
    "Scores start at 100 per area and are lowered only by the findings, more for more serious ones.",
  ];
  doc.text(
    method.flatMap((line) => doc.splitTextToSize(`•  ${line}`, width - margin * 2)),
    margin,
    100,
    { lineHeightFactor: 1.6 },
  );

  const pages = doc.getNumberOfPages();
  for (let page = 2; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${options.clientName ? `${options.clientName} · ` : ""}${options.title || "Repository health review"} · ${date}`, margin, height - 28);
    doc.text(`Page ${page} of ${pages} · Prepared with KoreLumina`, width - margin, height - 28, { align: "right" });
  }

  const fileName = `${safeFileName(options.clientName || report.projectId)}-repository-review-${new Date(report.completedAt).toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
