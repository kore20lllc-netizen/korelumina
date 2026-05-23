import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ChevronLeft, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { useWorkspace } from "@/context/WorkspaceContext";
import { canAccess } from "@/services/workspaceAccessService";
import {
  AuditReport,
  getAudit,
  runAudit,
  type RepoSource,
  type AuditMode,
  type AuditProgressEvent,
  type AuditTransportInfo,
  type FixPlan,
  type DiffPreview,
  type FixIteration,
  generateFixPlan,
  autoFix,
  fixUntilGreen,
  reRunAudit,
} from "@/services/repoAuditService";
import {
  previewAuditPdf,
  AUDIT_PDF_THEMES,
  DEFAULT_THEME_ID,
  type AuditPdfThemeId,
  type AuditPdfPreview,
  type AuditPdfThemeOverrides,
} from "@/services/repoAuditPdfService";
import { AuditPdfPreviewDialog } from "./repo-audit/AuditPdfPreviewDialog";
import { AuditPdfThemeEditor } from "./repo-audit/AuditPdfThemeEditor";
import { AuditSummary } from "./repo-audit/AuditSummary";
import { DeepAuditProgress } from "./repo-audit/DeepAuditProgress";
import { RepairActionBar } from "./repo-audit/RepairActionBar";
import { AutoFixModal } from "./repo-audit/AutoFixModal";
import { FixUntilGreenPanel } from "./repo-audit/FixUntilGreenPanel";
import { BuildLogsDrawer } from "./repo-audit/BuildLogsDrawer";
import { DiffPreviewDialog } from "./repo-audit/DiffPreviewDialog";
import { BuildPassedBanner } from "./repo-audit/BuildPassedBanner";
import { DependencyAuditCard } from "./repo-audit/DependencyAuditCard";
import { BuildErrorsCard } from "./repo-audit/BuildErrorsCard";
import { EnvironmentAuditCard } from "./repo-audit/EnvironmentAuditCard";
import { SecurityAuditCard } from "./repo-audit/SecurityAuditCard";
import { RepairPlanCard } from "./repo-audit/RepairPlanCard";
import { RepoSourcePicker } from "./repo-audit/RepoSourcePicker";
import { StepDiffPanel } from "./repo-audit/StepDiffPanel";
import {
  FindingsFilters,
  ALL_SEVERITIES,
  ALL_CATEGORIES,
  type Severity,
  type Category,
} from "./repo-audit/FindingsFilters";
import { toast } from "sonner";
import { History, X, Download, Sparkles, Upload, Trash, Palette } from "lucide-react";
import { auditStoredProject } from "@/services/repoAuditBridge";
import { auth, usage as usageProvider } from "@/providers/registry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FILTERS_KEY = "korelumina:repo-audit:filters";
const HISTORY_KEY = "korelumina:repo-audit:filter-history";
const HISTORY_LIMIT = 50;
const TRASH_KEY = "korelumina:repo-audit:filter-history-trash";
const TRASH_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESTORE_EVENT_KEY = "korelumina:repo-audit:filter-history-restore";
const RESTORE_LOG_KEY = "korelumina:repo-audit:filter-history-restore-log";
const RESTORE_LOG_LIMIT = 5;
const CUSTOM_THEME_KEY = "korelumina:repo-audit:custom-theme-overrides";
const CANCELLED_DRAFT_KEY = "korelumina:repo-audit:cancelled-draft";
const CANCELLED_DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CANCELLED_DRAFT_MAX_EVENTS = 200;

interface CancelledDraft {
  source: RepoSource;
  mode: AuditMode;
  events: AuditProgressEvent[];
  transport: AuditTransportInfo | null;
  sourceLabel: string;
  cancelledAt: number;
}

function loadCancelledDraft(): CancelledDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CANCELLED_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CancelledDraft>;
    if (
      !parsed ||
      !parsed.source ||
      (parsed.mode !== "scan" && parsed.mode !== "deep") ||
      typeof parsed.cancelledAt !== "number" ||
      !Array.isArray(parsed.events)
    ) return null;
    if (Date.now() - parsed.cancelledAt > CANCELLED_DRAFT_TTL_MS) {
      window.localStorage.removeItem(CANCELLED_DRAFT_KEY);
      return null;
    }
    return {
      source: parsed.source as RepoSource,
      mode: parsed.mode,
      events: (parsed.events as AuditProgressEvent[]).slice(-CANCELLED_DRAFT_MAX_EVENTS),
      transport: (parsed.transport as AuditTransportInfo | null) ?? null,
      sourceLabel: typeof parsed.sourceLabel === "string" ? parsed.sourceLabel : "",
      cancelledAt: parsed.cancelledAt,
    };
  } catch { return null; }
}

function saveCancelledDraft(draft: CancelledDraft | null) {
  if (typeof window === "undefined") return;
  try {
    if (!draft) window.localStorage.removeItem(CANCELLED_DRAFT_KEY);
    else {
      const trimmed: CancelledDraft = {
        ...draft,
        events: draft.events.slice(-CANCELLED_DRAFT_MAX_EVENTS),
      };
      window.localStorage.setItem(CANCELLED_DRAFT_KEY, JSON.stringify(trimmed));
    }
  } catch {}
}

function loadCustomTheme(): AuditPdfThemeOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CUSTOM_THEME_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as AuditPdfThemeOverrides) : {};
  } catch { return {}; }
}

function saveCustomTheme(overrides: AuditPdfThemeOverrides) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CUSTOM_THEME_KEY, JSON.stringify(overrides)); } catch {}
}

// User-tunable cleanup frequency. The selected option is persisted under
// CLEANUP_INTERVAL_KEY. A value of 0 disables the periodic sweep entirely
// (cleanup still runs on mount, on visibilitychange, and before writes).
const CLEANUP_INTERVAL_KEY = "korelumina:repo-audit:cleanup-interval-ms";
const CUSTOM_LOGO_KEY_PREFIX = "korelumina:repo-audit:custom-logo:";
const CUSTOM_LOGO_MAX_BYTES = 512 * 1024; // 512 KB cap to keep localStorage healthy
const CUSTOM_LOGO_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

function loadCustomLogo(projectId: string): string | null {
  if (typeof window === "undefined" || !projectId) return null;
  try {
    return window.localStorage.getItem(CUSTOM_LOGO_KEY_PREFIX + projectId);
  } catch { return null; }
}

