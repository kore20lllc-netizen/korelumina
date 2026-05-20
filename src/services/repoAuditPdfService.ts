import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AuditReport } from "./repoAuditService";
import {
  ALL_SEVERITIES,
  ALL_CATEGORIES,
  type Severity,
  type Category,
} from "@/components/workspaces/repo-audit/FindingsFilters";
import luminaLogo from "@/assets/lumina.png";

type RGB = [number, number, number];

const COLORS = {
  ink: [17, 24, 39] as RGB,
  muted: [107, 114, 128] as RGB,
  gold: [251, 185, 73] as RGB,
  violet: [157, 91, 246] as RGB,
  electric: [82, 110, 255] as RGB,
  magenta: [240, 75, 178] as RGB,
  cyan: [62, 215, 240] as RGB,
  border: [229, 231, 235] as RGB,
  headerBg: [11, 11, 22] as RGB,
  headerFg: [245, 240, 220] as RGB,
  pass: [22, 163, 74] as RGB,
  warn: [202, 138, 4] as RGB,
  fail: [220, 38, 38] as RGB,
};

const SEVERITY_FILL: Record<string, RGB> = {
  critical: [254, 226, 226],
  high: [255, 237, 213],
  medium: [254, 243, 199],
  low: [241, 245, 249],
};
const SEVERITY_TEXT: Record<string, RGB> = {
  critical: [153, 27, 27],
  high: [154, 52, 18],
  medium: [120, 53, 15],
  low: [71, 85, 105],
};

const CATEGORY_LABEL: Record<Category, string> = {
  deps: "Dependencies",
  build: "Build Errors",
  env: "Environment",
  security: "Security",
};

export interface AuditPdfFilters {
  severities: Severity[];
  categories: Category[];
}

export type AuditPdfThemeId = "lumina" | "minimal" | "midnight" | "editorial" | "custom";

export interface AuditPdfTheme {
  id: AuditPdfThemeId;
  label: string;
  description: string;
  showLogo: boolean;
  headerBg: RGB;
  headerStops: RGB[]; // empty array = no gradient strips
  headerEyebrow: RGB;
  headerTitle: RGB;
  headerSubtitle: RGB;
  accent: RGB; // gold/violet accent line & numbered circles
  badgeRing: RGB; // numbered step circle fill
  badgeNumber: RGB;
  footerMark: RGB;
  footerMarkText: string;
  footerTagline: string;
}

