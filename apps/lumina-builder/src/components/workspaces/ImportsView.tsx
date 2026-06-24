import { useEffect, useMemo, useState } from "react";
import { Github, Plus, Upload, FolderGit2, MoreHorizontal, ArrowLeft, Search, ExternalLink, Pencil, Copy, Trash2, Archive, FolderOpen, Clock, Activity, GitBranch, Globe, BookOpen, X, Link2, RotateCcw, SlidersHorizontal, ArrowDownAZ, ArrowUpAZ, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { toast } from "sonner";
import {
  useWorkspace,
  type Project,
} from "@/context/WorkspaceContext";

import {
  formatLastEdited,
} from "@/lib/formatLastEdited";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import { luminaFrame } from "@/lib/luminaPalette";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  getRuntimeLogs,
  getRuntimeStatus,
  listRuntimeFiles,
  readRuntimeFile,
  restartRuntime,
  startRuntime,
  stopRuntime,
} from "@/services/runtimeService";


import {
  buildRepoKnowledgeGraphFromFiles,
} from "@/services/repoIntelligenceService";

const statusStyle = {
  live: "bg-cyan/10 text-cyan border-cyan/25",
  building: "bg-gold/10 text-gold border-gold/25",
  draft: "bg-surface-2 text-muted-foreground border-border",
};

const INTELLIGENCE_TEXT_FILE_RE =
  /\.(tsx|ts|jsx|js|mjs|cjs|css|scss|sass|less|html|json|md|mdx|txt|yml|yaml|toml|env|gitignore|dockerignore|config|svg)$/i;

const INTELLIGENCE_SKIP_PATH_RE =
  /(^|\/)(node_modules|\.git|dist|build|\.next|coverage|\.turbo|\.cache)(\/|$)/;

function isRepoIntelligenceReadableFile(file: string) {
  const normalized = file.replace(/\\/g, "/");

  if (INTELLIGENCE_SKIP_PATH_RE.test(normalized)) return false;
  if (normalized.includes("\0")) return false;
  if (normalized.endsWith("/")) return false;
  if (INTELLIGENCE_TEXT_FILE_RE.test(normalized)) return true;

  const base = normalized.split("/").pop() ?? "";

  return [
    "Dockerfile",
    "Procfile",
    "Makefile",
    "README",
    "LICENSE",
    ".env",
    ".env.example",
    ".gitignore",
  ].includes(base);
}

function summarizeRepoGraph(
  graph: ReturnType<typeof buildRepoKnowledgeGraphFromFiles>,
) {
  return {
    projectId: graph.projectId,
    framework: graph.framework,
    packageManager: graph.packageManager,
    entryFiles: graph.entryFiles,
    summary: graph.summary,
  };
}

type SourceKind = "github" | "zip" | "folder";
export type SourceOverride = { sourceUrl?: string; previewUrl?: string; readmeUrl?: string };
type ImportSource = {
  kind: SourceKind;
  label: string;
  detail: string;
  icon: typeof Github;
  sourceUrl: string;
  previewUrl: string;
  readmeUrl: string;
  isOverridden: boolean;
};
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "project";
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
const KINDS: SourceKind[] = ["github", "zip", "folder"];
const sourceFor = (p: Project, override?: SourceOverride): ImportSource => {
  const sourceUrl = override?.sourceUrl?.trim() || p.sourceUrl || "";
  const previewUrl = override?.previewUrl?.trim() || p.previewUrl || "";
  const readmeUrl =
    override?.readmeUrl?.trim() ||
    (sourceUrl.includes("github.com") ? `${sourceUrl.replace(/\.git$/, "")}#readme` : "");

  const isOverridden = !!(override?.sourceUrl || override?.previewUrl || override?.readmeUrl);

  const kind: SourceKind =
    sourceUrl.includes("github.com")
      ? "github"
      : p.sourceUrl
        ? "github"
        : "folder";

  const detail = sourceUrl
    ? sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : "Runtime import";

  const icon = kind === "github" ? Github : kind === "zip" ? Archive : FolderOpen;
  const label = kind === "github" ? "GitHub" : kind === "zip" ? "ZIP archive" : "Runtime";

  return { kind, label, detail, icon, sourceUrl, previewUrl, readmeUrl, isOverridden };
};

const OVERRIDES_KEY = "imports.sourceOverrides.v1";
const loadOverrides = (): Record<string, SourceOverride> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};
const openExternal = (url: string, description?: string) => {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    toast.error("Popup blocked", { description: "Allow popups to open external links." });
    return;
  }
  toast.success("Opening link", { description: description ?? url });
};
const copyLink = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied", { description: url });
  } catch {
    toast.error("Couldn't copy link");
  }
};

// Time bucket from accurate epoch ms timestamp (relative to now).
const DAY_MS = 86_400_000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
type TzMode = "local" | "utc";
const TZ_KEY = "imports.tzMode.v1";
const loadTzMode = (): TzMode => {
  if (typeof window === "undefined") return "local";
  try { const v = window.localStorage.getItem(TZ_KEY); return v === "utc" ? "utc" : "local"; } catch { return "local"; }
};
const localTzLabel = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Local"; } catch { return "Local"; }
};

