import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Notification } from "@/lib/mockData";
import { notificationService } from "@/services/notificationService";
import { projectRepository } from "@/services/projectRepository";
import { auth, usage as usageProvider } from "@/providers/registry";

export type SkillMode = "ai" | "designer" | "developer";
export type BuildIntent = "website" | "webapp" | "dashboard" | "ai-tool" | "import" | "mobile";
export type View = "landing" | "entry" | "dashboard" | "workspace" | "auth" | "settings" | "pricing" | "templates" | "imports" | "repo-audit" | "inhouse-dev" | "admin";

export type ImportPrefill =
  | { tab: "zip"; files: File[] }
  | { tab: "github"; url: string };

export interface Project {
  id: string;
  name: string;
  type: BuildIntent;
  lastEdited: string;
  /** Epoch ms — accurate timestamp for filtering/sorting. `lastEdited` is the display string. */
  lastEditedAt: number;
  status: "draft" | "live" | "building";
  accent: "magenta" | "violet" | "cyan" | "gold";
  runtime?: "cold" | "warm" | "live";
}

interface WorkspaceState {
  view: View;
  setView: (v: View) => void;
  mode: SkillMode;
  setMode: (m: SkillMode) => void;
  intent: BuildIntent | null;
  setIntent: (i: BuildIntent | null) => void;
  activeProject: Project | null;
  setActiveProject: (p: Project | null) => void;
  projects: Project[];
  rightPanelOpen: boolean;
  setRightPanelOpen: (b: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
  bottomDockOpen: boolean;
  setBottomDockOpen: (b: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (b: boolean) => void;
  publishOpen: boolean;
  setPublishOpen: (b: boolean) => void;
  importOpen: boolean;
  setImportOpen: (b: boolean, prefill?: ImportPrefill | null) => void;
  importPrefill: ImportPrefill | null;
  setImportPrefill: (p: ImportPrefill | null) => void;
  deployOpen: boolean;
  setDeployOpen: (b: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (b: boolean) => void;
  notifications: Notification[];
  markAllNotificationsRead: () => void;
  recentProjectIds: string[];
  usage: { plan: "free" | "pro" | "team"; aiExecutions: number; aiLimit: number; projects: number; deployments: number; transformations: number; audits: number; revenue: number };
}

const Ctx = createContext<WorkspaceState | null>(null);

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const ago = (ms: number) => Date.now() - ms;
export const formatLastEdited = (ts: number): string => {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  if (diff < 14 * DAY) return "Last week";
  if (diff < 30 * DAY) return `${Math.floor(diff / (7 * DAY))} weeks ago`;
  if (diff < 365 * DAY) return `${Math.floor(diff / (30 * DAY))} months ago`;
  return `${Math.floor(diff / (365 * DAY))} years ago`;
};
const mk = (
  id: string, name: string, type: BuildIntent, ts: number,
  status: Project["status"], accent: Project["accent"], runtime?: Project["runtime"]
): Project => ({ id, name, type, lastEditedAt: ts, lastEdited: formatLastEdited(ts), status, accent, runtime });

const seedProjects: Project[] = [
  mk("1", "Aurora Studio",      "website",   ago(2 * HOUR),       "live",     "magenta", "live"),
  mk("2", "Pulse Analytics",    "dashboard", ago(28 * HOUR),      "building", "cyan",    "warm"),
  mk("3", "Helix CRM",          "webapp",    ago(3 * DAY),        "draft",    "violet",  "cold"),
  mk("4", "Lumen AI Companion", "ai-tool",   ago(8 * DAY),        "live",     "gold",    "live"),
  mk("5", "Nova Landing",       "website",   ago(20_000),         "draft",    "violet",  "cold"),
  mk("6", "Atlas Ops",          "dashboard", ago(5 * DAY),        "live",     "cyan",    "warm"),
  mk("7", "Legacy Dashboard",   "import",    ago(9 * DAY),        "draft",    "violet",  "cold"),
  mk("8", "Acme Marketing",     "import",    ago(2 * DAY),        "live",     "magenta", "live"),
];

const VIEW_KEY = "korelumina:view";

function readInitialView(): View {
  if (typeof window === "undefined") return "landing";
  try {
    const v = window.localStorage.getItem(VIEW_KEY) as View | null;
    if (v && ["landing","entry","dashboard","workspace","auth","settings","pricing","templates","imports","repo-audit","inhouse-dev","admin"].includes(v)) return v;
  } catch {}
  return "landing";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  // "/" defaults to the marketing landing page; persisted across reloads.
  const [view, _setView] = useState<View>(readInitialView);
  const setView = (v: View) => {
    _setView(v);
    try { window.localStorage.setItem(VIEW_KEY, v); } catch {}
  };
  const [mode, setMode] = useState<SkillMode>("ai");
  const [intent, setIntent] = useState<BuildIntent | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomDockOpen, setBottomDockOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importPrefill, setImportPrefill] = useState<ImportPrefill | null>(null);
  const setImportOpenWith = (b: boolean, prefill?: ImportPrefill | null) => {
    if (prefill !== undefined) setImportPrefill(prefill);
    setImportOpen(b);
  };
  const [deployOpen, setDeployOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(() => notificationService.list());
  useEffect(() => notificationService.onChange(() => setNotifications(notificationService.list())), []);
  const markAllNotificationsRead = () => { notificationService.markAllRead(); setNotifications(notificationService.list()); };

  // Live projects: seed once from the static demo set, then read from repo.
  const [storedProjects, setStoredProjects] = useState(() => {
    const existing = projectRepository.list();
    if (existing.length === 0) seedProjects.forEach((p) => projectRepository.create({ ...p }, undefined));
    return projectRepository.list();
  });
  useEffect(() => projectRepository.onChange(() => setStoredProjects(projectRepository.list())), []);
  const recentProjectIds = useMemo(() => storedProjects.slice(0, 3).map((p) => p.id), [storedProjects]);

  // Live usage snapshot driven by the active session.
  const snapToUsage = (s: ReturnType<typeof usageProvider.snapshot> | null) => {
    const plan = ((s?.plan as "free" | "pro") ?? "free") as "free" | "pro" | "team";
    const revenue = plan === "pro" ? 29 : plan === "team" ? 99 : 0;
    return {
      plan,
      aiExecutions: s?.aiExecutions ?? 0,
      aiLimit: Number.isFinite(s?.aiLimit ?? 0) ? (s?.aiLimit ?? 5) : 9999,
      projects: s?.projects ?? 0,
      deployments: s?.deployments ?? 0,
      transformations: s?.transformations ?? 0,
      audits: s?.audits ?? 0,
      revenue,
    };
  };
  const [usageSnap, setUsageSnap] = useState(() => {
    const u = auth.getUser();
    return snapToUsage(u ? usageProvider.snapshot(u.id) : null);
  });
  useEffect(() => {
    const recompute = () => {
      const u = auth.getUser();
      setUsageSnap(snapToUsage(u ? usageProvider.snapshot(u.id) : null));
    };
    const offU = usageProvider.onChange(recompute);
    const offA = auth.onChange(recompute);
    return () => { offU(); offA(); };
  }, []);

  const value = useMemo<WorkspaceState>(
    () => ({
      view, setView, mode, setMode, intent, setIntent,
      activeProject, setActiveProject,
      projects: storedProjects,
      rightPanelOpen, setRightPanelOpen,
      sidebarOpen, setSidebarOpen,
      bottomDockOpen, setBottomDockOpen,
      commandOpen, setCommandOpen,
      publishOpen, setPublishOpen,
      importOpen, setImportOpen: setImportOpenWith,
      importPrefill, setImportPrefill,
      deployOpen, setDeployOpen,
      notificationsOpen, setNotificationsOpen,
      notifications, markAllNotificationsRead,
      recentProjectIds,
      usage: usageSnap,
    }),
    [view, mode, intent, activeProject, storedProjects, rightPanelOpen, sidebarOpen, bottomDockOpen, commandOpen, publishOpen, importOpen, importPrefill, deployOpen, notificationsOpen, notifications, usageSnap, recentProjectIds]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