export const AUDIT_PDF_THEMES: Record<AuditPdfThemeId, AuditPdfTheme> = {
  lumina: {
    id: "lumina",
    label: "Lumina",
    description: "Full KoreLumina brand · gradient header, gold accent",
    showLogo: true,
    headerBg: [11, 11, 22],
    headerStops: [
      [240, 75, 178],
      [157, 91, 246],
      [82, 110, 255],
      [62, 215, 240],
    ],
    headerEyebrow: [251, 185, 73],
    headerTitle: [245, 245, 248],
    headerSubtitle: [210, 210, 220],
    accent: [251, 185, 73],
    badgeRing: [11, 11, 22],
    badgeNumber: [251, 185, 73],
    footerMark: [157, 91, 246],
    footerMarkText: "KoreLumina",
    footerTagline: "· Repo Audit Engine · confidential",
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    description: "Black & white · no logo, no gradient, hairline rules",
    showLogo: false,
    headerBg: [255, 255, 255],
    headerStops: [],
    headerEyebrow: [107, 114, 128],
    headerTitle: [17, 24, 39],
    headerSubtitle: [107, 114, 128],
    accent: [17, 24, 39],
    badgeRing: [17, 24, 39],
    badgeNumber: [255, 255, 255],
    footerMark: [17, 24, 39],
    footerMarkText: "Repo Audit",
    footerTagline: "· confidential",
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    description: "Solid dark header, single violet accent",
    showLogo: true,
    headerBg: [11, 11, 22],
    headerStops: [],
    headerEyebrow: [157, 91, 246],
    headerTitle: [245, 245, 248],
    headerSubtitle: [180, 180, 200],
    accent: [157, 91, 246],
    badgeRing: [157, 91, 246],
    badgeNumber: [255, 255, 255],
    footerMark: [157, 91, 246],
    footerMarkText: "KoreLumina",
    footerTagline: "· Repo Audit",
  },
  editorial: {
    id: "editorial",
    label: "Editorial",
    description: "Warm cream paper · gold rule, ink type",
    showLogo: true,
    headerBg: [248, 244, 235],
    headerStops: [],
    headerEyebrow: [120, 53, 15],
    headerTitle: [29, 29, 32],
    headerSubtitle: [99, 94, 84],
    accent: [202, 138, 4],
    badgeRing: [29, 29, 32],
    badgeNumber: [248, 244, 235],
    footerMark: [120, 53, 15],
    footerMarkText: "KoreLumina",
    footerTagline: "· Repo Audit · editorial",
  },
  custom: {
    id: "custom",
    label: "Custom",
    description: "Your tweaked theme — edit logo, gradient, accent, footer",
    showLogo: true,
    headerBg: [11, 11, 22],
    headerStops: [
      [240, 75, 178],
      [157, 91, 246],
      [82, 110, 255],
      [62, 215, 240],
    ],
    headerEyebrow: [251, 185, 73],
    headerTitle: [245, 245, 248],
    headerSubtitle: [210, 210, 220],
    accent: [251, 185, 73],
    badgeRing: [11, 11, 22],
    badgeNumber: [251, 185, 73],
    footerMark: [157, 91, 246],
    footerMarkText: "KoreLumina",
    footerTagline: "· Repo Audit Engine · confidential",
  },
};

export type AuditPdfThemeOverrides = Partial<
  Pick<
    AuditPdfTheme,
    | "headerBg"
    | "headerStops"
    | "headerEyebrow"
    | "accent"
    | "badgeRing"
    | "badgeNumber"
    | "footerMark"
    | "footerMarkText"
    | "footerTagline"
    | "showLogo"
  >
> & {
  /** Optional theme-level logo (data URL or remote URL). Used as fallback when
   * no per-workspace custom logo is uploaded. Falls back to the theme default
   * brand mark if it fails to load. */
  logoDataUrl?: string | null;
};

export const DEFAULT_THEME_ID: AuditPdfThemeId = "lumina";

function statusColor(status: AuditReport["buildStatus"]): RGB {
  if (status === "passing") return COLORS.pass;
  if (status === "warning") return COLORS.warn;
  return COLORS.fail;
}

