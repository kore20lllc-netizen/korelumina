"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type WorkspaceMode =
  | "builder"
  | "preview"
  | "deployment";

export type WorkspaceConfig = {
  topBarLabel: string;
  topBarColor: string;
  allowEditing: boolean;
};

const MODE_CONFIG: Record<WorkspaceMode, WorkspaceConfig> = {
  builder: {
    topBarLabel: "Builder Mode",
    topBarColor: "from-blue-600 to-indigo-600",
    allowEditing: true,
  },
  preview: {
    topBarLabel: "Preview Mode",
    topBarColor: "from-emerald-600 to-teal-600",
    allowEditing: false,
  },
  deployment: {
    topBarLabel: "Deployment Mode",
    topBarColor: "from-amber-600 to-orange-600",
    allowEditing: false,
  },
};

export type WorkspaceModeContextValue = {
  mode: WorkspaceMode;
  config: WorkspaceConfig;
  setMode: (mode: WorkspaceMode) => void;
  requestModeSwitch: (
    mode: WorkspaceMode,
  ) => Promise<void>;
};

const WorkspaceModeContext =
  createContext<WorkspaceModeContextValue | null>(
    null,
  );

export function WorkspaceModeProvider({
  children,
  initialMode = "builder",
}: {
  children: ReactNode;
  initialMode?: WorkspaceMode;
}) {
  const [mode, setMode] =
    useState<WorkspaceMode>(initialMode);

  async function requestModeSwitch(
    nextMode: WorkspaceMode,
  ) {
    setMode(nextMode);
  }

  const value = useMemo<
    WorkspaceModeContextValue
  >(
    () => ({
      mode,
      config:
        MODE_CONFIG[mode] ??
        MODE_CONFIG.builder,
      setMode,
      requestModeSwitch,
    }),
    [mode],
  );

  return (
    <WorkspaceModeContext.Provider value={value}>
      {children}
    </WorkspaceModeContext.Provider>
  );
}

export function useWorkspaceMode(): WorkspaceModeContextValue {
  const context = useContext(
    WorkspaceModeContext,
  );

  if (context) {
    return context;
  }

  return {
    mode: "builder",
    config: MODE_CONFIG.builder,
    setMode: () => {},
    requestModeSwitch: async () => {},
  };
}
