import {
  createContext,
  useCallback,
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

import {
  createAppearanceSelectors,
  type AppearanceSelectors,
} from "./AppearanceSelectors";

interface WorkspaceAppearanceContextValue {
  state: WorkspaceAppearanceModel;
  actions: AppearanceActions;
  selectors: AppearanceSelectors;
}

const WorkspaceAppearanceContext =
  createContext<
    WorkspaceAppearanceContextValue | null
  >(null);

function clampPercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(value),
    ),
  );
}

export function WorkspaceAppearanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    state,
    setState,
  ] = useState<WorkspaceAppearanceModel>(
    DEFAULT_WORKSPACE_APPEARANCE,
  );

  const updateState = useCallback(
    (
      updates:
        Partial<WorkspaceAppearanceModel>,
    ) => {
      setState(current => {
        const next = {
          ...current,
          ...updates,
        };

        for (
          const key of Object.keys(
            next,
          ) as Array<
            keyof WorkspaceAppearanceModel
          >
        ) {
          if (
            current[key] !== next[key]
          ) {
            return next;
          }
        }

        return current;
      });
    },
    [],
  );

  const actions =
    useMemo<AppearanceActions>(
      () => ({
        setMaterial(value) {
          updateState({
            material: value,
          });
        },

        setTint(value) {
          updateState({
            tint: value,
          });
        },

        setTintStrength(value) {
          updateState({
            tintStrength:
              clampPercentage(value),
          });
        },

        setTransparency(value) {
          updateState({
            transparency:
              clampPercentage(value),
          });
        },

        setBlur(value) {
          updateState({
            blur:
              clampPercentage(value),
          });
        },

        setShadowIntensity(value) {
          updateState({
            shadowIntensity:
              clampPercentage(value),
          });
        },

        setGlowIntensity(value) {
          updateState({
            glowIntensity:
              clampPercentage(value),
          });
        },

        setDensity(value) {
          updateState({
            density: value,
          });
        },

        setSpacing(value) {
          updateState({
            spacing: value,
          });
        },

        setRadius(value) {
          updateState({
            radius: value,
          });
        },

        setElevation(value) {
          updateState({
            elevation: value,
          });
        },

        setAccent(value) {
          updateState({
            accent: value,
          });
        },

        setContrast(value) {
          updateState({
            contrast: value,
          });
        },

        setGlow(value) {
          updateState({
            glow: value,
          });
        },

        setAnimation(value) {
          updateState({
            animation: value,
          });
        },

        setMotion(value) {
          updateState({
            motion:
              clampPercentage(value),
          });
        },

        reset() {
          setState(
            DEFAULT_WORKSPACE_APPEARANCE,
          );
        },
      }),
      [
        updateState,
      ],
    );

  const selectors =
    useMemo(
      () =>
        createAppearanceSelectors(
          state,
        ),
      [
        state,
      ],
    );

  const value =
    useMemo<
      WorkspaceAppearanceContextValue
    >(
      () => ({
        state,
        actions,
        selectors,
      }),
      [
        state,
        actions,
        selectors,
      ],
    );

  return (
    <WorkspaceAppearanceContext.Provider
      value={value}
    >
      {children}
    </WorkspaceAppearanceContext.Provider>
  );
}

export function useWorkspaceAppearance():
  WorkspaceAppearanceContextValue {
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
