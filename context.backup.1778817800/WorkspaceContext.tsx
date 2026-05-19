import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockNotifications, mockUsage, type Notification } from "@/lib/mockData";
import { fetchProjects } from "@/services/api";

export type SkillMode = "ai" | "designer" | "developer";
export type BuildIntent =
  | "website"
  | "webapp"
  | "dashboard"
  | "ai-tool"
  | "import"
  | "mobile";

export type View =
  | "landing"
  | "entry"
  | "dashboard"
  | "workspace"
  | "auth"
  | "settings"
  | "pricing"
  | "templates"
  | "imports";

export type ImportPrefill =
  | { tab: "zip"; files: File[] }
  | { tab: "github"; url: string };

export interface Project {
  id: string;
  projectId?: string;
  name: string;
  type: BuildIntent;
  lastEdited: string;
  lastEditedAt?: number;
  status: "draft" | "live" | "building";
  accent: "magenta" | "violet" | "cyan" | "gold";
  runtime?: "cold" | "warm" | "live";
  framework?: string;
  builderUrl?: string;
  previewUrl?: string | null;
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
  loadingProjects: boolean;
  refreshProjects: () => Promise<void>;
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
  usage: {
    plan: "free" | "pro" | "team";
    aiExecutions: number;
    aiLimit: number;
  };
}

const Ctx = createContext<WorkspaceState | null>(null);

export const formatLastEdited = (ts?: number): string => {
  if (!ts) return "Recently";

  const diff = Date.now() - ts;
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  if (diff < MIN) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  if (diff < 14 * DAY) return "Last week";
  return "Recently";
};

const seedProjects: Project[] = [
  {
    id: "1",
    name: "Aurora Studio",
    type: "website",
    lastEdited: "2h ago",
    status: "live",
    accent: "magenta",
    runtime: "live",
  },
  {
    id: "2",
    name: "Pulse Analytics",
    type: "dashboard",
    lastEdited: "Yesterday",
    status: "building",
    accent: "cyan",
    runtime: "warm",
  },
  {
    id: "3",
    name: "Helix CRM",
    type: "webapp",
    lastEdited: "3 days ago",
    status: "draft",
    accent: "violet",
    runtime: "cold",
  },
  {
    id: "4",
    name: "Lumen AI Companion",
    type: "ai-tool",
    lastEdited: "Last week",
    status: "live",
    accent: "gold",
    runtime: "live",
  },
  {
    id: "5",
    name: "Nova Landing",
    type: "website",
    lastEdited: "Just now",
    status: "draft",
    accent: "violet",
    runtime: "cold",
  },
  {
    id: "6",
    name: "Atlas Ops",
    type: "dashboard",
    lastEdited: "5 days ago",
    status: "live",
    accent: "cyan",
    runtime: "warm",
  },
  {
    id: "7",
    name: "Legacy Dashboard",
    type: "import",
    lastEdited: "Last week",
    status: "draft",
    accent: "violet",
    runtime: "cold",
  },
  {
    id: "8",
    name: "Acme Marketing",
    type: "import",
    lastEdited: "2 days ago",
    status: "live",
    accent: "magenta",
    runtime: "live",
  },
];

const VIEW_KEY = "korelumina:view";

function readInitialView(): View {
  if (typeof window === "undefined") return "landing";

  try {
    const stored = window.localStorage.getItem(VIEW_KEY) as View | null;
    if (stored) return stored;
  } catch {}

  return "landing";
}

function mapProject(apiProject: any): Project {
  const id = apiProject.projectId || apiProject.id;
  const timestamp = Date.now();

  return {
    id,
    projectId: id,
    name: apiProject.name || id,
    type: "import",
    lastEdited: formatLastEdited(timestamp),
    lastEditedAt: timestamp,
    status:
      apiProject.status === "running"
        ? "live"
        : apiProject.status === "building"
          ? "building"
          : "draft",
    accent: "violet",
    runtime:
      apiProject.status === "running"
        ? "live"
        : apiProject.status === "building"
          ? "warm"
          : "cold",
    framework: apiProject.framework,
    builderUrl: apiProject.builderUrl,
    previewUrl: apiProject.previewUrl,
  };
}

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [view, setViewState] = useState<View>(readInitialView);
  const [mode, setMode] = useState<SkillMode>("ai");
  const [intent, setIntent] = useState<BuildIntent | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomDockOpen, setBottomDockOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [importOpen, setImportOpenState] = useState(false);
  const [importPrefill, setImportPrefill] =
    useState<ImportPrefill | null>(null);
  const [deployOpen, setDeployOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);

  const setView = (v: View) => {
    setViewState(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const setImportOpen = (
    open: boolean,
    prefill?: ImportPrefill | null,
  ) => {
    if (prefill !== undefined) {
      setImportPrefill(prefill);
    }
    setImportOpenState(open);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        unread: false,
      })),
    );
  };

  const refreshProjects = async () => {
    try {
      setLoadingProjects(true);

      const apiProjects = await fetchProjects();
      const mapped = apiProjects.map(mapProject);

      const merged = [...seedProjects, ...mapped];
      const deduped = Array.from(
        new Map(merged.map((project) => [project.id, project])).values(),
      );

      setProjects(deduped);

      setActiveProject((current) => {
        if (!current) return null;
        return deduped.find((p) => p.id === current.id) || null;
      });
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects(seedProjects);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    void refreshProjects();
  }, []);

  const recentProjectIds = projects.slice(0, 3).map((p) => p.id);

  const value = useMemo<WorkspaceState>(
    () => ({
      view,
      setView,
      mode,
      setMode,
      intent,
      setIntent,
      activeProject,
      setActiveProject,
      projects,
      loadingProjects,
      refreshProjects,
      rightPanelOpen,
      setRightPanelOpen,
      sidebarOpen,
      setSidebarOpen,
      bottomDockOpen,
      setBottomDockOpen,
      commandOpen,
      setCommandOpen,
      publishOpen,
      setPublishOpen,
      importOpen,
      setImportOpen,
      importPrefill,
      setImportPrefill,
      deployOpen,
      setDeployOpen,
      notificationsOpen,
      setNotificationsOpen,
      notifications,
      markAllNotificationsRead,
      recentProjectIds,
      usage: mockUsage,
    }),
    [
      view,
      mode,
      intent,
      activeProject,
      projects,
      loadingProjects,
      rightPanelOpen,
      sidebarOpen,
      bottomDockOpen,
      commandOpen,
      publishOpen,
      importOpen,
      importPrefill,
      deployOpen,
      notificationsOpen,
      notifications,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useWorkspace must be used inside WorkspaceProvider",
    );
  }

  return ctx;
}
