export type LuminaWorkspaceTheme =
  | "engineering"
  | "knowledge"
  | "runtime"
  | "designer"
  | "developer"
  | "ai"
  | "admin";

export interface WorkspaceThemeDefinition {
  accent: string;
  hero: string;
  ambient: string;
  surface: string;
  glow: string;
}

export const workspaceThemes: Record<
  LuminaWorkspaceTheme,
  WorkspaceThemeDefinition
> = {
  engineering: {
    accent: "violet",
    hero: "engineering",
    ambient: "engineering",
    surface: "engineering",
    glow: "violet",
  },

  knowledge: {
    accent: "cyan",
    hero: "knowledge",
    ambient: "knowledge",
    surface: "knowledge",
    glow: "cyan",
  },

  runtime: {
    accent: "cyan",
    hero: "runtime",
    ambient: "runtime",
    surface: "runtime",
    glow: "cyan",
  },

  designer: {
    accent: "teal",
    hero: "designer",
    ambient: "designer",
    surface: "designer",
    glow: "teal",
  },

  developer: {
    accent: "blue",
    hero: "developer",
    ambient: "developer",
    surface: "developer",
    glow: "blue",
  },

  ai: {
    accent: "magenta",
    hero: "ai",
    ambient: "ai",
    surface: "ai",
    glow: "magenta",
  },

  admin: {
    accent: "rose",
    hero: "admin",
    ambient: "admin",
    surface: "admin",
    glow: "rose",
  },
};