function safeSlug(s: string): string {
  return s.replace(/[^\w.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "report";
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function paintBrandHeader(
  doc: jsPDF,
  pageWidth: number,
  logo: HTMLImageElement | null,
  sourceLabel: string,
  report: AuditReport,
  theme: AuditPdfTheme,
) {
  const h = 110;
  doc.setFillColor(...theme.headerBg);
  doc.rect(0, 0, pageWidth, h, "F");

  if (theme.headerStops.length > 0) {
    const stripW = pageWidth / theme.headerStops.length;
    theme.headerStops.forEach((c, i) => {
      doc.setFillColor(c[0], c[1], c[2]);
      (doc as any).setGState?.(new (doc as any).GState({ opacity: 0.22 }));
      doc.rect(stripW * i, 0, stripW + 1, h, "F");
    });
    (doc as any).setGState?.(new (doc as any).GState({ opacity: 1 }));
  }

  doc.setDrawColor(...theme.accent);
  doc.setLineWidth(1.2);
  doc.line(0, h, pageWidth, h);
  doc.setLineWidth(0.5);

  const margin = 40;
  let textX = margin;

  if (logo && theme.showLogo) {
    const logoH = 36;
    const ratio = logo.width / logo.height || 1;
    const logoW = logoH * ratio;
    try {
      doc.addImage(logo, "PNG", margin, 28, logoW, logoH);
      textX = margin + logoW + 14;
    } catch {
      // ignore — fall back to text-only
    }
  }

  doc.setTextColor(...theme.headerEyebrow);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("KORELUMINA · REPO AUDIT", textX, 40);

  doc.setTextColor(...theme.headerTitle);
  doc.setFontSize(20);
  doc.text("Repo Audit Report", textX, 64);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...theme.headerSubtitle);
  const subtitle = `${sourceLabel || report.projectId} · generated ${new Date(report.generatedAt).toLocaleString()}`;
  doc.text(subtitle, textX, 82);
}

function drawChipRow(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  chips: { text: string; fill: RGB; text_: RGB; border?: RGB; muted?: boolean }[],
  maxRight: number,
): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(label.toUpperCase(), x, y + 9);
  let cx = x + doc.getTextWidth(label.toUpperCase()) + 10;
  const chipH = 14;
  const top = y;
  let row = top;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  chips.forEach((c) => {
    const w = doc.getTextWidth(c.text) + 14;
    if (cx + w > maxRight) {
      row += chipH + 4;
      cx = x + doc.getTextWidth(label.toUpperCase()) + 10;
    }
    if (c.border) {
      doc.setDrawColor(...c.border);
    } else {
      doc.setDrawColor(...COLORS.border);
    }
    doc.setFillColor(...c.fill);
    doc.roundedRect(cx, row, w, chipH, 3, 3, "FD");
    doc.setTextColor(...c.text_);
    doc.text(c.text, cx + w / 2, row + 10, { align: "center" });
    cx += w + 5;
  });
  return row + chipH;
}

function paintFiltersAndLegend(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  yStart: number,
  filters: AuditPdfFilters | undefined,
): number {
  const innerW = pageWidth - margin * 2;
  const padX = 12;
  const padY = 10;
  const right = margin + innerW - padX;

  // Pre-measure by drawing into a temp y, then enclose with a card
  const cardX = margin;
  let cy = yStart + padY;

  // Active severities
  const activeSev = new Set(filters?.severities ?? ALL_SEVERITIES);
  const sevChips = ALL_SEVERITIES.map((s) => {
    const active = activeSev.has(s);
    return {
      text: s.toUpperCase(),
      fill: active ? SEVERITY_FILL[s] : ([249, 250, 251] as RGB),
      text_: active ? SEVERITY_TEXT[s] : ([156, 163, 175] as RGB),
      border: active ? SEVERITY_TEXT[s] : COLORS.border,
    };
  });
  cy = drawChipRow(doc, cardX + padX, cy, "Severity", sevChips, right);
  cy += 8;

  // Active categories
  const activeCat = new Set(filters?.categories ?? ALL_CATEGORIES.map((c) => c.id));
  const catChips = ALL_CATEGORIES.map((c) => {
    const active = activeCat.has(c.id);
    return {
      text: CATEGORY_LABEL[c.id],
      fill: active ? ([237, 233, 254] as RGB) : ([249, 250, 251] as RGB),
      text_: active ? ([76, 29, 149] as RGB) : ([156, 163, 175] as RGB),
      border: active ? COLORS.violet : COLORS.border,
    };
  });
  cy = drawChipRow(doc, cardX + padX, cy, "Category", catChips, right);
  cy += 10;

  // Legend (severity color key)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text("LEGEND", cardX + padX, cy + 9);
  let lx = cardX + padX + doc.getTextWidth("LEGEND") + 10;
  const swatch = 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  ALL_SEVERITIES.forEach((s) => {
    doc.setFillColor(...SEVERITY_FILL[s]);
    doc.setDrawColor(...SEVERITY_TEXT[s]);
    doc.roundedRect(lx, cy + 2, swatch, swatch, 1.5, 1.5, "FD");
    doc.setTextColor(...COLORS.ink);
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    doc.text(label, lx + swatch + 4, cy + 9);
    lx += swatch + 6 + doc.getTextWidth(label) + 12;
  });
  // Pass/Fail legend swatches
  const passLabel = "Present";
  const failLabel = "Missing";
  doc.setFillColor(...COLORS.pass); doc.setDrawColor(...COLORS.pass);
  doc.roundedRect(lx, cy + 2, swatch, swatch, 1.5, 1.5, "FD");
  doc.setTextColor(...COLORS.ink); doc.text(passLabel, lx + swatch + 4, cy + 9);
  lx += swatch + 6 + doc.getTextWidth(passLabel) + 12;
  doc.setFillColor(...COLORS.fail); doc.setDrawColor(...COLORS.fail);
  doc.roundedRect(lx, cy + 2, swatch, swatch, 1.5, 1.5, "FD");
  doc.setTextColor(...COLORS.ink); doc.text(failLabel, lx + swatch + 4, cy + 9);

  const cardBottom = cy + swatch + 8;
  // Draw enclosing card behind everything (re-render strategy: stroke a rect now)
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(255, 255, 255);
  // Use no-fill outline to avoid covering already-painted chips
  doc.roundedRect(cardX, yStart, innerW, cardBottom - yStart + padY - 4, 6, 6, "S");

  return cardBottom + padY;
}

export interface AuditPdfResult {
  fileName: string;
  pageCount: number;
  themeId: AuditPdfThemeId;
  logoLoaded: boolean;
  logoRequested: boolean;
}

async function buildAuditPdf(
  report: AuditReport,
  sourceLabel: string,
  filters: AuditPdfFilters | undefined,
  themeId: AuditPdfThemeId,
  customLogoDataUrl: string | null | undefined,
  themeOverrides?: AuditPdfThemeOverrides,
): Promise<{ doc: jsPDF; fileName: string; meta: Omit<AuditPdfResult, "fileName" | "pageCount"> }> {
  const base = AUDIT_PDF_THEMES[themeId] ?? AUDIT_PDF_THEMES[DEFAULT_THEME_ID];
  const { logoDataUrl: themeLogoUrl, ...themeColorOverrides } = themeOverrides ?? {};
  const theme: AuditPdfTheme = themeOverrides ? { ...base, ...themeColorOverrides } : base;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Logo source priority:
  // 1. Per-workspace uploaded custom logo (always wins, forces logo on).
  // 2. Theme-level logo (data URL or URL) from the custom theme editor (forces logo on).
  // 3. Theme default brand mark, if the theme opts in to showing a logo.
  // Any failed load silently falls back to the next option (and finally text-only).
  let logo: HTMLImageElement | null = null;
  let logoForcedOn = false;
  if (customLogoDataUrl) {
    logo = await loadImage(customLogoDataUrl);
    logoForcedOn = true;
  }
  if (!logo && themeLogoUrl) {
    logo = await loadImage(themeLogoUrl);
    if (logo) logoForcedOn = true;
  }
  if (!logo && theme.showLogo) {
    logo = await loadImage(luminaLogo);
  }
  const logoLoaded = !!logo;
  const effectiveTheme: AuditPdfTheme = logoForcedOn ? { ...theme, showLogo: true } : theme;
  paintBrandHeader(doc, pageWidth, logo, sourceLabel, report, effectiveTheme);
  y = 138;

  // Active filters + legend strip
  y = paintFiltersAndLegend(doc, pageWidth, margin, y, filters) + 8;

  // Summary card
  const cardH = 86;
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(250, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, cardH, 8, 8, "FD");

  const stats: { label: string; value: string; color?: RGB }[] = [
    { label: "Build status", value: report.buildStatus.toUpperCase(), color: statusColor(report.buildStatus) },
    { label: "Type errors", value: String(report.typeErrors) },
    { label: "Est. fix time", value: `${report.estimatedFixMinutes} min` },
    {
      label: "Findings",
      value: String(
        report.missingDependencies.length +
          report.buildErrors.length +
          report.envVars.filter((e) => e.required && !e.present).length +
          report.securityFindings.length,
      ),
    },
  ];
  const colW = (pageWidth - margin * 2) / stats.length;
  stats.forEach((s, i) => {
    const x = margin + colW * i + 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(s.label.toUpperCase(), x, y + 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...(s.color ?? COLORS.ink));
    doc.text(s.value, x, y + 54);
  });
  y += cardH + 24;

  const sectionTitle = (title: string) => {
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.ink);
    doc.text(title, margin, y);
    y += 10;
  };

  const sevCellHook = (sevColIndex: number) => (data: any) => {
    if (data.section !== "body" || data.column.index !== sevColIndex) return;
    const sev = String(data.cell.raw ?? "").toLowerCase();
    if (!SEVERITY_FILL[sev]) return;
    data.cell.styles.fillColor = SEVERITY_FILL[sev];
    data.cell.styles.textColor = SEVERITY_TEXT[sev];
    data.cell.styles.fontStyle = "bold";
  };

  // Missing dependencies
  sectionTitle(`Missing Dependencies (${report.missingDependencies.length})`);
  if (report.missingDependencies.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...COLORS.muted);
    doc.text("None.", margin, y + 14); y += 28;
  } else {
    autoTable(doc, {
      startY: y + 6,
      margin: { left: margin, right: margin },
      head: [["Package", "Required", "Found", "Severity"]],
      body: report.missingDependencies.map((d) => [d.name, d.required, d.found ?? "—", d.severity]),
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerFg },
      didParseCell: sevCellHook(3),
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  }

  // Build errors
  sectionTitle(`Build Errors (${report.buildErrors.length})`);
  if (report.buildErrors.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...COLORS.muted);
    doc.text("None.", margin, y + 14); y += 28;
  } else {
    autoTable(doc, {
      startY: y + 6,
      margin: { left: margin, right: margin },
      head: [["File", "Line", "Code", "Message"]],
      body: report.buildErrors.map((e) => [e.file, String(e.line), e.code ?? "—", e.message]),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerFg },
      columnStyles: { 0: { cellWidth: 160 }, 1: { cellWidth: 38 }, 2: { cellWidth: 56 } },
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  }

  // Env vars
  sectionTitle(`Environment Variables (${report.envVars.length})`);
  if (report.envVars.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...COLORS.muted);
    doc.text("None.", margin, y + 14); y += 28;
  } else {
    autoTable(doc, {
      startY: y + 6,
      margin: { left: margin, right: margin },
      head: [["Key", "Required", "Present", "Description"]],
      body: report.envVars.map((e) => [e.key, e.required ? "Yes" : "No", e.present ? "Yes" : "Missing", e.description]),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerFg },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const present = String(data.cell.raw) === "Yes";
          data.cell.styles.textColor = present ? COLORS.pass : COLORS.fail;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  }

  // Security
  sectionTitle(`Security Findings (${report.securityFindings.length})`);
  if (report.securityFindings.length === 0) {
    doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.setTextColor(...COLORS.muted);
    doc.text("None.", margin, y + 14); y += 28;
  } else {
    autoTable(doc, {
      startY: y + 6,
      margin: { left: margin, right: margin },
      head: [["ID", "Package", "Severity", "Title", "Fixed in"]],
      body: report.securityFindings.map((f) => [f.id, f.package, f.severity, f.title, f.fixedIn ?? "—"]),
      styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
      headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerFg },
      didParseCell: sevCellHook(2),
    });
    y = (doc as any).lastAutoTable.finalY + 22;
  }

  // Repair plan
  sectionTitle(`Repair Plan (${report.repairPlan.length} steps · est. ${report.estimatedFixMinutes} min)`);
  const innerW = pageWidth - margin * 2;
  report.repairPlan.forEach((step, idx) => {
    const detailLines = doc.splitTextToSize(step.detail, innerW - 56);
    const blockH = 22 + 14 + detailLines.length * 12 + 12;
    if (y + blockH > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(250, 250, 252);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, y, innerW, blockH, 6, 6, "FD");

    doc.setFillColor(...theme.badgeRing);
    doc.circle(margin + 18, y + 20, 11, "F");
    doc.setTextColor(...theme.badgeNumber);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(idx + 1), margin + 18, y + 24, { align: "center" });

    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(step.title, margin + 38, y + 22);

    const badge = step.automated ? "AUTOMATED" : "MANUAL";
    const badgeColor: RGB = step.automated ? [22, 163, 74] : [107, 114, 128];
    const badgeBg: RGB = step.automated ? [220, 252, 231] : [241, 245, 249];
    doc.setFontSize(8);
    const badgeW = doc.getTextWidth(badge) + 12;
    doc.setFillColor(...badgeBg);
    doc.roundedRect(pageWidth - margin - badgeW - 70, y + 12, badgeW, 14, 3, 3, "F");
    doc.setTextColor(...badgeColor);
    doc.text(badge, pageWidth - margin - badgeW - 70 + badgeW / 2, y + 22, { align: "center" });

    doc.setTextColor(...COLORS.muted);
    doc.text(`${step.estMinutes} min`, pageWidth - margin - 8, y + 22, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink);
    doc.text(detailLines, margin + 38, y + 38);

    y += blockH + 8;
  });

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...theme.accent);
    doc.setLineWidth(0.8);
    doc.line(margin, ph - 32, pageWidth - margin, ph - 32);
    doc.setLineWidth(0.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...theme.footerMark);
    doc.text(theme.footerMarkText, margin, ph - 18);
    doc.setTextColor(...COLORS.muted);
    doc.text(` ${theme.footerTagline}`, margin + doc.getTextWidth(theme.footerMarkText) + 4, ph - 18);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, ph - 18, { align: "right" });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `repo-audit-${safeSlug(report.projectId)}-${stamp}.pdf`;
  return {
    doc,
    fileName,
    meta: {
      themeId: theme.id,
      logoLoaded,
      logoRequested: !!(customLogoDataUrl || themeLogoUrl || theme.showLogo),
    },
  };
}

