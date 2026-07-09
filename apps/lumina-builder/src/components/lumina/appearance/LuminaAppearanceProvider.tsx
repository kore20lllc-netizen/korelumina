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

import type {
  LuminaAppearanceSettings,
} from "./types";

interface LuminaAppearanceContextValue {
  settings: LuminaAppearanceSettings;
  setSettings: (
    settings: LuminaAppearanceSettings,
  ) => void;
  updateSettings: (
    patch: Partial<LuminaAppearanceSettings>,
  ) => void;
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
    useState<LuminaAppearanceSettings>(
      DEFAULT_LUMINA_APPEARANCE,
    );

  useEffect(() => {
    setSettingsState(readLuminaAppearance());
  }, []);

  const setSettings = (
    next: LuminaAppearanceSettings,
  ) => {
    setSettingsState(next);
    writeLuminaAppearance(next);
  };

  const updateSettings = (
    patch: Partial<LuminaAppearanceSettings>,
  ) => {
    setSettings({
      ...settings,
      ...patch,
    });
  };

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
  return useContext(LuminaAppearanceContext);
}
