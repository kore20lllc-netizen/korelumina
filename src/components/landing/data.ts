import {
  Cpu, LayoutDashboard, GitBranch, Workflow, Wand2, Users,
  Shield, ScrollText, FolderTree, Server, ShieldCheck, UsersRound,
  Upload, ScanSearch, Sparkles, Rocket,
  MousePointerSquareDashed, Paintbrush, Command, LibraryBig, CloudUpload, Bell,
  Check, X,
} from "lucide-react";

export const trustBadges = [
  "Import any repository",
  "Live preview before apply",
  "Bring your own GitHub and Supabase",
  "Deploy anywhere",
];

export const socialMetrics = [
  {
    icon: GitBranch,
    label: "Imports any repo",
    summary: "Drop a ZIP, paste a GitHub URL, or connect a repo — KoreLumina indexes it in seconds.",
    details: [
      "Repo Intelligence parses structure, dependencies, and conventions on import.",
      "Works on monorepos, polyglot stacks, and legacy codebases — not just greenfield.",
      "AI suggestions land in the right files with the right patterns from the first prompt.",
    ],
  },
  {
    icon: Cpu,
    label: "Runs across frameworks",
    summary: "Universal Runtime spins up any stack in an isolated environment with hot preview.",
    details: [
      "Supports React, Next, Vue, Svelte, Node, Python, Go, and static sites out of the box.",
      "Per-project isolation keeps dependencies and state fully sandboxed.",
      "New runtimes are added regularly — your team is never locked to a single framework.",
    ],
  },
  {
    icon: ShieldCheck,
    label: "Production-ready",
    summary: "Security scans, dependency audits, and runtime guardrails before code ships.",
    details: [
      "Automated checks run on every AI-generated change, not just at release.",
      "Audit trail captures every edit, action, and deploy for full forensic visibility.",
      "Hardening guidance is enforced inline so issues never reach production.",
    ],
  },
  {
    icon: Server,
    label: "BYO infrastructure",
    summary: "Bring your own cloud, database, and secrets — KoreLumina runs in your perimeter.",
    details: [
      "Connect GitHub, Supabase, Vercel, AWS — your keys stay yours.",
      "Data residency and IP boundaries are preserved end-to-end.",
      "Deploy targets are pluggable: ship to the stack you already trust.",
    ],
  },
];

export const howItWorks = [
  { icon: Upload, title: "Import", body: "Drop a repo, paste a GitHub URL, or start from a blank template. KoreLumina parses and indexes your project in seconds." },
  { icon: ScanSearch, title: "Understand", body: "Repo Intelligence reads structure, dependencies, and patterns so the AI works with full context — not guesses." },
  { icon: Sparkles, title: "Build", body: "Designer, AI, and Developer modes work side by side. Live preview before apply. Multi-cursor edits and refactors." },
  { icon: Rocket, title: "Operate", body: "One-click runtime. Bring your own infra. Ship to your stack with audit trails and team collaboration baked in." },
];

export const architectureSystems = [
  { icon: Cpu, title: "Universal Runtime Engine", body: "Spin up any framework in an isolated runtime — Node, Python, Go, static, full-stack — with hot preview and persistent state." },
  { icon: LayoutDashboard, title: "Lumina Studio", body: "Three studio modes — AI, Designer, Developer — sharing the same project model. Switch context without losing your place." },
  { icon: GitBranch, title: "Repo Intelligence Layer", body: "Parses, indexes, and understands codebases of any size so AI suggestions land in the right files with the right patterns." },
  { icon: Workflow, title: "AI Orchestration Layer", body: "Routes work across the right model and tool for each task — planning, refactor, generation, validation — with full traceability." },
  { icon: Wand2, title: "Transformation Engine", body: "Diff-aware refactors, codemods, and migrations applied across many files at once with side-by-side preview before apply." },
  { icon: Users, title: "In-House Developer Escalation Layer", body: "When AI hits its ceiling, escalate to KoreLumina engineers without leaving the workspace. Human help, on demand." },
];

export const enterpriseLayer = [
  { icon: Shield, label: "Security & Governance", category: "Security", body: "SSO, SCIM, role-based access, and policy controls that meet enterprise compliance bars.", benefit: "Pass SOC 2 & ISO audits without engineering overhead." },
  { icon: ScrollText, label: "Audit Trail", category: "Compliance", body: "Every AI action, edit, and deploy logged and queryable — full forensic visibility.", benefit: "Answer 'who changed what, when' in seconds." },
  { icon: FolderTree, label: "Multi-Project Workspaces", category: "Collaboration", body: "Organize teams, repos, and environments across product lines without context switching.", benefit: "Scale from one team to hundreds with zero replatforming." },
  { icon: Server, label: "BYO Infrastructure", category: "Infrastructure", body: "Bring your own cloud, database, and secrets. KoreLumina runs in your perimeter, not ours.", benefit: "Keep data residency and IP fully inside your boundary." },
  { icon: ShieldCheck, label: "Production Hardening", category: "Security", body: "Automated security scans, dependency audits, and runtime guardrails before code ships.", benefit: "Catch vulnerabilities before they reach production." },
  { icon: UsersRound, label: "Team Collaboration", category: "Collaboration", body: "Real-time presence, shared sessions, and review flows built into the workspace.", benefit: "Cut review cycles in half with shared live context." },
];

