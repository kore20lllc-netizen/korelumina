import {
  createContext,
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

  function setSettings(
    next: LuminaAppearanceSettings,
  ) {
    setSettingsState(next);
  }

  function updateSettings(
    patch: Partial<LuminaAppearanceSettings>,
  ) {
    setSettingsState(
      current => ({
        ...current,
        ...patch,
      }),
    );
  }

  const value = useMemo(
    () => ({
      settings,
      setSettings,
      updateSettings,
    }),
    [settings],
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