type SortBy = "recent" | "name" | "status" | "source";
type SortDir = "asc" | "desc";
type TimeFilter = "all" | "today" | "week" | "month" | "older";
const PREFS_KEY = "imports.viewPrefs.v1";
const RESET_SNAPSHOT_KEY = "imports.viewPrefs.resetSnapshot.v1";
const RESET_WINDOW_MS = 30_000;
type ResetPhase = "reset" | "undone";
type ResetSnapshot = { prev: ViewPrefs; defaults: ViewPrefs; ts: number; phase: ResetPhase };
const loadResetSnapshot = (): ResetSnapshot | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESET_SNAPSHOT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ResetSnapshot;
    if (!s || typeof s.ts !== "number") return null;
    if (Date.now() - s.ts > RESET_WINDOW_MS) return null;
    if (s.phase !== "reset" && s.phase !== "undone") return null;
    return s;
  } catch { return null; }
};
const clearResetSnapshot = () => {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(RESET_SNAPSHOT_KEY); } catch { /* ignore */ }
};
const saveResetSnapshot = (s: ResetSnapshot) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(RESET_SNAPSHOT_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};
type ViewPrefs = { sortBy: SortBy; sortDir: SortDir; timeFilter: TimeFilter };
const DEFAULT_PREFS: ViewPrefs = { sortBy: "recent", sortDir: "desc", timeFilter: "all" };
const VALID_SORT: SortBy[] = ["recent", "name", "status", "source"];
const VALID_DIR: SortDir[] = ["asc", "desc"];
const VALID_TIME: TimeFilter[] = ["all", "today", "week", "month", "older"];
const loadPrefs = (): ViewPrefs => {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<ViewPrefs>;
    return {
      sortBy:     VALID_SORT.includes(p.sortBy as SortBy)       ? (p.sortBy as SortBy)         : DEFAULT_PREFS.sortBy,
      sortDir:    VALID_DIR.includes(p.sortDir as SortDir)      ? (p.sortDir as SortDir)       : DEFAULT_PREFS.sortDir,
      timeFilter: VALID_TIME.includes(p.timeFilter as TimeFilter) ? (p.timeFilter as TimeFilter) : DEFAULT_PREFS.timeFilter,
    };
  } catch { return DEFAULT_PREFS; }
};
const formatExactDateTime = (ts: number, tz: TzMode = "local") => {
  try {
    const opts: Intl.DateTimeFormatOptions = {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
      timeZone: tz === "utc" ? "UTC" : undefined,
      timeZoneName: "short",
    };
    return new Intl.DateTimeFormat(undefined, opts).format(new Date(ts));
  } catch {
    return new Date(ts).toString();
  }
};
const toIso = (ts: number) => { try { return new Date(ts).toISOString(); } catch { return ""; } };
const timeBucketFor = (ts: number): "today" | "week" | "month" | "older" => {
  const today = startOfToday();
  if (ts >= today) return "today";
  if (ts >= today - 6 * DAY_MS) return "week";   // last 7 days incl. today
  if (ts >= today - 29 * DAY_MS) return "month"; // last 30 days
  return "older";
};

