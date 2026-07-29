import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  canAccess,
} from "@/services/workspaceAccessService";

import {
  getProjectScope,
} from "@/services/projectScope";

import {
  listRuntimeProjects,
  type RuntimeProject,
} from "@/services/runtimeService";

import type {
  Project,
} from "@/types/api";

export type BuildIntent =
  | "website"
  | "webapp"
  | "dashboard"
  | "ai-tool"
  | "import"
  | "mobile";

export type View =
  "landing" | "entry" | "dashboard" | "auth" | "settings" | "pricing" | "templates" | "imports" | "workspace" | "repo-audit" | "inhouse-dev" | "deployment-diagnostics" | "knowledge-operations" | "admin" | "runtime-operations";

export interface UsageSnapshot {
  aiExecutions: number;
  aiLimit: number;
  deployments: number;
  transformations: number;
  audits: number;
  revenue: number;
  transforms: number;
  storageUsed: number;
  projects: number;
}

const ACTIVE_PROJECT_STORAGE_KEY =
  "lumina.active-project-id";

const DEFAULT_USAGE: UsageSnapshot = {
  aiExecutions: 0,
  aiLimit: 100,
  deployments: 0,
  transformations: 0,
  audits: 0,
  revenue: 0,
  transforms: 0,
  storageUsed: 0,
  projects: 0,
};

function titleFromProjectId(projectId: string) {
  return projectId
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function runtimeProjectToProject(
  project: RuntimeProject,
): Project {
  return {
    id: project.projectId,
    projectId: project.projectId,

    name:
      project.repoName
        ? project.repoName
        : titleFromProjectId(project.projectId),

    type: "import",
    status: "draft",
    accent: "violet",
    runtime: "warm",

    framework: project.framework,

    sourceUrl: project.sourceUrl,

    lastEdited: "Runtime project",
    lastEditedAt: Date.now(),

    previewUrl: undefined,
  } as Project;
}



interface WorkspaceContextValue {
  view: View;
  setView: (
    view: View,
  ) => void;

  mode: string;
  setMode: (
    mode: string,
  ) => void;

  intent: string;
  setIntent: (
    value: string,
  ) => void;

  activeProject: Project | null;
  setActiveProject: (
    project: Project | null,
  ) => void;

  projects: Project[];

  rightPanelOpen: boolean;
  setRightPanelOpen: (
    value: boolean,
  ) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (
    value: boolean,
  ) => void;

  bottomDockOpen: boolean;
  setBottomDockOpen: (
    value: boolean,
  ) => void;

  commandOpen: boolean;
  setCommandOpen: (
    value: boolean,
  ) => void;

  publishOpen: boolean;
  setPublishOpen: (
    value: boolean,
  ) => void;

  importOpen: boolean;
  setImportOpen: (
    value: boolean,
  ) => void;

  appearancePanelOpen: boolean;

  setAppearancePanelOpen: (
    value: boolean,
  ) => void;

  toggleAppearancePanel: () => void;

  importPrefill?: string;
  setImportPrefill: (
    value?: string,
  ) => void;

  deployOpen: boolean;
  setDeployOpen: (
    value: boolean,
  ) => void;

  notificationsOpen: boolean;
  setNotificationsOpen: (
    value: boolean,
  ) => void;

  notifications: unknown[];
  setNotifications: (
    value: unknown[],
  ) => void;

  usage: UsageSnapshot;
  usageSnap: UsageSnapshot;
  setUsageSnap: Dispatch<
    SetStateAction<UsageSnapshot>
  >;

  recentProjectIds: string[];
}

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null,
  );

