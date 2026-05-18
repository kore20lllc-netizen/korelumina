"use client";

import { create } from "zustand";

/**
 * Supported builder modes.
 *
 * Included modes are based on actual usage across the codebase:
 * - design
 * - designer
 * - dev
 * - preview
 */
export type BuilderMode =
  | "design"
  | "designer"
  | "dev"
  | "preview";

type BuilderState = {
  mode: BuilderMode;
  setMode: (mode: BuilderMode) => void;
};

export const useBuilderState = create<BuilderState>((set) => ({
  mode: "design",
  setMode: (mode) => set({ mode }),
}));