export function ImportsView() {
  const { projects, setView, setActiveProject, setImportOpen } = useWorkspace();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "building" | "draft">("all");
  const initialPrefs = loadPrefs();
  const [sortBy, setSortBy] = useState<SortBy>(initialPrefs.sortBy);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<Project[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Project | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, SourceOverride>>(loadOverrides);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState<SourceOverride>({});
  const [sourceFilter, setSourceFilter] = useState<"all" | SourceKind>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialPrefs.timeFilter);
  const [sortDir, setSortDir] = useState<SortDir>(initialPrefs.sortDir);
  const [tzMode, setTzMode] = useState<TzMode>(loadTzMode);
  const [runtimeLogs, setRuntimeLogs] = useState<Record<string, string[]>>({});
  const [runtimeBusy, setRuntimeBusy] = useState<Record<string, string>>({});
  const [runtimeUrls, setRuntimeUrls] = useState<Record<string, string>>({});

  type RepoIntelligenceSummary = ReturnType<typeof summarizeRepoGraph>;

  const [runtimeIntelligence, setRuntimeIntelligence] =
    useState<Record<string, RepoIntelligenceSummary>>({});

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ sortBy, sortDir, timeFilter }));
    } catch { /* ignore */ }
  }, [sortBy, sortDir, timeFilter]);

  useEffect(() => {
    try { window.localStorage.setItem(TZ_KEY, tzMode); } catch { /* ignore */ }
  }, [tzMode]);

  useEffect(() => {
    try { window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides)); } catch { /* ignore */ }
  }, [overrides]);

  const startEditLinks = (p: Project) => {
    setEditTarget(p);
    setEditForm(overrides[p.id] ?? {});
  };
  const isValidUrl = (u: string) => {
    if (!u) return true;
    try { const url = new URL(u); return url.protocol === "http:" || url.protocol === "https:"; }
    catch { return false; }
  };
  const commitEditLinks = () => {
    if (!editTarget) return;
    const next: SourceOverride = {
      sourceUrl: editForm.sourceUrl?.trim() || undefined,
      previewUrl: editForm.previewUrl?.trim() || undefined,
      readmeUrl: editForm.readmeUrl?.trim() || undefined,
    };
    if (!isValidUrl(next.sourceUrl ?? "") || !isValidUrl(next.previewUrl ?? "") || !isValidUrl(next.readmeUrl ?? "")) {
      toast.error("Invalid URL", { description: "Use http(s):// links." });
      return;
    }
    setOverrides((prev) => {
      const copy = { ...prev };
      if (!next.sourceUrl && !next.previewUrl && !next.readmeUrl) delete copy[editTarget.id];
      else copy[editTarget.id] = next;
      return copy;
    });
    toast.success("Links updated", { description: editTarget.name });
    setEditTarget(null);
  };
  const resetEditLinks = () => {
    if (!editTarget) return;
    setOverrides((prev) => { const copy = { ...prev }; delete copy[editTarget.id]; return copy; });
    toast.success("Links reset", { description: editTarget.name });
    setEditTarget(null);
  };

  const baseImports = useMemo(
    () => [...projects, ...extras]
      .filter((p) => p.type === "import")
      .filter((p) => !removed.has(p.id))
      .map((p) => (renames[p.id] ? { ...p, name: renames[p.id] } : p)),
    [projects, extras, removed, renames]
  );
  const allImports = baseImports;
  const imports = useMemo(() => {
    const filtered = allImports
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      .filter((p) => statusFilter === "all" || p.status === statusFilter)
      .filter((p) => sourceFilter === "all" || sourceFor(p, overrides[p.id]).kind === sourceFilter)
      .filter((p) => timeFilter === "all" || timeBucketFor(p.lastEditedAt) === timeFilter);
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "source") return sourceFor(a, overrides[a.id]).kind.localeCompare(sourceFor(b, overrides[b.id]).kind);
      // recent: lower freshness rank = newer
      // recent: ascending = oldest→newest; desc reverses to newest→oldest (default)
      return a.lastEditedAt - b.lastEditedAt;
    });
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [allImports, q, statusFilter, sourceFilter, timeFilter, sortBy, sortDir, overrides]);

  useEffect(() => {
    if (!selectedId) return;

    const selected =
      imports.find((project) => project.id === selectedId) ??
      allImports.find((project) => project.id === selectedId);

    if (!selected) return;

    const projectId = selected.projectId ?? selected.id;

    if (runtimeIntelligence[projectId]) return;

    let cancelled = false;

    async function loadRuntimeIntelligence() {
      try {
        const files =
          (await listRuntimeFiles(projectId)).filter(
            isRepoIntelligenceReadableFile,
          );

        const fileMap: Record<string, string> = {};

        for (const file of files) {
          if (cancelled) return;

          try {
            const result = await readRuntimeFile(projectId, file);
            fileMap[file] = result.content ?? "";
          } catch {
            // Ignore unreadable files.
          }
        }

        if (cancelled) return;

        const graph = buildRepoKnowledgeGraphFromFiles(projectId, fileMap);

        setRuntimeIntelligence((current) => ({
          ...current,
          [projectId]: summarizeRepoGraph(graph),
        }));
      } catch {
        if (!cancelled) {
          setRuntimeIntelligence((current) => ({
            ...current,
            [projectId]: summarizeRepoGraph(
              buildRepoKnowledgeGraphFromFiles(
                projectId,
                {},
              ),
            ),
          }));
        }
      }
    }

    void loadRuntimeIntelligence();

    return () => {
      cancelled = true;
    };
  }, [selectedId, imports, allImports, runtimeIntelligence]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (sourceFilter !== "all" ? 1 : 0) +
    (timeFilter !== "all" ? 1 : 0);
  const clearFilters = () => { setStatusFilter("all"); setSourceFilter("all"); setTimeFilter("all"); setQ(""); };

  const prefsDirty =
    sortBy !== DEFAULT_PREFS.sortBy ||
    sortDir !== DEFAULT_PREFS.sortDir ||
    timeFilter !== DEFAULT_PREFS.timeFilter;
  const resetPrefs = () => {
    const prev: ViewPrefs = { sortBy, sortDir, timeFilter };
    applyPrefs(DEFAULT_PREFS);
    saveResetSnapshot({ prev, defaults: DEFAULT_PREFS, ts: Date.now(), phase: "reset" });
    showResetToast(prev, DEFAULT_PREFS);
  };

  const applyPrefs = (p: ViewPrefs) => {
    setSortBy(p.sortBy);
    setSortDir(p.sortDir);
    setTimeFilter(p.timeFilter);
  };
  const showResetToast = (prev: ViewPrefs, defaults: ViewPrefs, remainingMs?: number) => {
    const duration = Math.max(2000, Math.min(remainingMs ?? 6000, RESET_WINDOW_MS));
    toast("View preferences reset to defaults", {
      id: "imports-reset-toast",
      duration,
      action: {
        label: "Undo",
        onClick: () => {
          applyPrefs(prev);
          saveResetSnapshot({ prev, defaults, ts: Date.now(), phase: "undone" });
          showUndoneToast(prev, defaults);
        },
      },
      onDismiss: clearResetSnapshot,
      onAutoClose: clearResetSnapshot,
    });
  };
  const showUndoneToast = (prev: ViewPrefs, defaults: ViewPrefs, remainingMs?: number) => {
    const duration = Math.max(2000, Math.min(remainingMs ?? 6000, RESET_WINDOW_MS));
    toast("Restored previous view preferences", {
      id: "imports-reset-toast",
      duration,
      action: {
        label: "Redo reset",
        onClick: () => {
          applyPrefs(defaults);
          clearResetSnapshot();
        },
      },
      onDismiss: clearResetSnapshot,
      onAutoClose: clearResetSnapshot,
    });
  };

  // Restore reset/undo toast across page refresh within the window.
  useEffect(() => {
    const snap = loadResetSnapshot();
    if (snap) {
      const remaining = RESET_WINDOW_MS - (Date.now() - snap.ts);
      if (remaining <= 0) clearResetSnapshot();
      else if (snap.phase === "reset") showResetToast(snap.prev, snap.defaults, remaining);
      else showUndoneToast(snap.prev, snap.defaults, remaining);
    }
    // Cross-tab sync: react to snapshot + prefs changes from other tabs.
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea && e.storageArea !== window.localStorage) return;
      if (e.key === null) {
        // localStorage cleared in another tab.
        toast.dismiss("imports-reset-toast");
        return;
      }
      if (e.key === RESET_SNAPSHOT_KEY) {
        if (!e.newValue) { toast.dismiss("imports-reset-toast"); return; }
        const next = loadResetSnapshot();
        if (!next) { toast.dismiss("imports-reset-toast"); return; }
        const remaining = RESET_WINDOW_MS - (Date.now() - next.ts);
        if (remaining <= 0) { clearResetSnapshot(); toast.dismiss("imports-reset-toast"); return; }
        if (next.phase === "reset") showResetToast(next.prev, next.defaults, remaining);
        else showUndoneToast(next.prev, next.defaults, remaining);
        return;
      }
      if (e.key === PREFS_KEY) {
        // Sync prefs state from the other tab so the UI stays consistent.
        const p = loadPrefs();
        applyPrefs(p);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runtimeDot: Record<NonNullable<typeof projects[number]["runtime"]>, string> = {
    cold: "bg-muted-foreground/40",
    warm: "bg-gold shadow-[0_0_8px_hsl(var(--gold))]",
    live: "bg-cyan shadow-[0_0_8px_hsl(var(--cyan))]",
  };

  const runtimeProjectId = (p: Project) => p.projectId ?? p.id;

  const loadRuntimePreview = async (p: Project) => {
    const id = runtimeProjectId(p);

    try {
      const [status, logs] = await Promise.all([
        getRuntimeStatus(id).catch(() => null),
        getRuntimeLogs(id).catch(() => []),
      ]);

      setRuntimeLogs((prev) => ({
        ...prev,
        [id]: logs.slice(-8).map((line) => String(line)),
      }));

      if (status?.url) {
        setRuntimeUrls((prev) => ({
          ...prev,
          [id]: status.url,
        }));
      }
    } catch {
      setRuntimeLogs((prev) => ({
        ...prev,
        [id]: [],
      }));
    }
  };

  const runRuntimeAction = async (
    p: Project,
    action: "start" | "restart" | "stop" | "open",
  ) => {
    const id = runtimeProjectId(p);

    setRuntimeBusy((prev) => ({
      ...prev,
      [id]: action,
    }));

    try {
      if (action === "stop") {
        await stopRuntime(id);
        toast.success("Runtime stopped", { description: p.name });
        setRuntimeUrls((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } else if (action === "restart") {
        const runtime = await restartRuntime(id);
        if (runtime.url) {
          setRuntimeUrls((prev) => ({ ...prev, [id]: runtime.url }));
        }
        toast.success("Runtime restarted", { description: p.name });
      } else {
        const runtime = await startRuntime(id);
        if (runtime.url) {
          setRuntimeUrls((prev) => ({ ...prev, [id]: runtime.url }));
          if (action === "open") window.open(runtime.url, "_blank", "noopener,noreferrer");
        }
        toast.success(action === "open" ? "Runtime opened" : "Runtime started", {
          description: p.name,
        });
      }

      await loadRuntimePreview(p);
    } catch (error) {
      toast.error("Runtime action failed", {
        description: error instanceof Error ? error.message : p.name,
      });
    } finally {
      setRuntimeBusy((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const openProject = (p: Project) => { setActiveProject(p); setView("workspace"); };
  const selectProject = (p: Project) => setSelectedId((cur) => (cur === p.id ? null : p.id));
  const startRename = (p: Project) => { setRenameTarget(p); setRenameValue(p.name); };
  const commitRename = () => {
    if (!renameTarget) return;
    const v = renameValue.trim();
    if (!v) { toast.error("Name cannot be empty"); return; }
    setRenames((prev) => ({ ...prev, [renameTarget.id]: v }));
    toast.success("Project renamed", { description: v });
    setRenameTarget(null);
  };
  const duplicate = (p: Project) => {
    const now = Date.now();
    const copy: Project = { ...p, id: `${p.id}-copy-${now}`, name: `${p.name} (copy)`, lastEditedAt: now, lastEdited: formatLastEdited(now), status: "draft" };
    setExtras((prev) => [copy, ...prev]);
    toast.success("Duplicated", { description: copy.name });
  };
  const confirmRemove = () => {
    if (!removeTarget) return;
    setRemoved((prev) => new Set(prev).add(removeTarget.id));
    toast.success("Removed from imports", { description: removeTarget.name });
    setRemoveTarget(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14">
        <button
          onClick={() => setView("dashboard")}
          className="inline-flex items-center gap-1.5 text-[12px] text-gold/70 hover:text-gold transition mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </button>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 anim-in">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold/60 mb-2">Workspace</div>
            <h1 className="font-display text-3xl md:text-[44px] font-semibold tracking-[-0.025em] leading-[1.05] text-gold">
              Imported <span className="text-gradient-lumina">projects</span>
            </h1>
            <p className="text-gold/80 mt-2 text-[13px]">
              {allImports.length} imported · from GitHub, ZIP, or a folder
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-background/20 backdrop-blur-md border border-gold/60 w-full md:w-64 focus-within:border-gold/90 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] focus-within:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)] transition-all duration-300">
              <Search className="h-3.5 w-3.5 text-gold/80" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search imports…"
                className="bg-transparent outline-none text-[13px] flex-1 text-gold placeholder:text-gold/50"
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Clear search" className="text-gold/70 hover:text-gold">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as typeof statusFilter)} ariaLabel="Filter by status">
              <option value="all">All status</option>
              <option value="live">Live</option>
              <option value="building">Building</option>
              <option value="draft">Draft</option>
            </FilterSelect>
            <FilterSelect value={sourceFilter} onChange={(v) => setSourceFilter(v as typeof sourceFilter)} ariaLabel="Filter by source">
              <option value="all">All sources</option>
              <option value="github">GitHub</option>
              <option value="zip">ZIP archive</option>
              <option value="folder">Local folder</option>
            </FilterSelect>
            <FilterSelect value={timeFilter} onChange={(v) => setTimeFilter(v as typeof timeFilter)} ariaLabel="Filter by last edited">
              <option value="all">Any time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="older">Older</option>
            </FilterSelect>
            <div className="flex items-stretch h-9 rounded-lg bg-surface-1 border border-border overflow-hidden">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort by"
                className="h-full px-2.5 bg-transparent text-[12px] outline-none hover:bg-surface-2 transition"
              >
                <option value="recent">Sort: Recent</option>
                <option value="name">Sort: Name</option>
                <option value="status">Sort: Status</option>
                <option value="source">Sort: Source</option>
              </select>
              {(() => {
                const isTime = sortBy === "recent";
                const labels = isTime
                  ? { asc: "Oldest first", desc: "Newest first" }
                  : { asc: "A → Z", desc: "Z → A" };
                const Icon = isTime
                  ? (sortDir === "asc" ? ArrowUpNarrowWide : ArrowDownWideNarrow)
                  : (sortDir === "asc" ? ArrowUpAZ : ArrowDownAZ);
                const current = labels[sortDir];
                return (
                  <button
                    onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    aria-label={`Sort direction: ${current}. Click to toggle.`}
                    title={current}
                    className="px-2 border-l border-border text-muted-foreground hover:text-foreground hover:bg-surface-2 transition flex items-center gap-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline text-[11px]">{current}</span>
                  </button>
                );
              })()}
            </div>
            {prefsDirty && (
              <button
                onClick={resetPrefs}
                aria-label="Reset sort, direction, and time filter to defaults"
                title="Reset sort, direction, and time filter to defaults"
                className="h-9 px-2.5 rounded-lg bg-surface-1 border border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-white/15 transition inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="h-9 px-2.5 rounded-lg bg-surface-1 border border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-white/15 transition inline-flex items-center gap-1.5"
              >
                <SlidersHorizontal className="h-3 w-3" />
                Clear ({activeFilterCount})
              </button>
            )}
            <LuminaButton size="md" onClick={() => setImportOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Import new
            </LuminaButton>
          </div>
        </div>

        {allImports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-surface-1/40 p-12 text-center">
            <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-violet to-magenta grid place-items-center mb-4 shadow-[0_4px_16px_-4px_hsl(var(--magenta)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)]">
              <Github className="h-5 w-5 text-white" />
            </div>
            <div className="font-display font-semibold text-[16px] text-gold">No imported projects yet</div>
            <p className="text-[13px] text-gold/70 mt-1.5 max-w-sm mx-auto">
              Bring in code from GitHub, upload a ZIP archive, or pick a local folder.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <LuminaButton size="md" onClick={() => setImportOpen(true)}>
                <Github className="h-3.5 w-3.5" />
                Import a project
              </LuminaButton>
              <LuminaButton variant="ghost" size="md" onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Upload ZIP
              </LuminaButton>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <button
              onClick={() => setImportOpen(true)}
              className="group relative aspect-[4/3] rounded-2xl border border-dashed border-white/10 hover:border-magenta/50 transition-all duration-500 grid place-items-center overflow-hidden bg-surface-1/40"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-violet/15 via-transparent to-magenta/15" />
              </div>
              <div className="relative text-center">
                <div className="h-11 w-11 rounded-xl grid place-items-center mx-auto mb-3 bg-gradient-to-br from-violet to-magenta shadow-[0_4px_16px_-4px_hsl(var(--magenta)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] group-hover:scale-105 transition">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                <div className="font-display font-semibold text-[15px] text-gold">Import another</div>
                <div className="text-[11px] text-gold/70 mt-1">GitHub, ZIP, or folder</div>
              </div>
            </button>

            {imports.map((p, i) => {
              const src = sourceFor(p, overrides[p.id]);
              const SrcIcon = src.icon;
              const isSelected = selectedId === p.id;
              return (
              <HoverCard key={p.id} openDelay={250} closeDelay={80} onOpenChange={(open) => { if (open) void loadRuntimePreview(p); }}>
                <HoverCardTrigger asChild>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => selectProject(p)}
                onDoubleClick={() => openProject(p)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") selectProject(p);
                  if (e.key === " ") { e.preventDefault(); selectProject(p); }
                }}
                className={cn(
                  "group relative aspect-[4/3] text-left rounded-2xl glass overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_hsl(230_80%_2%/0.9),0_0_0_1px_hsl(220_20%_100%/0.1)] anim-in cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet",
                  isSelected && "ring-2 ring-violet/60 shadow-[0_24px_60px_-24px_hsl(var(--violet)/0.5)]"
                )}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={cn("absolute inset-x-0 top-0 h-2/3 overflow-hidden", luminaFrame(i))}>
                  <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl" />
                  <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/40 blur-3xl" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/85 uppercase tracking-[0.12em]">
                    <FolderGit2 className="h-2.5 w-2.5" />
                    Imported
                  </div>
                  <span
                    className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em] backdrop-blur-md",
                      statusStyle[p.status]
                    )}
                  >
                    {p.status}
                  </span>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80">
                    <SrcIcon className="h-2.5 w-2.5" />
                    {src.label}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-display font-semibold text-[14px] tracking-tight truncate flex items-center gap-1.5">
                        {p.name}
                        {p.runtime && (
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", runtimeDot[p.runtime])}
                            title={`Runtime: ${p.runtime}`}
                          />
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Edited{" "}
                        <time
                          dateTime={toIso(p.lastEditedAt)}
                          title={formatExactDateTime(p.lastEditedAt, tzMode)}
                          className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2"
                        >
                          {p.lastEdited}
                        </time>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Actions for ${p.name}`}
                          className="h-8 w-8 grid place-items-center rounded-lg hover:bg-surface-2 transition opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="w-44">
                        <DropdownMenuItem onSelect={() => openProject(p)}>
                          <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => startRename(p)}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => duplicate(p)}>
                          <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setRemoveTarget(p)}
                          className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="start" className="w-[360px] p-0 glass-strong border-border overflow-hidden">
                  {(() => {
                    const rid = runtimeProjectId(p);
                    const logs = runtimeLogs[rid] ?? [];
                    const busy = runtimeBusy[rid];
                    const runtimeUrl = runtimeUrls[rid];

                    return (
                      <>
                        <div className="px-4 py-3 border-b border-border/60">
                          <div className="font-display font-semibold text-[13px] truncate">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Runtime inspector · {rid}
                          </div>
                        </div>

                        <div className="p-3 space-y-2 text-[12px]">
                          <DetailRow icon={Activity} label="Status" value={<span className="capitalize">{p.status}</span>} />
                          <DetailRow icon={Clock} label="Edited" value={
                            <time dateTime={toIso(p.lastEditedAt)} title={formatExactDateTime(p.lastEditedAt, tzMode)}>
                              {p.lastEdited}
                            </time>
                          } />
                          <DetailRow icon={SrcIcon} label="Source" value={src.label} />
                          {p.runtime && <DetailRow icon={GitBranch} label="Runtime" value={<span className="capitalize">{p.runtime}</span>} />}
                        </div>

                        <div className="px-3 pb-3">
                          <div className="grid grid-cols-4 gap-1.5">
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={(e) => { e.stopPropagation(); void runRuntimeAction(p, "start"); }}
                              className="h-7 rounded-md bg-surface-1 border border-border text-[11px] hover:bg-surface-2 disabled:opacity-50"
                            >
                              {busy === "start" ? "..." : "Start"}
                            </button>
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={(e) => { e.stopPropagation(); void runRuntimeAction(p, "restart"); }}
                              className="h-7 rounded-md bg-surface-1 border border-border text-[11px] hover:bg-surface-2 disabled:opacity-50"
                            >
                              {busy === "restart" ? "..." : "Restart"}
                            </button>
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={(e) => { e.stopPropagation(); void runRuntimeAction(p, "stop"); }}
                              className="h-7 rounded-md bg-surface-1 border border-border text-[11px] hover:bg-surface-2 disabled:opacity-50"
                            >
                              {busy === "stop" ? "..." : "Stop"}
                            </button>
                            <button
                              type="button"
                              disabled={!!busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (runtimeUrl) window.open(runtimeUrl, "_blank", "noopener,noreferrer");
                                else void runRuntimeAction(p, "open");
                              }}
                              className="h-7 rounded-md bg-surface-1 border border-border text-[11px] hover:bg-surface-2 disabled:opacity-50"
                            >
                              Open
                            </button>
                          </div>
                        </div>

                        <div className="px-3 pb-3">
                          <div className="text-[10px] uppercase tracking-[0.16em] text-gold/60 mb-1.5">
                            Latest logs
                          </div>
                          <div className="max-h-32 overflow-auto rounded-lg bg-black/35 border border-white/10 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                            {logs.length > 0 ? (
                              logs.map((line, index) => (
                                <div key={`${rid}-log-${index}`} className="whitespace-pre-wrap break-words">
                                  {line}
                                </div>
                              ))
                            ) : (
                              <div>No runtime logs yet. Start the project to generate logs.</div>
                            )}
                          </div>
                        </div>

                        <div className="px-3 pb-3 pt-1 text-[11px] text-muted-foreground">
                          Click to pin details · Double-click to open project
                        </div>
                      </>
                    );
                  })()}
                </HoverCardContent>
              </HoverCard>
              );
            })}
          </div>
        )}

        {selectedId && (() => {
          const p = imports.find((x) => x.id === selectedId) ?? allImports.find((x) => x.id === selectedId);
          if (!p) return null;
          const src = sourceFor(p, overrides[p.id]);
          const SrcIcon = src.icon;

          const intelligenceProjectId = p.projectId ?? p.id;

          const intelligence =
            runtimeIntelligence[intelligenceProjectId] ??
            summarizeRepoGraph(
              buildRepoKnowledgeGraphFromFiles(
                intelligenceProjectId,
                {},
              ),
            );
          return (
            <aside
              className="fixed right-4 bottom-4 top-20 w-[340px] z-40 rounded-2xl glass-strong border border-border shadow-[0_30px_80px_-20px_hsl(230_80%_2%/0.9)] flex flex-col overflow-hidden anim-in"
              role="complementary"
              aria-label={`Details for ${p.name}`}
            >
              <div className={cn("relative h-28 overflow-hidden", luminaFrame(0))}>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Close details"
                  className="absolute top-2.5 right-2.5 h-7 w-7 grid place-items-center rounded-md bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition"
                >
                  <X className="h-3.5 w-3.5 text-white/80" />
                </button>
                <span
                  className={cn(
                    "absolute bottom-3 left-3 px-2 py-0.5 rounded-md border text-[10px] uppercase tracking-[0.12em] backdrop-blur-md",
                    statusStyle[p.status]
                  )}
                >
                  {p.status}
                </span>
              </div>
              <div className="px-5 py-4 border-b border-border/60">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold/60">Project</div>
                <div className="font-display font-semibold text-[18px] tracking-tight mt-1 truncate flex items-center gap-2">
                  {p.name}
                  {p.runtime && <span className={cn("h-1.5 w-1.5 rounded-full", runtimeDot[p.runtime])} />}
                </div>
              </div>
              <div className="p-5 space-y-3 text-[13px] flex-1 overflow-y-auto">
                <DetailRow icon={Activity} label="Status" value={<span className="capitalize">{p.status}</span>} />
                <DetailRow icon={Clock} label="Last edited" value={
                  <div className="text-right">
                    <time
                      dateTime={toIso(p.lastEditedAt)}
                      title={formatExactDateTime(p.lastEditedAt, tzMode === "local" ? "utc" : "local")}
                    >
                      <div>{p.lastEdited}</div>
                      <div className="text-[11px] text-muted-foreground" aria-live="polite">
                        {formatExactDateTime(p.lastEditedAt, tzMode)}
                      </div>
                    </time>
                    <div
                      role="group"
                      aria-label="Display timestamp timezone"
                      className="mt-1 inline-flex items-center rounded-md border border-border bg-surface-1 overflow-hidden text-[10px] focus-within:ring-2 focus-within:ring-violet focus-within:ring-offset-1 focus-within:ring-offset-background"
                    >
                      <TzToggleButton
                        active={tzMode === "local"}
                        onClick={() => setTzMode("local")}
                        label="Local"
                        ariaLabel={`Show timestamps in local time (${localTzLabel()})`}
                      />
                      <TzToggleButton
                        active={tzMode === "utc"}
                        onClick={() => setTzMode("utc")}
                        label="UTC"
                        ariaLabel="Show timestamps in Coordinated Universal Time"
                        bordered
                      />
                    </div>
                    <span className="sr-only" aria-live="polite">
                      Showing {tzMode === "utc" ? "UTC" : `local time (${localTzLabel()})`}.
                    </span>
                  </div>
                } />
                <DetailRow icon={SrcIcon} label="Source" value={
                  <div className="text-right">
                    <div>{src.label}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{src.detail}</div>
                  </div>
                } />
                {p.runtime && <DetailRow icon={GitBranch} label="Runtime" value={<span className="capitalize">{p.runtime}</span>} />}

                <div className="pt-3 mt-3 border-t border-border/60">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gold/60 mb-3">
                    Architecture
                  </div>

                  <DetailRow
                    icon={Activity}
                    label="Framework"
                    value={intelligence.framework}
                  />

                  <DetailRow
                    icon={FolderOpen}
                    label="Files"
                    value={String(
                      intelligence.summary.fileCount,
                    )}
                  />

                  <DetailRow
                    icon={BookOpen}
                    label="Routes"
                    value={String(
                      intelligence.summary.routeCount,
                    )}
                  />

                  <DetailRow
                    icon={GitBranch}
                    label="Dependencies"
                    value={String(
                      intelligence.summary.dependencyCount,
                    )}
                  />

                  <DetailRow
                    icon={Globe}
                    label="Domains"
                    value={String(
                      intelligence.summary.domainCount ?? 0,
                    )}
                  />
                </div>

                <div className="pt-3 mt-3 border-t border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-gold/60">Quick links</div>
                    <button
                      onClick={() => startEditLinks(p)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition"
                    >
                      <Pencil className="h-3 w-3" />
                      {src.isOverridden ? "Edit" : "Set links"}
                    </button>
                  </div>
                  {src.isOverridden && (
                    <div className="mb-2 text-[11px] text-cyan/90 inline-flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> Custom URLs
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-1.5">
                    <QuickLink
                      icon={SrcIcon}
                      label={src.kind === "github" ? "View on GitHub" : src.kind === "zip" ? "Download archive" : "Reveal in folder"}
                      hint={src.detail}
                      onClick={() => openExternal(src.sourceUrl, src.detail)}
                      onCopy={() => copyLink(src.sourceUrl)}
                    />
                    <QuickLink
                      icon={Globe}
                      label="Open live preview"
                      hint={src.previewUrl.replace(/^https?:\/\//, "")}
                      disabled={p.status === "draft"}
                      onClick={() => openExternal(src.previewUrl, "Live preview")}
                      onCopy={() => copyLink(src.previewUrl)}
                    />
                    <QuickLink
                      icon={BookOpen}
                      label="View README"
                      hint="README.md"
                      onClick={() => openExternal(src.readmeUrl, "README")}
                      onCopy={() => copyLink(src.readmeUrl)}
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border/60 flex items-center gap-2">
                <LuminaButton size="md" className="flex-1" onClick={() => openProject(p)}>
                  <ExternalLink className="h-3.5 w-3.5" /> Open project
                </LuminaButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label="More actions"
                      className="h-9 w-9 grid place-items-center rounded-lg bg-surface-1 border border-border hover:bg-surface-2 transition"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={() => startEditLinks(p)}>
                      <Link2 className="h-3.5 w-3.5 mr-2" /> Edit links
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => startRename(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => duplicate(p)}>
                      <Copy className="h-3.5 w-3.5 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => setRemoveTarget(p)}
                      className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </aside>
          );
        })()}
      </div>

      <Dialog open={!!renameTarget} onOpenChange={(o) => { if (!o) setRenameTarget(null); }}>
        <DialogContent className="glass-strong border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Rename project</DialogTitle>
          </DialogHeader>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); }}
            className="w-full h-10 px-3 rounded-lg bg-surface-1 border border-border text-[13px] outline-none focus:border-violet/50 transition"
          />
          <DialogFooter>
            <LuminaButton variant="ghost" size="md" onClick={() => setRenameTarget(null)}>Cancel</LuminaButton>
            <LuminaButton size="md" onClick={commitRename}>Save</LuminaButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="glass-strong border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit project links</DialogTitle>
          </DialogHeader>
          {editTarget && (() => {
            const guess = sourceFor(editTarget);
            const effective = {
              source: (editForm.sourceUrl?.trim()  || guess.sourceUrl),
              preview: (editForm.previewUrl?.trim() || guess.previewUrl),
              readme: (editForm.readmeUrl?.trim()  || guess.readmeUrl),
            };
            const copyAll = async () => {
              const text = [
                `GitHub:  ${effective.source}`,
                `Preview: ${effective.preview}`,
                `README:  ${effective.readme}`,
              ].join("\n");
              try {
                await navigator.clipboard.writeText(text);
                toast.success("All links copied", { description: "GitHub, preview, and README" });
              } catch {
                toast.error("Couldn't copy links");
              }
            };
            return (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[12px] text-muted-foreground flex-1">
                    Override the auto-detected URLs for <span className="text-foreground">{editTarget.name}</span>. Leave a field blank to use the slug-based guess.
                  </p>
                  <button
                    type="button"
                    onClick={copyAll}
                    className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-surface-1 border border-border text-[12px] text-muted-foreground hover:text-foreground hover:border-white/15 hover:bg-surface-2 transition"
                  >
                    <Copy className="h-3 w-3" /> Copy all
                  </button>
                </div>
                <LinkField
                  label="GitHub repository"
                  placeholder={guess.sourceUrl}
                  value={editForm.sourceUrl ?? ""}
                  onChange={(v) => setEditForm((f) => ({ ...f, sourceUrl: v }))}
                />
                <LinkField
                  label="Live preview"
                  placeholder={guess.previewUrl}
                  value={editForm.previewUrl ?? ""}
                  onChange={(v) => setEditForm((f) => ({ ...f, previewUrl: v }))}
                />
                <LinkField
                  label="README"
                  placeholder={guess.readmeUrl}
                  value={editForm.readmeUrl ?? ""}
                  onChange={(v) => setEditForm((f) => ({ ...f, readmeUrl: v }))}
                />
              </div>
            );
          })()}
          <DialogFooter className="flex-row sm:justify-between sm:flex-row gap-2">
            <LuminaButton variant="ghost" size="md" onClick={resetEditLinks} disabled={!editTarget || !overrides[editTarget.id]}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </LuminaButton>
            <div className="flex items-center gap-2">
              <LuminaButton variant="ghost" size="md" onClick={() => setEditTarget(null)}>Cancel</LuminaButton>
              <LuminaButton size="md" onClick={commitEditLinks}>Save</LuminaButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}>
        <AlertDialogContent className="glass-strong border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove import?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} will be removed from your imports. The original source isn't affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[12px]">{label}</span>
      </div>
      <div className="text-foreground text-[12px] text-right">{value}</div>
    </div>
  );
}

function QuickLink({
  icon: Icon, label, hint, onClick, onCopy, disabled,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  onClick: () => void;
  onCopy?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "group/link flex items-center gap-2 pl-3 pr-1.5 h-9 rounded-lg bg-surface-1 border border-border transition",
        disabled ? "opacity-50" : "hover:border-white/15 hover:bg-surface-2"
      )}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-2 flex-1 min-w-0 text-left text-[12px] disabled:cursor-not-allowed"
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="truncate">{label}</span>
        {hint && (
          <span className="hidden sm:inline truncate text-[11px] text-muted-foreground/70">
            · {hint}
          </span>
        )}
      </button>
      {onCopy && !disabled && (
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(); }}
          aria-label="Copy link"
          className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground opacity-0 group-hover/link:opacity-100 hover:text-foreground hover:bg-surface-3 transition"
        >
          <Link2 className="h-3 w-3" />
        </button>
      )}
      <ExternalLink className="h-3 w-3 text-muted-foreground mr-1.5" />
    </div>
  );
}

function LinkField({
  label, placeholder, value, onChange,
}: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  const effective = value.trim() || placeholder;
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-widest text-gold/70 mb-1">{label}</div>
      <div className="flex items-stretch gap-1.5">
        <input
          type="url"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-surface-1 border border-border text-[12px] outline-none focus:border-violet/50 transition placeholder:text-muted-foreground/50"
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); copyLink(effective); }}
          aria-label={`Copy ${label} URL`}
          title={`Copy ${effective}`}
          className="h-9 w-9 grid place-items-center rounded-lg bg-surface-1 border border-border text-muted-foreground hover:text-foreground hover:border-white/15 hover:bg-surface-2 transition shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
    </label>
  );
}

function FilterSelect({
  value, onChange, ariaLabel, children,
}: { value: string; onChange: (v: string) => void; ariaLabel: string; children: React.ReactNode }) {
  const isActive = !value.startsWith("all") && value !== "all";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={cn(
        "h-9 px-2.5 rounded-lg border text-[12px] outline-none transition",
        isActive
          ? "bg-violet/10 border-violet/40 text-foreground"
          : "bg-background/20 backdrop-blur-md border-gold/60 text-gold hover:border-gold/90 hover:bg-gold/15 shadow-[0_0_12px_-2px_hsl(var(--gold)/0.35)] hover:shadow-[0_0_22px_-2px_hsl(var(--gold)/0.65)]"
      )}
    >
      {children}
    </select>
  );
}

function TzToggleButton({
  active, onClick, label, ariaLabel, bordered,
}: { active: boolean; onClick: () => void; label: string; ariaLabel: string; bordered?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "px-2 h-6 min-w-[2.5rem] transition outline-none text-[11px]",
        "focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:z-10",
        bordered && "border-l border-border",
        active
          ? "bg-foreground text-background font-semibold"
          : "text-foreground/80 hover:text-foreground hover:bg-surface-2 focus-visible:bg-surface-2"
      )}
    >
      {label}
    </button>
  );
}
