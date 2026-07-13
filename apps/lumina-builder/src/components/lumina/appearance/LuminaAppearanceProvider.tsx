import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LUMINA_APPEARANCE,
} from "./defaults";

import {
  readLuminaAppearance,
  writeLuminaAppearance,
} from "./storage";

import {
  resolveAppearance,
} from "./resolver";

import {
  applyAppearance,
} from "./css";

import type {
  LuminaAppearanceSettings,
} from "./types";

interface LuminaAppearanceContextValue {
  settings: LuminaAppearanceSettings;

  setSettings(
    settings: LuminaAppearanceSettings,
  ): void;

  updateSettings(
    patch: Partial<LuminaAppearanceSettings>,
  ): void;
}

const LuminaAppearanceContext =
  createContext<LuminaAppearanceContextValue>({
    settings: DEFAULT_LUMINA_APPEARANCE,
    setSettings: () => {},
    updateSettings: () => {},
  });

export function LuminaAppearanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettingsState] =
    useState(
      DEFAULT_LUMINA_APPEARANCE,
    );

  useEffect(() => {
    setSettingsState(
      readLuminaAppearance(),
    );
  }, []);

  useEffect(() => {
    writeLuminaAppearance(
      settings,
    );

    applyAppearance(
      resolveAppearance(
        settings,
      ),
    );
  }, [settings]);

  const setSettings =
    useCallback(
      (
        next: LuminaAppearanceSettings,
      ) => {
        setSettingsState(
          current => {
            for (const key of Object.keys(
              current,
            ) as Array<
              keyof LuminaAppearanceSettings
            >) {
              if (
                current[key] !== next[key]
              ) {
                return next;
              }
            }

            return current;
          },
        );
      },
      [],
    );

  const updateSettings =
    useCallback(
      (
        patch: Partial<LuminaAppearanceSettings>,
      ) => {
        setSettingsState(
          current => {
            const next = {
              ...current,
              ...patch,
            };

            for (const key of Object.keys(
              next,
            ) as Array<
              keyof LuminaAppearanceSettings
            >) {
              if (
                current[key] !== next[key]
              ) {
                return next;
              }
            }

            return current;
          },
        );
      },
      [],
    );

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      updateSettings,
    }),
    [
      settings,
      setSettings,
      updateSettings,
    ],
  );

  return (
    <LuminaAppearanceContext.Provider
      value={value}
    >
      {children}
    </LuminaAppearanceContext.Provider>
  );
}

export function useLuminaAppearance() {
  return useContext(
    LuminaAppearanceContext,
  );
}