export const features = [
  { icon: MousePointerSquareDashed, title: "Multi-cursor refactors", body: "Edit dozens of locations at once with side-by-side diff preview and selection bands." },
  { icon: Paintbrush, title: "Designer canvas", body: "Drag, snap, align, distribute. Visual composition with the same tokens your code ships with." },
  { icon: Command, title: "Command palette", body: "Every action one keystroke away — navigate projects, run AI, deploy, search files." },
  { icon: LibraryBig, title: "Templates marketplace", body: "Production-ready starters across web, dashboards, AI tools, and mobile — fully customizable." },
  { icon: CloudUpload, title: "Deploy anywhere", body: "Push to your own cloud — GitHub, Supabase, Vercel, AWS — KoreLumina never holds your keys hostage." },
  { icon: Bell, title: "Notifications & activity", body: "Build runs, deploys, AI tasks, and teammate events streamed into one focused inbox." },
];

export const comparisonRows = [
  { feature: "Imports any repo", korelumina: true,  lovable: false, bolt: false, v0: false, cursor: true  },
  { feature: "Universal Runtime Engine", korelumina: true, lovable: false, bolt: true,  v0: false, cursor: false },
  { feature: "Designer mode", korelumina: true, lovable: false, bolt: false, v0: true,  cursor: false },
  { feature: "Developer mode (multi-cursor)", korelumina: true, lovable: false, bolt: false, v0: false, cursor: true  },
  { feature: "Expert escalation layer", korelumina: true, lovable: false, bolt: false, v0: false, cursor: false },
  { feature: "Enterprise hardening", korelumina: true, lovable: false, bolt: false, v0: false, cursor: false },
];

export const comparisonCols = ["KoreLumina","Lovable","Bolt.new","v0","Cursor"] as const;

export type TemplatePreview = "marketing" | "dashboard" | "crm" | "chat";

export const templateTeasers: Array<{
  name: string;
  slug: string;
  body: string;
  accent: number;
  category: string;
  tags: string[];
  stack: string[];
  badge?: "New" | "Popular" | "Pro";
  preview: TemplatePreview;
}> = [
  {
    name: "Aurora Marketing",
    slug: "aurora-marketing",
    body: "Premium SaaS marketing site with hero, pricing, and editorial blog.",
    accent: 0,
    category: "Marketing",
    tags: ["Landing", "Blog", "Pricing"],
    stack: ["React", "Tailwind", "MDX"],
    badge: "Popular",
    preview: "marketing",
  },
  {
    name: "Pulse Analytics",
    slug: "pulse-analytics",
    body: "Realtime analytics dashboard with charts, filters, and role-based access.",
    accent: 1,
    category: "Dashboard",
    tags: ["Charts", "RBAC", "Realtime"],
    stack: ["React", "Recharts", "Supabase"],
    badge: "Pro",
    preview: "dashboard",
  },
  {
    name: "Helix CRM",
    slug: "helix-crm",
    body: "Multi-tenant CRM scaffold with auth, billing, and team workspaces.",
    accent: 2,
    category: "Internal",
    tags: ["Auth", "Billing", "Teams"],
    stack: ["React", "Stripe", "Supabase"],
    preview: "crm",
  },
  {
    name: "Lumen AI Companion",
    slug: "lumen-ai",
    body: "Streaming AI chat starter with tool calling and conversation memory.",
    accent: 3,
    category: "AI",
    tags: ["Chat", "Streaming", "Tools"],
    stack: ["React", "AI Gateway", "Edge"],
    badge: "New",
    preview: "chat",
  },
];

export const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    body: "Try KoreLumina end-to-end at no cost.",
    features: [
      "5 AI executions total",
      "Universal Runtime Engine",
      "Repo import (GitHub + ZIP)",
      "Builder preview",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    cadence: "/month",
    body: "For builders shipping production software.",
    features: [
      "Unlimited projects",
      "Included AI credits each month",
      "BYO API keys (OpenAI, Anthropic, Google)",
      "Universal Runtime Engine",
      "Lumina Studio",
      "Repo Intelligence Layer",
      "AI Orchestration Layer",
      "Transformation Engine",
      "Custom domains",
      "Remove KoreLumina branding",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    body: "For teams running KoreLumina at scale.",
    features: [
      "Unlimited workspaces",
      "SSO",
      "Governance controls",
      "Audit logs",
      "Dedicated infrastructure",
      "Custom SLAs",
      "White-glove onboarding",
    ],
    cta: "Talk to Sales",
    highlighted: false,
  },
];

export const faq = [
  { q: "Does KoreLumina lock me into your infrastructure?", a: "No. Bring your own GitHub, Supabase, and cloud — KoreLumina is the operating system that connects them. Your code, your keys, your data." },
  { q: "Can I import an existing project?", a: "Yes. Drop a ZIP, paste a GitHub URL, or connect a repo. Repo Intelligence indexes the codebase so AI works with real context." },
  { q: "What frameworks are supported?", a: "Universal Runtime supports React, Next, Vue, Svelte, plain Node, Python, Go, and static sites. New runtimes are added regularly." },
  { q: "Is there a free tier?", a: "Yes — Free includes 5 AI executions and full access to Designer and Developer modes so you can try the platform end to end." },
  { q: "How does Expert Escalation work?", a: "Pro and Enterprise customers can escalate any task to KoreLumina engineers from inside the workspace. Human help, no context loss." },
  { q: "Can my team collaborate?", a: "Yes. Multi-project workspaces, shared templates, audit trails, and live activity keep teams aligned." },
];

export { Check, X };