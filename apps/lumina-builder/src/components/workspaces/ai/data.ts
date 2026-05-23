import { Globe, AppWindow, BarChart3, Brain, type LucideIcon } from "lucide-react";

export type Template = {
  icon: LucideIcon;
  label: string;
  desc: string;
  accent: "magenta" | "violet" | "cyan" | "gold";
};

export const templates: Template[] = [
  { icon: Globe, label: "Marketing site", desc: "Hero, features, pricing", accent: "magenta" },
  { icon: AppWindow, label: "SaaS starter", desc: "Auth + dashboard shell", accent: "violet" },
  { icon: BarChart3, label: "Admin panel", desc: "Tables, charts, filters", accent: "cyan" },
  { icon: Brain, label: "AI copilot", desc: "Chat + tool-calling UI", accent: "gold" },
];

export type ActivityStep = {
  t: string;
  text: string;
  state: "done" | "active" | "pending";
};

export const activityLog: ActivityStep[] = [
  { t: "0.2s", text: "Parsing your intent…", state: "done" },
  { t: "0.6s", text: "Selecting design tokens (Lumina aurora)", state: "done" },
  { t: "1.1s", text: "Composing hero, features, footer", state: "active" },
  { t: "—", text: "Wiring smooth scroll & motion", state: "pending" },
  { t: "—", text: "Generating preview", state: "pending" },
];

export const suggestions = ["Add auth", "Connect database", "Dark hero", "Add pricing"];