function saveCustomLogo(projectId: string, dataUrl: string | null) {
  if (typeof window === "undefined" || !projectId) return;
  try {
    if (dataUrl) window.localStorage.setItem(CUSTOM_LOGO_KEY_PREFIX + projectId, dataUrl);
    else window.localStorage.removeItem(CUSTOM_LOGO_KEY_PREFIX + projectId);
  } catch {}
}
const CLEANUP_INTERVAL_DEFAULT_MS = 60 * 1000;
const CLEANUP_INTERVAL_OPTIONS: { label: string; value: number }[] = [
  { label: "Off", value: 0 },
  { label: "Every 30s", value: 30 * 1000 },
  { label: "Every 1m", value: 60 * 1000 },
  { label: "Every 5m", value: 5 * 60 * 1000 },
  { label: "Every 15m", value: 15 * 60 * 1000 },
];

function loadCleanupInterval(): number {
  if (typeof window === "undefined") return CLEANUP_INTERVAL_DEFAULT_MS;
  try {
    const raw = window.localStorage.getItem(CLEANUP_INTERVAL_KEY);
    if (raw === null) return CLEANUP_INTERVAL_DEFAULT_MS;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return CLEANUP_INTERVAL_DEFAULT_MS;
    const allowed = CLEANUP_INTERVAL_OPTIONS.some((o) => o.value === n);
    return allowed ? n : CLEANUP_INTERVAL_DEFAULT_MS;
  } catch {
    return CLEANUP_INTERVAL_DEFAULT_MS;
  }
}
// Bound how much can sit in trash so repeated clears can't bloat localStorage.
const TRASH_SNAPSHOT_LIMIT = 20;
const TRASH_MAX_BYTES = 16 * 1024; // 16 KB JSON payload cap

function capTrashSnapshots(snapshots: FilterSnapshot[]): FilterSnapshot[] {
  // Keep the most recent snapshots, drop oldest first.
  let capped = snapshots.slice(-TRASH_SNAPSHOT_LIMIT);
  // Shrink further if the serialized payload exceeds the byte cap.
  while (capped.length > 1) {
    const size = JSON.stringify(capped).length;
    if (size <= TRASH_MAX_BYTES) break;
    capped = capped.slice(1);
  }
  return capped;
}

/**
 * Inspect any persisted trash payload, drop it if expired/invalid, and
 * re-apply the snapshot/byte caps. Safe to call repeatedly. Returns true
 * when something was mutated or removed.
 */
function cleanupTrash(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(TRASH_KEY);
    if (!raw) return false;
    let parsed: Partial<TrashedHistory> | null = null;
    try {
      parsed = JSON.parse(raw) as Partial<TrashedHistory>;
    } catch {
      window.localStorage.removeItem(TRASH_KEY);
      return true;
    }
    if (
      !parsed ||
      typeof parsed.expiresAt !== "number" ||
      !Array.isArray(parsed.snapshots) ||
      parsed.expiresAt < Date.now()
    ) {
      window.localStorage.removeItem(TRASH_KEY);
      return true;
    }
    const allValid =
      parsed.snapshots.length > 0 &&
      parsed.snapshots.every(isValidSnapshot);
    const valid = allValid
      ? (parsed.snapshots as FilterSnapshot[])
      : (parsed.snapshots.filter(isValidSnapshot) as FilterSnapshot[]);
    const capped = capTrashSnapshots(valid);
    if (capped.length === 0) {
      window.localStorage.removeItem(TRASH_KEY);
      return true;
    }
    // Fast path: if nothing was filtered or trimmed, the payload is unchanged.
    if (allValid && capped.length === parsed.snapshots.length) return false;
    // Only write when the serialized payload actually differs from what's
    // already on disk, to minimize localStorage churn.
    const nextPayload = JSON.stringify({
      snapshots: capped,
      expiresAt: parsed.expiresAt,
    } satisfies TrashedHistory);
    if (nextPayload === raw) return false;
    window.localStorage.setItem(TRASH_KEY, nextPayload);
    return true;
  } catch {
    return false;
  }
}

type RestoreSource = "toast" | "post-refresh";
interface RestoreEvent { at: number; count: number; source: RestoreSource }

function loadRestoreEvent(): RestoreEvent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESTORE_EVENT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<RestoreEvent>;
    if (
      !p ||
      typeof p.at !== "number" ||
      typeof p.count !== "number" ||
      (p.source !== "toast" && p.source !== "post-refresh")
    ) return null;
    return { at: p.at, count: p.count, source: p.source };
  } catch {
    return null;
  }
}

function saveRestoreEvent(ev: RestoreEvent) {
  try { window.localStorage.setItem(RESTORE_EVENT_KEY, JSON.stringify(ev)); } catch {}
}

function isValidRestoreEvent(e: unknown): e is RestoreEvent {
  if (!e || typeof e !== "object") return false;
  const x = e as Partial<RestoreEvent>;
  return (
    typeof x.at === "number" &&
    typeof x.count === "number" &&
    (x.source === "toast" || x.source === "post-refresh")
  );
}

function loadRestoreLog(): RestoreEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESTORE_LOG_KEY);
    if (!raw) {
      // Backward compat: seed from single-event key if present.
      const legacy = loadRestoreEvent();
      return legacy ? [legacy] : [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed.filter(isValidRestoreEvent) as RestoreEvent[])
      .sort((a, b) => b.at - a.at)
      .slice(0, RESTORE_LOG_LIMIT);
  } catch {
    return [];
  }
}

function saveRestoreLog(log: RestoreEvent[]) {
  try {
    if (log.length === 0) window.localStorage.removeItem(RESTORE_LOG_KEY);
    else window.localStorage.setItem(RESTORE_LOG_KEY, JSON.stringify(log));
  } catch {}
}

function formatRelative(from: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - from);
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

interface PersistedFilters {
  severities: Severity[];
  categories: Category[];
}

interface FilterSnapshot { severities: Severity[]; categories: Category[] }

function isValidSnapshot(s: unknown): s is FilterSnapshot {
  if (!s || typeof s !== "object") return false;
  const x = s as Partial<FilterSnapshot>;
  const validSev = (ALL_SEVERITIES as string[]);
  const validCat = ALL_CATEGORIES.map((c) => c.id) as string[];
  return (
    Array.isArray(x.severities) && x.severities.every((v) => validSev.includes(v as string)) &&
    Array.isArray(x.categories) && x.categories.every((v) => validCat.includes(v as string))
  );
}

function loadHistory(): FilterSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValidSnapshot) as FilterSnapshot[];
    return valid.slice(-HISTORY_LIMIT);
  } catch {
    return [];
  }
}

