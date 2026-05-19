import type { ComponentType } from "react";
import { AuroraMarketing } from "./starters/AuroraMarketing";
import { PulseAnalytics } from "./starters/PulseAnalytics";
import { HelixCRM } from "./starters/HelixCRM";
import { LumenAI } from "./starters/LumenAI";

export interface TemplateRegistryEntry {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  stack: string[];
  tags: string[];
  accent: number;
  Component: ComponentType;
}

export const templateRegistry: TemplateRegistryEntry[] = [
  {
    slug: "aurora-marketing",
    name: "Aurora Marketing",
    tagline: "Premium SaaS marketing site with hero, pricing, and editorial blog.",
    category: "Marketing",
    stack: ["React", "Tailwind", "MDX"],
    tags: ["Landing", "Blog", "Pricing"],
    accent: 0,
    Component: AuroraMarketing,
  },
  {
    slug: "pulse-analytics",
    name: "Pulse Analytics",
    tagline: "Realtime analytics dashboard with charts, filters, and role-based access.",
    category: "Dashboard",
    stack: ["React", "Recharts", "Supabase"],
    tags: ["Charts", "RBAC", "Realtime"],
    accent: 1,
    Component: PulseAnalytics,
  },
  {
    slug: "helix-crm",
    name: "Helix CRM",
    tagline: "Multi-tenant CRM scaffold with auth, billing, and team workspaces.",
    category: "Internal",
    stack: ["React", "Stripe", "Supabase"],
    tags: ["Auth", "Billing", "Teams"],
    accent: 2,
    Component: HelixCRM,
  },
  {
    slug: "lumen-ai",
    name: "Lumen AI Companion",
    tagline: "Streaming AI chat starter with tool calling and conversation memory.",
    category: "AI",
    stack: ["React", "AI Gateway", "Edge"],
    tags: ["Chat", "Streaming", "Tools"],
    accent: 3,
    Component: LumenAI,
  },
];

export function getTemplateBySlug(slug: string | undefined) {
  return templateRegistry.find((t) => t.slug === slug);
}

export function getTemplateByName(name: string) {
  return templateRegistry.find((t) => t.name === name);
}