import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_WORKSPACE_APPEARANCE,
  type WorkspaceAppearanceModel,
} from "../model";

interface WorkspaceAppearanceContextValue {
  appearance: WorkspaceAppearanceModel;

  setAppearance(
    next: WorkspaceAppearanceModel,
  ): void;

  updateAppearance(
    updates: Partial<WorkspaceAppearanceModel>,
  ): void;
}

const WorkspaceAppearanceContext =
  createContext<
    WorkspaceAppearanceContextValue | null
  >(null);

export function WorkspaceAppearanceProvider({
  children,
}:{
  children: ReactNode;
}) {

  const [
    appearance,
    setAppearance,
  ] = useState(
    DEFAULT_WORKSPACE_APPEARANCE,
  );

  function updateAppearance(
    updates: Partial<WorkspaceAppearanceModel>,
  ) {
    setAppearance(
      current => ({
        ...current,
        ...updates,
      }),
    );
  }

  const value =
    useMemo(
      () => ({
        appearance,
        setAppearance,
        updateAppearance,
      }),
      [appearance],
    );

  return (
    <WorkspaceAppearanceContext.Provider
      value={value}
    >
      {children}
    </WorkspaceAppearanceContext.Provider>
  );
}

export function useWorkspaceAppearance() {

  const context =
    useContext(
      WorkspaceAppearanceContext,
    );

  if (!context) {
    throw new Error(
      "useWorkspaceAppearance must be used inside WorkspaceAppearanceProvider",
    );
  }

  return context;
}
