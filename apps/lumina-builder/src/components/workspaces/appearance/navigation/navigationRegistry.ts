import {
  Layers3,
  Palette,
  Box,
  LayoutGrid,
  Sparkles,
  Wind,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

export interface AppearanceNavigationItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  order: number;
}

export const appearanceNavigationRegistry: AppearanceNavigationItem[] = [
  {
    id: "presets",
    title: "Presets",
    description:
      "Curated appearance profiles.",
    icon: Layers3,
    order: 0,
  },
  {
    id: "theme",
    title: "Theme",
    description:
      "Light and dark operating themes.",
    icon: Palette,
    order: 10,
  },
  {
    id: "material",
    title: "Material",
    description:
      "Glass, solid and mica surfaces.",
    icon: Box,
    order: 20,
  },
  {
    id: "density",
    title: "Density",
    description:
      "Workspace visual density.",
    icon: LayoutGrid,
    order: 30,
  },
  {
    id: "motion",
    title: "Motion",
    description:
      "Animation behavior.",
    icon: Sparkles,
    order: 40,
  },
  {
    id: "ambient",
    title: "Ambient",
    description:
      "Background ambience.",
    icon: Wind,
    order: 50,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    description:
      "Accessibility preferences.",
    icon: ShieldCheck,
    order: 60,
  },
  {
    id: "advanced",
    title: "Advanced",
    description:
      "Design Lab controls.",
    icon: Wrench,
    order: 70,
  },
].sort(
  (a, b) => a.order - b.order,
);