export async function downloadAuditPdf(
  report: AuditReport,
  sourceLabel: string,
  filters?: AuditPdfFilters,
  themeId: AuditPdfThemeId = DEFAULT_THEME_ID,
  customLogoDataUrl?: string | null,
  themeOverrides?: AuditPdfThemeOverrides,
): Promise<AuditPdfResult> {
  const { doc, fileName, meta } = await buildAuditPdf(report, sourceLabel, filters, themeId, customLogoDataUrl, themeOverrides);
  doc.save(fileName);
  return { fileName, pageCount: doc.getNumberOfPages(), ...meta };
}

export interface AuditPdfPreview extends AuditPdfResult {
  blobUrl: string;
  blob: Blob;
}

export async function previewAuditPdf(
  report: AuditReport,
  sourceLabel: string,
  filters?: AuditPdfFilters,
  themeId: AuditPdfThemeId = DEFAULT_THEME_ID,
  customLogoDataUrl?: string | null,
  themeOverrides?: AuditPdfThemeOverrides,
): Promise<AuditPdfPreview> {
  const { doc, fileName, meta } = await buildAuditPdf(report, sourceLabel, filters, themeId, customLogoDataUrl, themeOverrides);
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  return { fileName, pageCount: doc.getNumberOfPages(), blobUrl, blob, ...meta };
}

// ---- Hex <-> RGB helpers used by the theme editor UI ----

export function rgbToHex(rgb: RGB): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(rgb[0])}${h(rgb[1])}${h(rgb[2])}`;
}

export function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}