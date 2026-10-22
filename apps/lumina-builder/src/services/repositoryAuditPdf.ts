import type { RepositoryAuditReport } from "./repositoryAuditService";

/*
 * MS-2026-0012: the Repo Audit report as a PDF, from the real report only.
 * jsPDF and its table plugin load on demand. Every finding is listed with
 * its evidence and remedy; values of secrets are never in a report, so
 * never in the PDF.
 */

const SEVERITY_COLOR: Record<string, [number, number, number]> = {
  critical: [190, 18, 60],
  high: [225, 29, 72],
  medium: [217, 119, 6],
  low: [14, 116, 144],
  info: [100, 116, 139],
};

const CATEGORY_LABEL: Record<string, string> = {
  security: "Security",
  build: "Build health",
  dependency: "Dependencies",
  architecture: "Architecture",
  environment: "Environment",
  quality: "Quality",
};

export async function exportAuditPdf(report: RepositoryAuditReport): Promise<string> {
  const [{ default: JsPdf }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new JsPdf({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const margin = 48;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, width, 150, "F");
  doc.setTextColor(217, 164, 65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("KORELUMINA · REPOSITORY INTELLIGENCE", margin, 48);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.text(`Repo Audit · ${report.projectId}`, margin, 84);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(186, 230, 253);
  doc.text(
    `${report.mode === "deep" ? "Deep audit" : "Scan"} · ${new Date(report.completedAt).toLocaleString()} · ${
      report.manifest.commit ? `commit ${report.manifest.commit.slice(0, 8)}` : "uncommitted state"
    } · ${report.manifest.inventory.totalFiles} files`,
    margin,
    108,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  doc.text(report.summary.score === null ? "—" : `${report.summary.score}`, width - margin - 70, 92, { align: "right" });
  doc.setFontSize(12);
  doc.text(report.summary.grade ? `Grade ${report.summary.grade}` : "Not scored", width - margin, 92, { align: "right" });

  const counts = report.summary.counts;
  autoTable(doc, {
    startY: 176,
    margin: { left: margin, right: margin },
    head: [["Category", "Score", "Status", "Findings", "Notes"]],
    body: report.summary.categories.map((category) => [
      CATEGORY_LABEL[category.category] ?? category.category,
      category.score === null ? "—" : String(category.score),
      category.status === "not-checked" ? "Not checked" : category.status === "partial" ? "Partial" : "Checked",
      String(category.findings),
      category.notes.join(" "),
    ]),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: { 4: { cellWidth: 200 } },
  });

  const afterCategories = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `${counts.critical} critical · ${counts.high} high · ${counts.medium} medium · ${counts.low} low · ${counts.info} info. Advisories: ${
      report.coverage.advisories.status === "checked" ? `checked with ${report.coverage.advisories.source}` : `not checked (${report.coverage.advisories.reason})`
    }.`,
    margin,
    afterCategories,
    { maxWidth: width - margin * 2 },
  );

  autoTable(doc, {
    startY: afterCategories + 24,
    margin: { left: margin, right: margin },
    head: [["Severity", "Finding", "Evidence", "Fix"]],
    body: report.findings.map((finding) => [
      finding.severity.toUpperCase(),
      `${finding.title}\n${finding.detail}`,
      finding.evidence
        .slice(0, 5)
        .map((evidence) => `${evidence.file}${evidence.line ? `:${evidence.line}` : ""}`)
        .join("\n") + (finding.evidence.length > 5 ? `\n+${finding.evidence.length - 5} more` : ""),
      finding.remedy ?? "",
    ]),
    styles: { fontSize: 8, cellPadding: 4, valign: "top" },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: { 0: { cellWidth: 58, fontStyle: "bold" }, 1: { cellWidth: 210 }, 2: { cellWidth: 120 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const color = SEVERITY_COLOR[String(data.cell.raw).toLowerCase()];
        if (color) data.cell.styles.textColor = color;
      }
    },
  });

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${report.reportId} · page ${page} of ${pages}`, margin, doc.internal.pageSize.getHeight() - 24);
  }

  const fileName = `repo-audit-${report.projectId}-${new Date(report.completedAt).toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
}
