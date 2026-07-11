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

import type {
  AppearanceActions,
} from "./AppearanceActions";

interface WorkspaceAppearanceContextValue {
  appearance: WorkspaceAppearanceModel;
  actions: AppearanceActions;
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

  const actions: AppearanceActions = {

    setMaterial(material: WorkspaceAppearanceModel["material"]) {
      updateAppearance({
        material,
      });
    },

    setTint(tint: WorkspaceAppearanceModel["tint"]) {
      updateAppearance({
        tint,
      });
    },

    setTintStrength(value: number) {
      updateAppearance({
        tintStrength: value,
      });
    },

    setTransparency(value: number) {
      updateAppearance({
        transparency: value,
      });
    },

    setBlur(value: number) {
      updateAppearance({
        blur: value,
      });
    },

    setDensity(
      density: WorkspaceAppearanceModel["density"],
    ) {
      updateAppearance({
        density,
      });
    },

    setSpacing(
      spacing: WorkspaceAppearanceModel["spacing"],
    ) {
      updateAppearance({
        spacing,
      });
    },

    setRadius(
      radius: WorkspaceAppearanceModel["radius"],
    ) {
      updateAppearance({
        radius,
      });
    },

    reset() {
      setAppearance(
        DEFAULT_WORKSPACE_APPEARANCE,
      );
    },
  };

  const value =
    useMemo(
      () => ({
        appearance,
        actions,
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
