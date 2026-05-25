import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type SkillMode = "ai" | "designer" | "developer";
export type BuildIntent = "website" | "webapp" | "dashboard" | "ai-tool" | "import";
export type View = "entry" | "dashboard" | "workspace";

export interface Project {
  id: string;
  name: string;
  type: BuildIntent;
  lastEdited: string;
  status: "draft" | "live" | "building";
  accent: "magenta" | "violet" | "cyan" | "gold";
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
}

const Ctx = createContext<WorkspaceState | null>(null);

const seedProjects: Project[] = [
  { id: "1", name: "Aurora Studio", type: "website", lastEdited: "2h ago", status: "live", accent: "magenta" },
  { id: "2", name: "Pulse Analytics", type: "dashboard", lastEdited: "Yesterday", status: "building", accent: "cyan" },
  { id: "3", name: "Helix CRM", type: "webapp", lastEdited: "3 days ago", status: "draft", accent: "violet" },
  { id: "4", name: "Lumen AI Companion", type: "ai-tool", lastEdited: "Last week", status: "live", accent: "gold" },
  { id: "5", name: "Nova Landing", type: "website", lastEdited: "Just now", status: "draft", accent: "violet" },
  { id: "6", name: "Atlas Ops", type: "dashboard", lastEdited: "5 days ago", status: "live", accent: "cyan" },
];

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>("entry");
  const [mode, setMode] = useState<SkillMode>("ai");
  const [intent, setIntent] = useState<BuildIntent | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomDockOpen, setBottomDockOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const value = useMemo<WorkspaceState>(
    () => ({
      view, setView, mode, setMode, intent, setIntent,
      activeProject, setActiveProject,
      projects: seedProjects,
      rightPanelOpen, setRightPanelOpen,
      sidebarOpen, setSidebarOpen,
      bottomDockOpen, setBottomDockOpen,
      commandOpen, setCommandOpen,
      publishOpen, setPublishOpen,
    }),
    [view, mode, intent, activeProject, rightPanelOpen, sidebarOpen, bottomDockOpen, commandOpen, publishOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