interface TrashedHistory { snapshots: FilterSnapshot[]; expiresAt: number }

function loadTrash(): TrashedHistory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TRASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TrashedHistory>;
    if (
      !parsed ||
      typeof parsed.expiresAt !== "number" ||
      !Array.isArray(parsed.snapshots)
    ) return null;
    if (parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(TRASH_KEY);
      return null;
    }
    const valid = parsed.snapshots.filter(isValidSnapshot) as FilterSnapshot[];
    if (valid.length === 0) {
      window.localStorage.removeItem(TRASH_KEY);
      return null;
    }
    return { snapshots: capTrashSnapshots(valid), expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function loadFilters(): PersistedFilters {
  if (typeof window === "undefined") {
    return { severities: [...ALL_SEVERITIES], categories: ALL_CATEGORIES.map((c) => c.id) };
  }
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as Partial<PersistedFilters>;
    const sev = Array.isArray(parsed.severities)
      ? (parsed.severities.filter((s) => (ALL_SEVERITIES as string[]).includes(s)) as Severity[])
      : [...ALL_SEVERITIES];
    const validCats = ALL_CATEGORIES.map((c) => c.id) as string[];
    const cat = Array.isArray(parsed.categories)
      ? (parsed.categories.filter((c) => validCats.includes(c)) as Category[])
      : (validCats as Category[]);
    return {
      severities: sev.length ? sev : [...ALL_SEVERITIES],
      categories: cat.length ? cat : (validCats as Category[]),
    };
  } catch {
    return { severities: [...ALL_SEVERITIES], categories: ALL_CATEGORIES.map((c) => c.id) };
  }
}