function resolveProjectFromList(
  projects: Project[],
  current: Project | null,
) {
  if (
    projects.length === 0
  ) {
    return null;
  }

  if (current) {
    const refreshed =
      projects.find(
        (project) =>
          project.id === current.id,
      );

    if (refreshed) {
      return refreshed;
    }
  }

  const savedId =
    localStorage.getItem(
      ACTIVE_PROJECT_STORAGE_KEY,
    );

  return (
    projects.find(
      (project) =>
        project.id === savedId,
    ) ?? projects[0]
  );
}

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [view, setView] =
    useState<View>("dashboard");

  const [mode, setMode] =
    useState("dev");

  const [intent, setIntent] =
    useState("");

  const [
    usageSnap,
    setUsageSnap,
  ] = useState<UsageSnapshot>(
    DEFAULT_USAGE,
  );

  const [
    rightPanelOpen,
    setRightPanelOpen,
  ] = useState(true);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(true);

  const [
    bottomDockOpen,
    setBottomDockOpen,
  ] = useState(false);

  const [
    commandOpen,
    setCommandOpen,
  ] = useState(false);

  const [
    publishOpen,
    setPublishOpen,
  ] = useState(false);

  const [
    importOpen,
    setImportOpen,
  ] = useState(false);

  const [
    appearancePanelOpen,
    setAppearancePanelOpen,
  ] = useState(false);

  const toggleAppearancePanel =
    () =>
      setAppearancePanelOpen(
        current => !current,
      );

  const [
    importPrefill,
    setImportPrefill,
  ] = useState<
    string | undefined
  >();

  const [
    deployOpen,
    setDeployOpen,
  ] = useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<
    unknown[]
  >([]);

  const [
    storedProjects,
    setStoredProjects,
  ] = useState<Project[]>([]);

  const [
    activeProject,
    setActiveProjectState,
  ] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refreshRuntimeProjects() {
      try {
        const runtimeProjects = await listRuntimeProjects();

        

        if (cancelled) {
          return;
        }

        const nextProjects =
          runtimeProjects.map(
            runtimeProjectToProject,
          );

        setStoredProjects(nextProjects);

        setActiveProjectState((current) =>
          resolveProjectFromList(nextProjects, current),
        );
      } catch (error) {
        console.warn(
          "[WorkspaceContext] failed to refresh runtime projects",
          error,
        );

        // Keep the last successful workspace state.
        // Runtime outages should not wipe the user's project list.
        if (cancelled) {
          return;
        }
      }
    }

    void refreshRuntimeProjects();

    const interval = window.setInterval(refreshRuntimeProjects, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const setActiveProject = (
    project: Project | null,
  ) => {
    setActiveProjectState(
      project,
    );

    if (!project) {
      localStorage.removeItem(
        ACTIVE_PROJECT_STORAGE_KEY,
      );

      return;
    }

    localStorage.setItem(
      ACTIVE_PROJECT_STORAGE_KEY,
      project.id,
    );
  };

  const recentProjectIds =
    useMemo(
      () =>
        storedProjects
          .slice(0, 3)
          .map(
            (project) =>
              project.id,
          ),
      [storedProjects],
    );

  const usage =
    useMemo(
      () => ({
        ...DEFAULT_USAGE,
        ...usageSnap,
      }),
      [usageSnap],
    );

  const value =
    useMemo(
      () => ({
        view,
        setView,

        mode,
        setMode,

        intent,
        setIntent,

        activeProject,
        setActiveProject,

        projects:
          storedProjects,

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

        appearancePanelOpen,
        setAppearancePanelOpen,
        toggleAppearancePanel,

        importPrefill,
        setImportPrefill,

        deployOpen,
        setDeployOpen,

        notificationsOpen,
        setNotificationsOpen,

        notifications,
        setNotifications,

        usage,
        usageSnap,
        setUsageSnap,

        recentProjectIds,
      }),
      [
        view,
        mode,
        intent,
        activeProject,
        storedProjects,
        rightPanelOpen,
        sidebarOpen,
        bottomDockOpen,
        commandOpen,
        publishOpen,
        importOpen,
        appearancePanelOpen,
        toggleAppearancePanel,
        importPrefill,
        deployOpen,
        notificationsOpen,
        notifications,
        usage,
        recentProjectIds,
      ],
    );

  return (
    <WorkspaceContext.Provider
      value={value}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context =
    useContext(
      WorkspaceContext,
    );

  if (!context) {
    throw new Error(
      "useWorkspace must be used within WorkspaceProvider",
    );
  }

  return context;
}