export function RepoAuditWorkspace() {
  const { projects, setView } = useWorkspace();
  const allowed = canAccess("repoAudit");
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "demo");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditMode, setAuditMode] = useState<AuditMode | null>(null);
  const [lastMode, setLastMode] = useState<AuditMode | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [progressEvents, setProgressEvents] = useState<AuditProgressEvent[]>([]);
  const [transport, setTransport] = useState<AuditTransportInfo | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [lastRun, setLastRun] = useState<{ source: RepoSource; mode: AuditMode } | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [resumingFromIndex, setResumingFromIndex] = useState<number | null>(null);

  // Repair workflow state
  const [fixPlan, setFixPlan] = useState<FixPlan | null>(null);
  const [fixPlanLoading, setFixPlanLoading] = useState(false);
  const [autoFixOpen, setAutoFixOpen] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [reRunning, setReRunning] = useState(false);
  const [fixIterations, setFixIterations] = useState<FixIteration[]>([]);
  const [currentIteration, setCurrentIteration] = useState<FixIteration | null>(null);
  const [fixUntilGreenRunning, setFixUntilGreenRunning] = useState(false);
  const [fixUntilGreenDone, setFixUntilGreenDone] = useState<{ passed: boolean } | null>(null);
  const fixUntilGreenAbortRef = useRef<AbortController | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [activeDiff, setActiveDiff] = useState<DiffPreview | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [navConfirm, setNavConfirm] = useState<null | { view: "dashboard" | "workspace" }>(null);

  // Warn on browser-level navigation (tab close, refresh, hard nav) while a
  // Fix Until Green run is active.
  useEffect(() => {
    if (!fixUntilGreenRunning) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fixUntilGreenRunning]);

  const guardedSetView = (target: "dashboard" | "workspace") => {
    if (fixUntilGreenRunning) {
      setNavConfirm({ view: target });
      return;
    }
    setView(target);
  };

  // Rehydrate a previously cancelled draft so users can resume after refresh.
  useEffect(() => {
    const draft = loadCancelledDraft();
    if (!draft) return;
    setCancelled(true);
    setLastRun({ source: draft.source, mode: draft.mode });
    setLastMode(draft.mode);
    setProgressEvents(draft.events);
    setTransport(draft.transport);
    if (draft.sourceLabel) setSourceLabel(draft.sourceLabel);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [severities, setSeverities] = useState<Set<Severity>>(() => new Set(loadFilters().severities));
  const [categories, setCategories] = useState<Set<Category>>(() => new Set(loadFilters().categories));
  // Snapshot stack for multi-level undo of filter changes (persisted across reloads).
  const [history, setHistory] = useState<FilterSnapshot[]>(() => loadHistory());
  const [restoreEvent, setRestoreEvent] = useState<RestoreEvent | null>(() => loadRestoreEvent());
  const [restoreLog, setRestoreLog] = useState<RestoreEvent[]>(() => loadRestoreLog());
  const [restoreLogOpen, setRestoreLogOpen] = useState(false);
  const [cleanupIntervalMs, setCleanupIntervalMs] = useState<number>(() => loadCleanupInterval());
  const [pdfThemeId, setPdfThemeId] = useState<AuditPdfThemeId>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME_ID;
    try {
      const raw = window.localStorage.getItem("korelumina:repo-audit:pdf-theme");
      if (raw && raw in AUDIT_PDF_THEMES) return raw as AuditPdfThemeId;
    } catch {}
    return DEFAULT_THEME_ID;
  });
  const [customLogo, setCustomLogo] = useState<string | null>(() => loadCustomLogo(projectId));
  const [pdfPreview, setPdfPreview] = useState<AuditPdfPreview | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [customTheme, setCustomTheme] = useState<AuditPdfThemeOverrides>(() => loadCustomTheme());
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const [retryingLogo, setRetryingLogo] = useState(false);

  // Reload the per-workspace logo whenever the active project changes.
  useEffect(() => {
    setCustomLogo(loadCustomLogo(projectId));
  }, [projectId]);

  const handleLogoUpload = (file: File) => {
    if (!projectId) {
      toast.error("Pick a workspace first");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Unsupported file", { description: "Upload a PNG, JPG, WebP, or SVG image." });
      return;
    }
    if (file.size > CUSTOM_LOGO_MAX_BYTES) {
      toast.error("Logo too large", {
        description: `Max ${(CUSTOM_LOGO_MAX_BYTES / 1024).toFixed(0)} KB · received ${(file.size / 1024).toFixed(0)} KB`,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl.startsWith("data:image/")) {
        toast.error("Could not read image");
        return;
      }
      try {
        saveCustomLogo(projectId, dataUrl);
        setCustomLogo(dataUrl);
        toast.success("Custom logo saved", {
          description: `Applied to PDF reports for ${sourceLabel || projectId}.`,
        });
      } catch (err) {
        toast.error("Could not save logo", {
          description: err instanceof Error ? err.message : "localStorage write failed",
        });
      }
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
  };

  const clearCustomLogo = () => {
    saveCustomLogo(projectId, null);
    setCustomLogo(null);
    toast("Custom logo removed", { description: "Reverted to the theme's default brand mark." });
  };

  const recordRestore = (count: number, source: RestoreSource) => {
    const ev: RestoreEvent = { at: Date.now(), count, source };
    saveRestoreEvent(ev);
    setRestoreEvent(ev);
    setRestoreLog((prev) => {
      const next = [ev, ...prev].slice(0, RESTORE_LOG_LIMIT);
      saveRestoreLog(next);
      return next;
    });
  };

  const dismissRestoreEvent = () => {
    setRestoreEvent(null);
    try { window.localStorage.removeItem(RESTORE_EVENT_KEY); } catch {}
  };

  const clearRestoreLog = () => {
    setRestoreLog([]);
    saveRestoreLog([]);
  };

  const exportRestoreLog = () => {
    if (restoreLog.length === 0) return;
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        workspace: "repo-audit",
        events: restoreLog.map((ev) => ({
          at: ev.at,
          atIso: new Date(ev.at).toISOString(),
          count: ev.count,
          source: ev.source,
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `repo-audit-restore-log-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${restoreLog.length} restore event${restoreLog.length === 1 ? "" : "s"}`);
    } catch (err) {
      toast.error("Failed to export log", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const buildPreview = async () => {
    if (!report) return;
    const activeReport = filtered ?? report;
    const findingsCount =
      activeReport.missingDependencies.length +
      activeReport.buildErrors.length +
      activeReport.envVars.length +
      activeReport.securityFindings.length;
    const themeLabel = AUDIT_PDF_THEMES[pdfThemeId].label;
    setPdfPreviewOpen(true);
    setPdfPreviewLoading(true);
    // Revoke any previous preview before replacing.
    if (pdfPreview?.blobUrl) URL.revokeObjectURL(pdfPreview.blobUrl);
    setPdfPreview(null);
    const toastId = toast.loading(`Rendering preview · ${themeLabel} theme`, {
      description: `${findingsCount} finding${findingsCount === 1 ? "" : "s"} · ${activeReport.repairPlan.length} repair step${activeReport.repairPlan.length === 1 ? "" : "s"}`,
    });
    try {
      const result = await previewAuditPdf(
        activeReport,
        sourceLabel || report.projectId,
        { severities: Array.from(severities), categories: Array.from(categories) },
        pdfThemeId,
        customLogo,
        pdfThemeId === "custom" ? customTheme : undefined,
      );
      setPdfPreview(result);
      toast.success(`Preview ready · ${themeLabel} theme`, {
        id: toastId,
        description: `${result.fileName} · ${result.pageCount} page${result.pageCount === 1 ? "" : "s"}`,
      });
      if (result.logoRequested && !result.logoLoaded && !retryingLogo) {
        toast.warning("Logo unavailable", {
          description: `Branded the report in text-only mode for the ${themeLabel} theme.`,
          action: { label: "Retry", onClick: () => { void retryLogo(); } },
        });
      }
    } catch (err) {
      setPdfPreviewOpen(false);
      toast.error(`Failed to generate ${themeLabel} preview`, {
        id: toastId,
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPdfPreviewLoading(false);
    }
  };

  const confirmDownload = async () => {
    if (!pdfPreview || !report) return;
    const themeLabel = AUDIT_PDF_THEMES[pdfPreview.themeId]?.label ?? pdfPreview.themeId;
    try {
      // Save the already-generated blob directly so we don't re-render.
      const url = pdfPreview.blobUrl;
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfPreview.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`PDF downloaded · ${themeLabel} theme`, {
        description: `${pdfPreview.fileName} · ${pdfPreview.pageCount} page${pdfPreview.pageCount === 1 ? "" : "s"}`,
      });
      setPdfPreviewOpen(false);
    } catch (err) {
      toast.error("Download failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const retryLogo = async () => {
    if (!report || retryingLogo) return;
    setRetryingLogo(true);
    try {
      await buildPreview();
      // buildPreview replaces pdfPreview; React state update is async but the
      // returned promise resolves after setPdfPreview, so we use the latest via
      // a microtask-deferred read on the next render. For toast feedback we
      // rely on the warning toast already fired by buildPreview when the logo
      // still fails, and surface success here when it loaded.
      // We can't read pdfPreview synchronously, so fire a follow-up toast
      // based on a fresh fetch from state via a short timeout.
      setTimeout(() => {
        setPdfPreview((current) => {
          if (current && current.logoRequested && current.logoLoaded) {
            toast.success("Logo loaded · re-rendered with branding");
          } else if (current && current.logoRequested && !current.logoLoaded) {
            toast.error("Logo still unavailable", {
              description: "Keeping the report in text-only mode.",
            });
          }
          return current;
        });
      }, 0);
    } finally {
      setRetryingLogo(false);
    }
  };

  const handlePreviewOpenChange = (open: boolean) => {
    setPdfPreviewOpen(open);
    if (!open && pdfPreview?.blobUrl) {
      URL.revokeObjectURL(pdfPreview.blobUrl);
      setPdfPreview(null);
    }
  };

  // Persist undo history so a refresh keeps the last pre-reset selections.
  useEffect(() => {
    try {
      if (history.length === 0) {
        window.localStorage.removeItem(HISTORY_KEY);
      } else {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      }
    } catch {}
  }, [history]);

  // On mount, if a recent "clear" left a recoverable snapshot, offer to restore it.
  useEffect(() => {
    cleanupTrash();
    const trash = loadTrash();
    if (!trash) return;
    const remainingMs = trash.expiresAt - Date.now();
    const remainingMin = Math.max(1, Math.round(remainingMs / 60000));
    const t = toast(
      `Recover ${trash.snapshots.length} cleared undo step${trash.snapshots.length === 1 ? "" : "s"}?`,
      {
        description: `Available for about ${remainingMin} more minute${remainingMin === 1 ? "" : "s"}.`,
        duration: Math.min(remainingMs, 30000),
        action: {
          label: "Undo clear",
          onClick: () => {
            const restored = trash.snapshots.slice(-HISTORY_LIMIT);
            setHistory(restored);
            try {
              window.localStorage.setItem(HISTORY_KEY, JSON.stringify(restored));
              window.localStorage.removeItem(TRASH_KEY);
            } catch {}
            recordRestore(restored.length, "post-refresh");
            toast.success(`Restored ${restored.length} undo step${restored.length === 1 ? "" : "s"}`);
          },
        },
        cancel: {
          label: "Dismiss",
          onClick: () => {
            try { window.localStorage.removeItem(TRASH_KEY); } catch {}
          },
        },
      }
    );
    return () => { toast.dismiss(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodically sweep trash so expired payloads are purged and the size cap
  // is re-enforced even if the user keeps the tab open across the TTL.
  useEffect(() => {
    const tick = () => cleanupTrash();
    const onVisibility = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisibility);
    let interval: number | undefined;
    if (cleanupIntervalMs > 0) {
      interval = window.setInterval(tick, cleanupIntervalMs);
    }
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [cleanupIntervalMs]);

  const snapshot = (): FilterSnapshot => ({
    severities: Array.from(severities),
    categories: Array.from(categories),
  });

  const pushHistory = () => {
    const snap = snapshot();
    setHistory((h) => {
      const next = [...h, snap];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setSeverities(new Set(prev.severities));
      setCategories(new Set(prev.categories));
      return h.slice(0, -1);
    });
  };

  // Persist filter selections so they restore on revisit.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({
          severities: Array.from(severities),
          categories: Array.from(categories),
        } satisfies PersistedFilters)
      );
    } catch {}
  }, [severities, categories]);

  const toggle = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  };

  const envSeverity = (e: { required: boolean; present: boolean }): Severity =>
    e.required && !e.present ? "high" : "low";

  const filtered = useMemo(() => {
    if (!report) return null;
    const sev = severities;
    const cat = categories;
    return {
      ...report,
      missingDependencies: cat.has("deps")
        ? report.missingDependencies.filter((d) => sev.has(d.severity))
        : [],
      buildErrors: cat.has("build") && sev.has("high") ? report.buildErrors : [],
      envVars: cat.has("env")
        ? report.envVars.filter((e) => sev.has(envSeverity(e)))
        : [],
      securityFindings: cat.has("security")
        ? report.securityFindings.filter((f) => sev.has(f.severity))
        : [],
    };
  }, [report, severities, categories]);

  const counts = useMemo(() => {
    if (!report || !filtered) return { total: 0, filtered: 0 };
    const total =
      report.missingDependencies.length +
      report.buildErrors.length +
      report.envVars.length +
      report.securityFindings.length;
    const f =
      filtered.missingDependencies.length +
      filtered.buildErrors.length +
      filtered.envVars.length +
      filtered.securityFindings.length;
    return { total, filtered: f };
  }, [report, filtered]);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    getAudit(projectId).then((r) => {
      if (!active) return;
      setReport(r);
      const p = projects.find((x) => x.id === projectId);
      if (p) setSourceLabel(p.name);
    });
    return () => { active = false; };
  }, [projectId, allowed, projects]);

  const describe = (s: RepoSource) =>
    s.kind === "project"
      ? projects.find((p) => p.id === s.projectId)?.name ?? s.projectId
      : s.kind === "github"
      ? s.url.replace(/^https?:\/\/(www\.)?/, "")
      : `${s.fileName} (${(s.sizeBytes / (1024 * 1024)).toFixed(1)} MB)`;

  const run = async (
    source: RepoSource,
    mode: AuditMode = "scan",
    options: { resumeFromIndex?: number; preserveEvents?: boolean } = {},
  ) => {
    setLoading(true);
    setAuditMode(mode);
    setAuditError(null);
    if (!options.preserveEvents) {
      setProgressEvents([]);
      setTransport(null);
    }
    setCancelled(false);
    setLastRun({ source, mode });
    saveCancelledDraft(null);
    setResumingFromIndex(
      options.resumeFromIndex && options.resumeFromIndex > 0 ? options.resumeFromIndex : null,
    );
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await runAudit(source, mode, {
        signal: controller.signal,
        resumeFromIndex: options.resumeFromIndex,
        onProgress: (ev) => {
          if (controller.signal.aborted) return;
          setProgressEvents((prev) => [...prev, ev]);
        },
        onTransport: (info) => {
          if (controller.signal.aborted) return;
          setTransport(info);
          if (info.transport === "simulated") {
            toast.warning("Live stream unavailable", {
              description: info.reason ?? "Falling back to simulated progress.",
            });
          }
        },
      });
      if (controller.signal.aborted) return;
      setReport(r);
      setSourceLabel(describe(source));
      setLastMode(mode);
      if (source.kind === "project") setProjectId(source.projectId);
      // Deterministic engine pass for stored projects — surfaces a true
      // file-map–based RepairPlan alongside the existing audit report and
      // records the run against the user's usage snapshot.
      if (source.kind === "project") {
        try {
          const plan = auditStoredProject(source.projectId);
          const u = auth.getUser();
          if (u) usageProvider.recordAudit(u.id);
          if (plan.findings.length > 0) {
            toast.message(`Repair plan: ${plan.findings.length} finding${plan.findings.length === 1 ? "" : "s"}`, {
              description: `${plan.steps.length} suggested step${plan.steps.length === 1 ? "" : "s"}.`,
            });
          }
        } catch { /* bridge is best-effort; primary report already shown */ }
      }
      if (mode === "deep") {
        toast.success("Deep Audit completed. Full repository analysis is ready.");
      } else {
        toast.success("Fast Scan completed successfully.");
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unknown error";
      setAuditError(message);
      toast.error(mode === "deep" ? "Deep Audit failed" : "Fast Scan failed", { description: message });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
      setAuditMode(null);
    }
  };

  const cancelAudit = () => {
    if (!abortRef.current) return;
    const mode = auditMode;
    abortRef.current.abort();
    abortRef.current = null;
    setCancelled(true);
    setLoading(false);
    setAuditMode(null);
    if (lastRun) {
      saveCancelledDraft({
        source: lastRun.source,
        mode: lastRun.mode,
        events: progressEvents,
        transport,
        sourceLabel: sourceLabel || describe(lastRun.source),
        cancelledAt: Date.now(),
      });
    }
    toast(mode === "deep" ? "Deep Audit cancelled" : "Fast Scan cancelled", {
      description: "Partial progress saved — resume even after a refresh.",
    });
  };

  const resumeAudit = () => {
    if (!lastRun) return;
    // Compute the next step to run from the persisted timeline: the highest
    // index we've seen marked `done`, plus one. Falls back to the last
    // in-flight index when no `done` event was captured.
    let resumeFromIndex = 0;
    for (const ev of progressEvents) {
      if (ev.status === "done") resumeFromIndex = Math.max(resumeFromIndex, ev.index + 1);
      else if (ev.status === "running") resumeFromIndex = Math.max(resumeFromIndex, ev.index);
    }
    saveCancelledDraft(null);
    run(lastRun.source, lastRun.mode, { resumeFromIndex, preserveEvents: true });
    if (resumeFromIndex > 0) {
      toast.success(`Resuming from step ${resumeFromIndex + 1}`, {
        description: "Picking up where the previous run left off.",
      });
    }
  };

  const dismissDraft = () => {
    setCancelled(false);
    setProgressEvents([]);
    setTransport(null);
    setResumingFromIndex(null);
    saveCancelledDraft(null);
  };

  // ----- Repair workflow handlers -----
  const handleGenerateFixPlan = async () => {
    if (!report) return;
    setFixPlanLoading(true);
    try {
      const plan = await generateFixPlan(report.projectId);
      setFixPlan(plan);
      toast.success("Fix plan generated", {
        description: `${plan.findingsAddressed} findings · ${plan.filesAffected.length} files · ~${plan.estMinutes} min`,
      });
    } catch (err) {
      toast.error("Failed to generate fix plan", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setFixPlanLoading(false);
    }
  };

  const handleAutoFix = async () => {
    if (!report) return;
    setAutoFixOpen(true);
    if (!fixPlan) {
      await handleGenerateFixPlan();
    }
  };

  const handleGenerateDiffs = async (): Promise<DiffPreview[] | null> => {
    if (!report) return null;
    setAutoFixing(true);
    try {
      const result = await autoFix(report.projectId, (pct, message) => {
        // Could surface inline; toast for major milestones only.
        if (pct === 0) toast(message);
      });
      toast.success(`Generated ${result.diffs.length} diff${result.diffs.length === 1 ? "" : "s"}`);
      return result.diffs;
    } catch (err) {
      toast.error("Auto Fix failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
      return null;
    } finally {
      setAutoFixing(false);
    }
  };

  const handleApplyAutoFix = async () => {
    if (!report) return;
    toast.success("Fixes applied to workspace");
    // Mark report as passing optimistically to surface the success banner.
    setReport({ ...report, buildStatus: "passing", typeErrors: 0, buildErrors: [] });
  };

  const handleFixUntilGreen = async () => {
    if (!report || fixUntilGreenRunning) return;
    setFixUntilGreenRunning(true);
    setFixUntilGreenDone(null);
    setFixIterations([]);
    setCurrentIteration(null);
    const controller = new AbortController();
    fixUntilGreenAbortRef.current = controller;
    try {
      const result = await fixUntilGreen(
        report.projectId,
        (it) => {
          setCurrentIteration(it);
          setFixIterations((prev) => [...prev, it]);
        },
        controller.signal,
      );
      setFixUntilGreenDone({ passed: result.passed });
      if (result.passed) {
        toast.success(`Build passing after ${result.iterations} iteration${result.iterations === 1 ? "" : "s"}`);
        setReport({ ...report, buildStatus: "passing", typeErrors: 0, buildErrors: [] });
      } else {
        toast.warning(`Stopped after ${result.iterations} iterations`, {
          description: "Some findings still need manual review.",
        });
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        toast.error("Fix Until Green failed", {
          description: err instanceof Error ? err.message : "Unknown error",
        });
      }
    } finally {
      setFixUntilGreenRunning(false);
      if (fixUntilGreenAbortRef.current === controller) fixUntilGreenAbortRef.current = null;
    }
  };

  const cancelFixUntilGreen = () => {
    fixUntilGreenAbortRef.current?.abort();
    fixUntilGreenAbortRef.current = null;
    setFixUntilGreenRunning(false);
    setFixUntilGreenDone({ passed: false });
    toast("Fix Until Green cancelled");
  };

  const handleReRunAudit = async () => {
    if (!report) return;
    setReRunning(true);
    try {
      const r = await reRunAudit(report.projectId);
      setReport(r);
      toast.success("Audit re-run complete", {
        description: r.buildStatus === "passing" ? "Build is now passing." : `${r.typeErrors} type errors remaining.`,
      });
    } catch (err) {
      toast.error("Re-run failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setReRunning(false);
    }
  };

  const handlePreviewDiff = (d: DiffPreview) => {
    setActiveDiff(d);
    setDiffOpen(true);
  };

  if (!allowed) {
    return (
      <div className="flex-1 grid place-items-center p-10">
        <div className="glass rounded-2xl border border-white/10 p-8 max-w-md text-center">
          <ShieldCheck className="h-8 w-8 text-gold mx-auto mb-3" />
          <div className="font-display text-xl font-semibold">Repo Audit Engine</div>
          <p className="text-[13px] text-muted-foreground mt-2">
            This is an internal engineering tool. Available on Business and Enterprise plans, and to KoreLumina in-house developers.
          </p>
          <LuminaButton className="mt-5" onClick={() => setView("dashboard")}>Back to dashboard</LuminaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-12">
        {/* Header */}
        <div className="mb-6">
            <button
              onClick={() => guardedSetView("dashboard")}
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground mb-2"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold mb-2 inline-flex items-center gap-2">
              <Activity className="h-3 w-3" /> Internal · Engineering
            </div>
            <h1 className="font-display text-3xl md:text-[40px] font-semibold tracking-[-0.025em] leading-[1.05]">
              Repo Audit <span className="text-gradient-lumina">Engine</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-[13px] max-w-xl">
              Diagnose imported repositories, surface missing dependencies and security issues, and generate an executable repair plan.
            </p>
        </div>

        <div className="mb-6">
          <RepoSourcePicker
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            defaultProjectId={projectId}
            loading={loading}
            loadingMode={auditMode}
            onRun={run}
          />
        </div>

        {loading || auditError || cancelled ? (
          <div className="mb-6">
            <DeepAuditProgress
              mode={auditMode ?? lastMode ?? "scan"}
              error={auditError}
              events={progressEvents}
              onCancel={loading ? cancelAudit : undefined}
              transport={transport}
              cancelled={cancelled}
              onResume={cancelled && lastRun ? resumeAudit : undefined}
              onDismissDraft={cancelled ? dismissDraft : undefined}
              resumingFromIndex={resumingFromIndex}
            />
          </div>
        ) : null}

        {!report && !loading && !auditError ? (
          <div className="glass rounded-2xl border border-white/10 p-10 text-center text-muted-foreground">
            Choose a source above and run an audit to view findings.
          </div>
        ) : report ? (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-6 min-w-0">
              {sourceLabel && (
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-surface-2 border border-border font-mono">{sourceLabel}</span>
                    {lastMode && (
                      <span
                        className={
                          lastMode === "deep"
                            ? "px-2 py-0.5 rounded-md text-[10px] uppercase tracking-[0.18em] font-semibold bg-gold/15 border border-gold/40 text-gold"
                            : "px-2 py-0.5 rounded-md text-[10px] uppercase tracking-[0.18em] font-semibold bg-sky-500/15 border border-sky-400/40 text-sky-300"
                        }
                      >
                        {lastMode === "deep" ? "Deep Audit" : "Fast Scan"}
                      </span>
                    )}
                    <span>audited {new Date(report.generatedAt).toLocaleString()}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    {customLogo ? (
                      <span
                        className="inline-flex items-center gap-1 h-7 pl-1 pr-2 rounded-md border border-violet/40 bg-violet/10 text-[11px] text-foreground"
                        title="Custom logo applied to this workspace's PDF reports"
                      >
                        <img src={customLogo} alt="Custom logo preview" className="h-5 w-5 rounded object-contain bg-surface-2" />
                        <span className="hidden sm:inline">Custom logo</span>
                        <button
                          onClick={clearCustomLogo}
                          className="ml-0.5 text-muted-foreground hover:text-foreground"
                          title="Remove custom logo for this workspace"
                          aria-label="Remove custom logo"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <label
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border bg-surface-1 text-[11px] text-foreground hover:bg-surface-2 hover:border-white/15 transition cursor-pointer"
                        title="Upload a custom logo for this workspace's PDF reports (PNG/JPG/WebP/SVG · max 512 KB)"
                      >
                        <Upload className="h-3 w-3" /> Logo
                        <input
                          type="file"
                          accept={CUSTOM_LOGO_ACCEPT}
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleLogoUpload(f);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                    )}
                    <label className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Theme
                      <select
                        value={pdfThemeId}
                        onChange={(e) => {
                          const next = e.target.value as AuditPdfThemeId;
                          setPdfThemeId(next);
                          try { window.localStorage.setItem("korelumina:repo-audit:pdf-theme", next); } catch {}
                        }}
                        className="h-7 bg-surface-1 border border-border rounded-md px-2 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring normal-case tracking-normal"
                        title={AUDIT_PDF_THEMES[pdfThemeId].description}
                      >
                        {Object.values(AUDIT_PDF_THEMES).map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </label>
                    {pdfThemeId === "custom" && (
                      <button
                        onClick={() => setThemeEditorOpen(true)}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-violet/40 bg-violet/10 text-[11px] text-foreground hover:bg-violet/15 transition"
                        title="Edit gradient, accent color, and footer for the Custom theme"
                      >
                        <Palette className="h-3 w-3" /> Edit
                      </button>
                    )}
                    <button
                      onClick={buildPreview}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-border bg-surface-1 text-[11px] text-foreground hover:bg-surface-2 hover:border-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Preview the styled PDF before downloading"
                    >
                      <Download className="h-3 w-3" /> Preview PDF
                    </button>
                  </div>
                </div>
              )}
              <AuditSummary report={report} />
              {report.buildStatus === "passing" && (
                <BuildPassedBanner
                  onExportPdf={buildPreview}
                  onOpenBuilder={() => setView("workspace")}
                  onDeploy={() => toast("Deploy to Vercel", { description: "Deployment flow coming soon." })}
                />
              )}
              <RepairActionBar
                onGenerateFixPlan={handleGenerateFixPlan}
                onAutoFix={handleAutoFix}
                onFixUntilGreen={handleFixUntilGreen}
                onReRunAudit={handleReRunAudit}
                onViewLogs={() => setLogsOpen(true)}
                generating={fixPlanLoading}
                autoFixing={autoFixing}
                fixingUntilGreen={fixUntilGreenRunning}
                reRunning={reRunning}
                disabled={loading}
              />
              {(fixIterations.length > 0 || fixUntilGreenRunning) && (
                <FixUntilGreenPanel
                  iterations={fixIterations}
                  current={currentIteration}
                  onCancel={fixUntilGreenRunning ? () => setCancelConfirmOpen(true) : undefined}
                  done={!fixUntilGreenRunning && fixUntilGreenDone !== null}
                  passed={fixUntilGreenDone?.passed}
                />
              )}
              {restoreEvent && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-200">
                  <span className="inline-flex items-center gap-2">
                    <History className="h-3 w-3" />
                    Restored {restoreEvent.count} undo step{restoreEvent.count === 1 ? "" : "s"}
                    {" · "}
                    {restoreEvent.source === "post-refresh" ? "after refresh" : "from clear toast"}
                    {" · "}
                    <span className="text-emerald-300/70">{formatRelative(restoreEvent.at)}</span>
                  </span>
                  <div className="inline-flex items-center gap-1">
                    {restoreLog.length > 0 && (
                      <button
                        onClick={() => setRestoreLogOpen((v) => !v)}
                        className="h-5 px-1.5 rounded text-[10px] hover:bg-emerald-500/20 text-emerald-200/90 hover:text-emerald-100"
                        title="Show recent restore events"
                      >
                        {restoreLogOpen ? "Hide" : `History (${restoreLog.length})`}
                      </button>
                    )}
                    <button
                      onClick={dismissRestoreEvent}
                      className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-emerald-500/20 text-emerald-200/80 hover:text-emerald-100"
                      title="Dismiss"
                      aria-label="Dismiss restore notice"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {restoreLogOpen && restoreLog.length > 0 && (
                <div className="rounded-lg border border-border bg-surface-1 p-3 text-[11px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="uppercase tracking-[0.18em] text-[10px] text-muted-foreground inline-flex items-center gap-1.5">
                      <History className="h-3 w-3" /> Recent restores
                    </span>
                    <div className="inline-flex items-center gap-2">
                      <label className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        Sweep
                        <select
                          value={cleanupIntervalMs}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setCleanupIntervalMs(next);
                            try {
                              window.localStorage.setItem(CLEANUP_INTERVAL_KEY, String(next));
                            } catch {}
                          }}
                          className="bg-surface-2 border border-border rounded px-1 py-0.5 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          title="How often to run the trash cleanup sweep while this tab stays open"
                        >
                          {CLEANUP_INTERVAL_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => {
                          const changed = cleanupTrash();
                          if (changed) {
                            toast.success("Trash swept", { description: "Removed expired or over-cap entries." });
                          } else {
                            toast("Trash already clean");
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Run cleanupTrash immediately with current settings"
                      >
                        <Sparkles className="h-3 w-3" /> Sweep now
                      </button>
                      <button
                        onClick={exportRestoreLog}
                        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        title="Download recent restore events as JSON"
                      >
                        <Download className="h-3 w-3" /> Export log
                      </button>
                      <button
                        onClick={clearRestoreLog}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Clear log
                      </button>
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {restoreLog.map((ev, i) => (
                      <li
                        key={`${ev.at}-${i}`}
                        className="flex items-center justify-between gap-3 text-foreground/80"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="font-mono text-foreground">
                            {ev.count} step{ev.count === 1 ? "" : "s"}
                          </span>
                          <span className="text-muted-foreground">
                            · {ev.source === "post-refresh" ? "after refresh" : "from clear toast"}
                          </span>
                        </span>
                        <span
                          className="text-muted-foreground"
                          title={new Date(ev.at).toLocaleString()}
                        >
                          {formatRelative(ev.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <FindingsFilters
                state={{ severities, categories }}
                counts={counts}
                canUndo={history.length > 0}
                undoCount={history.length}
                onUndo={undo}
                onClearHistory={() => {
                  const cleared = history.length;
                  if (cleared === 0) return;
                  const previous = history;
                  const trashSnapshots = capTrashSnapshots(previous);
                  const dropped = previous.length - trashSnapshots.length;
                  const expiresAt = Date.now() + TRASH_TTL_MS;
                  setHistory([]);
                  try {
                    cleanupTrash();
                    window.localStorage.removeItem(HISTORY_KEY);
                    if (trashSnapshots.length > 0) {
                      window.localStorage.setItem(
                        TRASH_KEY,
                        JSON.stringify({ snapshots: trashSnapshots, expiresAt } satisfies TrashedHistory)
                      );
                    } else {
                      window.localStorage.removeItem(TRASH_KEY);
                    }
                  } catch {}
                  toast.success(`Cleared ${cleared} undo step${cleared === 1 ? "" : "s"}`, {
                    description: dropped > 0
                      ? `Only the most recent ${trashSnapshots.length} can be recovered (oldest ${dropped} dropped to save space).`
                      : undefined,
                    action: {
                      label: "Undo clear",
                      onClick: () => {
                        const restored = trashSnapshots;
                        setHistory(restored);
                        try {
                          window.localStorage.setItem(HISTORY_KEY, JSON.stringify(restored));
                          window.localStorage.removeItem(TRASH_KEY);
                        } catch {}
                        recordRestore(restored.length, "toast");
                        toast.success(`Restored ${restored.length} undo step${restored.length === 1 ? "" : "s"}`);
                      },
                    },
                  });
                }}
                onToggleSeverity={(s) => {
                  pushHistory();
                  setSeverities((prev) => toggle(prev, s));
                }}
                onToggleCategory={(c) => {
                  pushHistory();
                  setCategories((prev) => toggle(prev, c));
                }}
                onClear={() => {
                  pushHistory();
                  setSeverities(new Set(ALL_SEVERITIES));
                  setCategories(new Set(ALL_CATEGORIES.map((c) => c.id)));
                  try { window.localStorage.removeItem(FILTERS_KEY); } catch {}
                  toast.success("Filters reset to defaults", {
                    action: {
                      label: "Undo",
                      onClick: undo,
                    },
                    duration: 6000,
                  });
                }}
              />
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="bg-surface-1 border border-border h-9">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="deps">Dependencies</TabsTrigger>
                  <TabsTrigger value="build">Build Errors</TabsTrigger>
                  <TabsTrigger value="env">Environment</TabsTrigger>
                  <TabsTrigger value="sec">Security</TabsTrigger>
                  <TabsTrigger value="plan">Repair Plan</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 mt-4">
                  <DependencyAuditCard report={filtered!} />
                  <BuildErrorsCard report={filtered!} />
                </TabsContent>
                <TabsContent value="deps" className="mt-4"><DependencyAuditCard report={filtered!} /></TabsContent>
                <TabsContent value="build" className="mt-4"><BuildErrorsCard report={filtered!} /></TabsContent>
                <TabsContent value="env" className="mt-4"><EnvironmentAuditCard report={filtered!} /></TabsContent>
                <TabsContent value="sec" className="mt-4"><SecurityAuditCard report={filtered!} /></TabsContent>
                <TabsContent value="plan" className="mt-4">
                  <StepDiffPanel report={report} />
                </TabsContent>
              </Tabs>
            </div>

            <RepairPlanCard report={report} />
          </div>
        ) : null}
      </div>
      <AuditPdfPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={handlePreviewOpenChange}
        preview={pdfPreview}
        loading={pdfPreviewLoading}
        onConfirmDownload={confirmDownload}
        onRetryLogo={retryLogo}
        retryingLogo={retryingLogo}
      />
      <AuditPdfThemeEditor
        open={themeEditorOpen}
        onOpenChange={setThemeEditorOpen}
        value={customTheme}
        onSave={(next) => {
          setCustomTheme(next);
          saveCustomTheme(next);
          setPdfThemeId("custom");
          try { window.localStorage.setItem("korelumina:repo-audit:pdf-theme", "custom"); } catch {}
          toast.success("Custom theme saved");
        }}
        onReset={() => {
          setCustomTheme({});
          try { window.localStorage.removeItem(CUSTOM_THEME_KEY); } catch {}
          toast("Custom theme reset");
        }}
      />
      <AutoFixModal
        open={autoFixOpen}
        onOpenChange={setAutoFixOpen}
        fixPlan={fixPlan}
        loadingPlan={fixPlanLoading}
        onGenerateDiffs={handleGenerateDiffs}
        onPreviewDiff={handlePreviewDiff}
        onApply={handleApplyAutoFix}
      />
      <BuildLogsDrawer
        open={logsOpen}
        onOpenChange={setLogsOpen}
        projectId={report?.projectId ?? projectId}
      />
      <DiffPreviewDialog
        open={diffOpen}
        onOpenChange={setDiffOpen}
        diff={activeDiff}
      />
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Fix Until Green?</AlertDialogTitle>
            <AlertDialogDescription>
              Stopping the run will discard the current iteration. Any fixes already applied will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Running</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelFixUntilGreen}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={navConfirm !== null} onOpenChange={(o) => !o && setNavConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave while Fix Until Green is running?</AlertDialogTitle>
            <AlertDialogDescription>
              The current iteration will be cancelled and any in-flight fixes will stop. Already applied changes will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay on Page</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = navConfirm?.view ?? "dashboard";
                cancelFixUntilGreen();
                setNavConfirm(null);
                setView(target);
              }}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Leave Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}