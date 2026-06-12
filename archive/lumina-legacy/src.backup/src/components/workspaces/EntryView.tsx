import { Globe, AppWindow, BarChart3, Brain, Github, Sparkles, Wand2, Palette, Code2, ArrowRight, Smartphone, Upload, LayoutTemplate, Wand, Pencil, Plus, Trash2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspace, type BuildIntent, type SkillMode } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { GlowCard } from "@/components/lumina/GlowCard";
import { cn } from "@/lib/utils";
import { luminaTile } from "@/lib/luminaPalette";
import { useTypewriter, usePrefersReducedMotion } from "@/hooks/useTypewriter";
import { GlobalImportDropZone } from "@/components/import/GlobalImportDropZone";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PROMPT_PHRASES = [
  "Describe what you want to build…",
  "Paste a GitHub repository URL…",
  "A SaaS dashboard for analytics…",
  "An AI copilot for customer support…",
  "A mobile-first portfolio site…",
];
const STATIC_PLACEHOLDER = "Describe what you want to build or paste a repository URL.";

type ChipDef = { label: string; prompt: string };
const CHIPS_KEY = "entry.templateChips.v2";
type IntentKey = BuildIntent | "any";
type ChipsStore = Record<string, ChipDef[]>; // key = `${intentKey}:${mode}`

// Defaults per (intent, mode). Each combination has its own tone:
//   ai        → natural-language descriptions of the product
//   designer  → visual/structural briefs (sections, layout, style)
//   developer → technical specs (stack, routes, models)
type DefaultsMatrix = Record<IntentKey, Record<SkillMode, ChipDef[]>>;
const DEFAULT_CHIPS_MATRIX: DefaultsMatrix = {
  any: {
    ai: [
      { label: "SaaS dashboard",     prompt: "A SaaS dashboard for analytics with charts, filters, and team workspaces." },
      { label: "AI support copilot", prompt: "An AI copilot for customer support that drafts replies from a knowledge base." },
      { label: "Portfolio site",     prompt: "A mobile-first portfolio with case studies, smooth scroll, and a contact form." },
      { label: "Marketing landing",  prompt: "A marketing landing page with hero, features, pricing, testimonials, and CTA." },
      { label: "From GitHub repo",   prompt: "https://github.com/" },
    ],
    designer: [
      { label: "Hero + sections",    prompt: "Design a landing page: sticky nav, hero with bold headline, 3-up features, social proof, pricing, FAQ, CTA footer. Soft glass surfaces." },
      { label: "Editorial portfolio",prompt: "Design an editorial portfolio: oversized serif type, asymmetric grid of case studies, smooth fade-up scroll, dark theme." },
      { label: "Dashboard layout",   prompt: "Design a dashboard: left sidebar nav, top bar with search, KPI row, two charts, paginated table. Subtle shadows, 12-col grid." },
    ],
    developer: [
      { label: "Vite + Tailwind app",prompt: "Build a Vite + React + Tailwind app with React Router, TanStack Query, and shadcn/ui. Add /, /login, /dashboard routes." },
      { label: "CRUD + auth",        prompt: "Add Supabase auth (email + Google) and CRUD on a `tasks` table with RLS scoped to auth.uid()." },
      { label: "Stripe checkout",    prompt: "Add Stripe Checkout with a /pricing page, webhook to upsert subscriptions, and a billing portal link." },
    ],
  },
  website: {
    ai: [
      { label: "Brand site",         prompt: "A modern brand site with hero, story, work showcase, testimonials, and contact." },
      { label: "Landing page",       prompt: "A high-converting landing page with hero, features, pricing, FAQ, and CTA." },
      { label: "Portfolio",          prompt: "A mobile-first portfolio with case studies and smooth scroll." },
    ],
    designer: [
      { label: "Editorial hero",     prompt: "Hero with oversized display serif, single accent color, generous whitespace, subtle marquee of client logos." },
      { label: "Feature grid",       prompt: "3×2 feature grid with icons, short titles, two-line descriptions, and hover lift." },
      { label: "Pricing + FAQ",      prompt: "Three-tier pricing with toggle for monthly/yearly, recommended badge, and an accordion FAQ underneath." },
    ],
    developer: [
      { label: "Static + SEO",       prompt: "Build a static marketing site with React Router, semantic HTML, JSON-LD, sitemap.xml, and OG tags per route." },
      { label: "MDX blog",           prompt: "Add an MDX-powered /blog with frontmatter, tags, RSS feed, and reading-time estimate." },
      { label: "Forms + email",      prompt: "Add a contact form posting to a Supabase edge function that sends email via Resend." },
    ],
  },
  webapp: {
    ai: [
      { label: "SaaS starter",       prompt: "A SaaS app with auth, billing, dashboard, and team management." },
      { label: "Internal tool",      prompt: "An internal tool with role-based access and CRUD on a data table." },
      { label: "Marketplace",        prompt: "A two-sided marketplace with listings, search, and checkout." },
    ],
    designer: [
      { label: "App shell",          prompt: "App shell: collapsible sidebar, top command bar, breadcrumbs, content area with cards. Light + dark themes." },
      { label: "Onboarding flow",    prompt: "Three-step onboarding with progress bar, illustrated empty states, and a 'skip for now' link." },
      { label: "Settings layout",    prompt: "Settings page: vertical tabs (Profile, Team, Billing, API), sectioned forms with inline validation." },
    ],
    developer: [
      { label: "Auth + RLS",         prompt: "Add Supabase email auth, a `profiles` table with RLS, and a protected /app route guarded by session." },
      { label: "Teams + invites",    prompt: "Add `teams` and `team_members` tables with RLS, an invites flow via email, and role-based UI gating." },
      { label: "Billing (Stripe)",   prompt: "Add Stripe Checkout, customer portal, webhook handler, and a `subscriptions` table synced via webhook." },
    ],
  },
  dashboard: {
    ai: [
      { label: "Analytics",          prompt: "An analytics dashboard with KPIs, charts, filters, and date ranges." },
      { label: "Ops console",        prompt: "An ops control center with live status, alerts, and quick actions." },
      { label: "Admin panel",        prompt: "An admin panel with users, roles, audit log, and settings." },
    ],
    designer: [
      { label: "KPI + charts",       prompt: "Top row of 4 KPI cards, then a 2/3 + 1/3 split with a line chart and a categorical breakdown. Subtle gridlines." },
      { label: "Data table",         prompt: "Dense data table with column visibility toggle, sticky header, row selection, and a right-side detail drawer." },
      { label: "Live monitoring",    prompt: "Real-time monitoring layout: status pills, sparkline grid, alert feed on the right, dark theme." },
    ],
    developer: [
      { label: "Recharts + filters", prompt: "Build a dashboard with Recharts (line, bar, pie), URL-synced date-range and segment filters via search params." },
      { label: "TanStack Table",     prompt: "Add a TanStack Table with server-side pagination, sorting, column filters, and CSV export." },
      { label: "Realtime feed",      prompt: "Add Supabase Realtime subscription to an `events` table, rendered as a streaming activity feed." },
    ],
  },
  "ai-tool": {
    ai: [
      { label: "Support copilot",    prompt: "An AI copilot that drafts replies from a knowledge base." },
      { label: "Content generator",  prompt: "An AI content generator with prompts, presets, and export." },
      { label: "Agent workflow",     prompt: "An agent that chains tools to complete a multi-step task." },
    ],
    designer: [
      { label: "Chat UI",            prompt: "Chat interface: message list with avatars, streaming cursor, prompt suggestions, and a sticky composer with attachments." },
      { label: "Prompt library",     prompt: "Prompt library: searchable grid of prompt cards with tags, preview drawer, and 'use prompt' action." },
      { label: "Generation studio",  prompt: "Generation studio: left settings panel (model, temperature, presets), center canvas with output, right history rail." },
    ],
    developer: [
      { label: "Lovable AI Gateway", prompt: "Wire a chat UI to the Lovable AI Gateway with streaming responses and conversation history in Supabase." },
      { label: "RAG over docs",      prompt: "Build retrieval-augmented Q&A: ingest PDFs, embed with pgvector, and answer with cited chunks." },
      { label: "Tool-calling agent", prompt: "Build a tool-calling agent with 3 tools (search, fetch, math) and a transcript view of each step." },
    ],
  },
  mobile: {
    ai: [
      { label: "Habit tracker",      prompt: "A mobile-first habit tracker with streaks, reminders, and stats." },
      { label: "Social feed",        prompt: "A native-feeling social feed with stories, posts, and likes." },
      { label: "Booking app",        prompt: "A mobile booking app with calendar, slots, and confirmations." },
    ],
    designer: [
      { label: "Tabbed shell",       prompt: "Mobile shell with bottom tab bar (Home, Search, Activity, Profile), large-title headers, and pull-to-refresh." },
      { label: "Onboarding cards",   prompt: "Three swipeable onboarding cards with illustrations, page indicator, and a primary CTA." },
      { label: "Detail + actions",   prompt: "Detail screen with hero image, segmented info, sticky action bar at the bottom." },
    ],
    developer: [
      { label: "PWA install",        prompt: "Make the app a PWA: manifest, service worker, offline shell, install prompt." },
      { label: "Local-first store",  prompt: "Use IndexedDB via Dexie for local-first data with background sync to Supabase." },
      { label: "Push notifications", prompt: "Add Web Push notifications with VAPID and a server function to dispatch reminders." },
    ],
  },
  import: {
    ai: [
      { label: "Paste GitHub URL",   prompt: "https://github.com/" },
      { label: "Modernize repo",     prompt: "Modernize this repo: refactor, upgrade deps, add tests, improve UX." },
      { label: "Add a feature",      prompt: "Add the following feature to this repo: " },
    ],
    designer: [
      { label: "Restyle UI",         prompt: "Keep the structure of this repo but restyle the UI with a cleaner type scale, more whitespace, and a refined dark theme." },
      { label: "Add design system",  prompt: "Introduce a small design system: tokens, primitives (Button, Input, Card), and refactor key screens to use it." },
      { label: "Improve landing",    prompt: "Redesign the landing page in this repo with a stronger hero, clearer features, and a sharper CTA." },
    ],
    developer: [
      { label: "Upgrade deps",       prompt: "Upgrade dependencies in this repo to latest minor versions and fix any breaking changes." },
      { label: "Add tests",          prompt: "Add Vitest unit tests for core utilities and Playwright e2e for the main flow." },
      { label: "CI + lint",          prompt: "Add a GitHub Actions workflow running typecheck, lint, and tests on PRs." },
    ],
  },
};

const chipsKey = (intent: IntentKey, mode: SkillMode) => `${intent}:${mode}`;
const defaultsFor = (intent: IntentKey, mode: SkillMode): ChipDef[] => {
  const byIntent = DEFAULT_CHIPS_MATRIX[intent] ?? DEFAULT_CHIPS_MATRIX.any;
  return (byIntent[mode] ?? byIntent.ai ?? DEFAULT_CHIPS_MATRIX.any.ai).slice();
};
const loadChipsStore = (): ChipsStore => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CHIPS_KEY);
    if (!raw) return {};
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as ChipsStore) : {};
  } catch { return {}; }
};
const saveChipsStore = (s: ChipsStore) => {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(CHIPS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
};

const intents: { id: BuildIntent; label: string; desc: string; icon: any; accent: "violet" | "magenta" | "cyan" | "gold" }[] = [
  { id: "website", label: "Website", desc: "Marketing, portfolio, brand sites", icon: Globe, accent: "magenta" },
  { id: "webapp", label: "Web App", desc: "SaaS, internal tools, products", icon: AppWindow, accent: "violet" },
  { id: "dashboard", label: "Dashboard", desc: "Analytics, ops, control center", icon: BarChart3, accent: "cyan" },
  { id: "ai-tool", label: "AI Tool", desc: "Agents, copilots, generators", icon: Brain, accent: "gold" },
  { id: "mobile", label: "Mobile App", desc: "Native-feeling responsive apps", icon: Smartphone, accent: "cyan" },
  { id: "import", label: "Continue", desc: "Import from GitHub", icon: Github, accent: "violet" },
];

const modes: { id: SkillMode; label: string; desc: string; icon: any; tag: string }[] = [
  { id: "ai", label: "AI Mode", desc: "Describe it. We build it.", icon: Wand2, tag: "Non-tech" },
  { id: "designer", label: "Designer Mode", desc: "Visual canvas, sections, styles.", icon: Palette, tag: "Visual" },
  { id: "developer", label: "Developer Mode", desc: "Files, code, full control.", icon: Code2, tag: "Code" },
];

export function EntryView() {
  const { setView, setIntent, setMode, mode, setImportOpen, projects, recentProjectIds, setActiveProject } = useWorkspace();
  const [pickedIntent, setPickedIntent] = useState<BuildIntent | null>(null);
  const [pickedMode, setPickedMode] = useState<SkillMode>(mode);
  const [prompt, setPrompt] = useState("");
  const [promptFocused, setPromptFocused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const animatedPlaceholder = useTypewriter(PROMPT_PHRASES, {
    paused: reducedMotion || promptFocused || prompt.length > 0,
  });

  // Customizable template chips, keyed by intent + mode.
  const intentKey: IntentKey = pickedIntent ?? "any";
  const [chipsStore, setChipsStore] = useState<ChipsStore>(loadChipsStore);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  useEffect(() => { saveChipsStore(chipsStore); }, [chipsStore]);
  const activeChips: ChipDef[] = useMemo(() => {
    const k = chipsKey(intentKey, pickedMode);
    return chipsStore[k] ?? defaultsFor(intentKey, pickedMode);
  }, [chipsStore, intentKey, pickedMode]);
  const isCustomized = chipsStore[chipsKey(intentKey, pickedMode)] !== undefined;
  const handleSaveChips = (next: ChipDef[]) => {
    const k = chipsKey(intentKey, pickedMode);
    setChipsStore((s) => ({ ...s, [k]: next }));
    toast.success("Template chips saved");
  };
  const handleResetChips = () => {
    const k = chipsKey(intentKey, pickedMode);
    setChipsStore((s) => { const n = { ...s }; delete n[k]; return n; });
    toast("Reverted to defaults");
  };

  const recents = recentProjectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter(Boolean) as typeof projects;

  const handleStart = () => {
    if (!pickedIntent) return;
    setIntent(pickedIntent);
    setMode(pickedMode);
    setView("workspace");
  };

  const submitPrompt = () => {
    if (!prompt.trim()) return;
    setIntent(pickedIntent ?? "webapp");
    setMode(pickedMode);
    toast.success("Starting from prompt…");
    setView("workspace");
  };

  const buildOptions = [
    { id: "prompt",   label: "Start from prompt",   desc: "Describe your idea",       Icon: Wand,            onClick: () => document.getElementById("entry-prompt")?.focus() },
    { id: "github",   label: "Import GitHub repo",  desc: "Clone and continue",       Icon: Github,          onClick: () => setImportOpen(true) },
    { id: "zip",      label: "Upload ZIP",          desc: "Import a project archive", Icon: Upload,          onClick: () => setImportOpen(true) },
    { id: "template", label: "Start from template", desc: "Premium templates",        Icon: LayoutTemplate,  onClick: () => setView("templates") },
    { id: "continue", label: "Continue project",    desc: "Open recent",              Icon: ArrowRight,      onClick: () => setView("dashboard") },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <div className="text-center anim-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border text-[11px] tracking-wide text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-violet" />
            AI-native build studio
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.025em] leading-[1.05]">
            What will you <span className="text-gradient-lumina">create</span> today?
          </h1>
          <p className="text-muted-foreground mt-4 text-[15px] md:text-base max-w-lg mx-auto leading-relaxed">
            Choose your intent and your way of building. KoreLumina adapts to you.
          </p>
        </div>

        {/* Prompt input */}
        <section className="mt-12 anim-in" style={{ animationDelay: "0.05s" }}>
          <div className="glass rounded-2xl p-4 md:p-5 focus-within:ring-1 focus-within:ring-violet/60 transition">
            <textarea
              id="entry-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onFocus={() => setPromptFocused(true)}
              onBlur={() => setPromptFocused(false)}
              placeholder={reducedMotion ? STATIC_PLACEHOLDER : (animatedPlaceholder || " ")}
              rows={3}
              className="w-full bg-transparent outline-none text-[14px] leading-relaxed resize-none placeholder:text-muted-foreground/70"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-[11px] text-muted-foreground">Press Enter or use a build option below.</div>
              <LuminaButton size="sm" disabled={!prompt.trim()} onClick={submitPrompt}>
                <Sparkles className="h-3 w-3" />
                Start building
              </LuminaButton>
            </div>
          </div>
          {/* Template prompt chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1">
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 mr-1">
              Try{isCustomized && <span className="ml-1 text-violet/80 normal-case tracking-normal">(custom)</span>}
            </span>
            {activeChips.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setPrompt(t.prompt);
                  const el = document.getElementById("entry-prompt") as HTMLTextAreaElement | null;
                  if (el) {
                    el.focus();
                    requestAnimationFrame(() => {
                      el.setSelectionRange(t.prompt.length, t.prompt.length);
                    });
                  }
                }}
                aria-label={`Use template: ${t.label}`}
                title={t.prompt}
                className="group inline-flex items-center gap-1 rounded-full bg-surface-1 border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-violet/50 hover:bg-surface-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
              >
                <Sparkles className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition" />
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              aria-label="Customize template chips"
              title="Customize template chips for this intent and mode"
              className="inline-flex items-center gap-1 rounded-full bg-transparent border border-dashed border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-violet/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
            >
              <Pencil className="h-2.5 w-2.5" />
              Customize
            </button>
          </div>
        </section>

        {/* Build options */}
        <section className="mt-6 anim-in" style={{ animationDelay: "0.08s" }}>
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">Build options</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {buildOptions.map((opt, i) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.id}
                  onClick={opt.onClick}
                  className="group text-left p-4 rounded-2xl glass transition-all duration-300 ease-fluid hover:-translate-y-0.5 hover:bg-surface-1"
                >
                  <div className={cn("h-9 w-9 rounded-xl grid place-items-center mb-3", luminaTile(i))}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="font-medium text-[13px] tracking-tight">{opt.label}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Intent grid */}
        <section className="mt-12 anim-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-baseline justify-between mb-5 px-1">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">01 · Build intent</h2>
            <span className="text-[11px] text-muted-foreground/50">Pick one</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {intents.map((it, i) => {
              const Icon = it.icon;
              const isActive = pickedIntent === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setPickedIntent(it.id)}
                  className={cn(
                    "group relative text-left p-4 rounded-2xl glass transition-all duration-300 ease-fluid",
                    "hover:-translate-y-0.5",
                    isActive
                      ? "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]"
                      : "hover:bg-surface-1"
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl grid place-items-center mb-3 transition-all duration-300",
                      luminaTile(i),
                      isActive && "scale-105"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="font-medium text-[13px] tracking-tight">{it.label}</div>
                  <div className="text-[11px] text-muted-foreground/80 mt-0.5 leading-relaxed">{it.desc}</div>
                  {isActive && (
                    <div className="absolute top-3 right-3 h-4 w-4 rounded-full bg-violet grid place-items-center">
                      <span className="h-1 w-1 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Mode grid */}
        <section className="mt-12 anim-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-baseline justify-between mb-5 px-1">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">02 · How you build</h2>
            <span className="text-[11px] text-muted-foreground/50">Pick one</span>
          </div>
          <div className="grid md:grid-cols-3 gap-2.5">
            {modes.map((m, i) => {
              const Icon = m.icon;
              const isActive = pickedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPickedMode(m.id)}
                  className={cn(
                    "group relative text-left p-5 rounded-2xl glass transition-all duration-300 ease-fluid hover:-translate-y-0.5",
                    isActive
                      ? "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]"
                      : "hover:bg-surface-1"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl grid place-items-center transition-all duration-300",
                        luminaTile(i + 1),
                        isActive && "scale-105"
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-muted-foreground">
                      {m.tag}
                    </span>
                  </div>
                  <div className="font-display text-[15px] font-semibold tracking-tight">{m.label}</div>
                  <div className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{m.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent projects */}
        {recents.length > 0 && (
          <section className="mt-12 anim-in" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-baseline justify-between mb-3 px-1">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">Recent projects</h2>
              <button onClick={() => setView("dashboard")} className="text-[11px] text-muted-foreground hover:text-foreground transition">
                View all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {recents.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setActiveProject(p); setView("workspace"); }}
                  className="text-left p-4 rounded-2xl glass hover:bg-surface-1 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-[13px] truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{p.lastEdited}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-surface-2 border border-border text-muted-foreground">
                    {p.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-2 anim-in" style={{ animationDelay: "0.3s" }}>
          <LuminaButton variant="ghost" size="lg" onClick={() => setView("dashboard")}>
            View projects
          </LuminaButton>
          <LuminaButton variant="primary" size="lg" disabled={!pickedIntent} onClick={handleStart}>
            Enter studio
            <ArrowRight className="h-3.5 w-3.5" />
          </LuminaButton>
        </div>
      </div>
      <CustomizeChipsDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        intentKey={intentKey}
        mode={pickedMode}
        chips={activeChips}
        isCustomized={isCustomized}
        onSave={handleSaveChips}
        onReset={handleResetChips}
      />
      <GlobalImportDropZone />
    </div>
  );
}

function CustomizeChipsDialog({
  open, onOpenChange, intentKey, mode, chips, isCustomized, onSave, onReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  intentKey: IntentKey;
  mode: SkillMode;
  chips: ChipDef[];
  isCustomized: boolean;
  onSave: (next: ChipDef[]) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<ChipDef[]>(chips);
  useEffect(() => { if (open) setDraft(chips.map((c) => ({ ...c }))); }, [open, chips]);

  const intentLabel = intentKey === "any" ? "Any intent" : intentKey;
  const update = (i: number, patch: Partial<ChipDef>) =>
    setDraft((d) => d.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => setDraft((d) => d.filter((_, idx) => idx !== i));
  const add = () => setDraft((d) => [...d, { label: "New chip", prompt: "" }]);
  const move = (i: number, dir: -1 | 1) => setDraft((d) => {
    const j = i + dir; if (j < 0 || j >= d.length) return d;
    const next = d.slice(); [next[i], next[j]] = [next[j], next[i]]; return next;
  });

  const cleaned = draft
    .map((c) => ({ label: c.label.trim(), prompt: c.prompt.trim() }))
    .filter((c) => c.label.length > 0);

  // Duplicate-label detection (case-insensitive, trimmed). Computed against
  // the live draft so per-row highlighting matches what the user sees.
  const dupSet = useMemo(() => {
    const counts = new Map<string, number>();
    draft.forEach((c) => {
      const key = c.label.trim().toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, n]) => n > 1).map(([k]) => k));
  }, [draft]);
  const isDuplicate = (label: string) => dupSet.has(label.trim().toLowerCase());
  const dupCount = dupSet.size;
  const canSave = cleaned.length > 0 && dupCount === 0;

  // Group duplicate rows by their normalized label so we can show:
  //   "SaaS dashboard" (rows 1, 4) — using the first non-empty original spelling.
  const dupGroups = useMemo(() => {
    const groups = new Map<string, { display: string; rows: number[] }>();
    draft.forEach((c, i) => {
      const key = c.label.trim().toLowerCase();
      if (!key || !dupSet.has(key)) return;
      const existing = groups.get(key);
      if (existing) existing.rows.push(i + 1);
      else groups.set(key, { display: c.label.trim(), rows: [i + 1] });
    });
    return Array.from(groups.values());
  }, [draft, dupSet]);

  // Append "(2)", "(3)", … to duplicate labels so each becomes unique.
  // Mutates the draft so the user can review before saving.
  const autoFixDuplicates = () => {
    setDraft((d) => {
      const taken = new Set<string>();
      const norm = (s: string) => s.trim().toLowerCase();
      // Seed taken with first occurrence of each non-empty label.
      const firstSeen = new Set<string>();
      d.forEach((c) => {
        const k = norm(c.label);
        if (k && !firstSeen.has(k)) { firstSeen.add(k); taken.add(k); }
      });
      const seenOnce = new Set<string>();
      return d.map((c) => {
        const base = c.label.trim();
        const k = norm(base);
        if (!k) return c;
        if (!seenOnce.has(k)) { seenOnce.add(k); return c; } // first occurrence stays
        // Find smallest n ≥ 2 making "{base} (n)" unique.
        let n = 2;
        // Skip suffix already present like "Foo (3)" — strip it for base.
        const stripped = base.replace(/\s*\(\d+\)\s*$/, "");
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const candidate = `${stripped} (${n})`;
          if (!taken.has(norm(candidate))) {
            taken.add(norm(candidate));
            return { ...c, label: candidate };
          }
          n += 1;
        }
      });
    });
    toast.success("Duplicate labels renamed — review before saving");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customize template chips</DialogTitle>
          <DialogDescription>
            Editing chips for <span className="text-foreground font-medium capitalize">{intentLabel}</span>
            {" · "}
            <span className="text-foreground font-medium capitalize">{mode} mode</span>.
            Changes only apply to this combination.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
          {draft.length === 0 && (
            <div className="text-[12px] text-muted-foreground italic px-1">
              No chips yet — add one below.
            </div>
          )}
          {draft.map((c, i) => {
            const dup = isDuplicate(c.label);
            const errId = `chip-${i}-label-error`;
            return (
            <div
              key={i}
              className={cn(
                "rounded-xl border bg-surface-1 p-3 space-y-2 transition",
                dup ? "border-destructive/60 ring-1 ring-destructive/30" : "border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={c.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  placeholder="Chip label (e.g. SaaS dashboard)"
                  maxLength={40}
                  className={cn(
                    "h-8 text-[13px]",
                    dup && "border-destructive focus-visible:ring-destructive"
                  )}
                  aria-label={`Chip ${i + 1} label`}
                  aria-invalid={dup || undefined}
                  aria-describedby={dup ? errId : undefined}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    aria-label="Move up"
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-transparent"
                  >↑</button>
                  <button
                    type="button" onClick={() => move(i, 1)} disabled={i === draft.length - 1}
                    aria-label="Move down"
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-transparent"
                  >↓</button>
                  <button
                    type="button" onClick={() => remove(i)}
                    aria-label="Remove chip"
                    className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-surface-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {dup && (
                <div id={errId} role="alert" className="text-[11px] text-destructive">
                  Duplicate label — chip labels must be unique.
                </div>
              )}
              <Textarea
                value={c.prompt}
                onChange={(e) => update(i, { prompt: e.target.value })}
                placeholder="Prompt inserted into the textarea when clicked"
                rows={2}
                className="text-[13px] resize-none"
                aria-label={`Chip ${i + 1} prompt`}
              />
            </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-1">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition"
          >
            <Plus className="h-3.5 w-3.5" /> Add chip
          </button>
          <button
            type="button"
            onClick={() => { onReset(); onOpenChange(false); }}
            disabled={!isCustomized}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition disabled:opacity-40 disabled:hover:text-muted-foreground"
            title={isCustomized ? "Revert this intent + mode to defaults" : "Already on defaults"}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
          </button>
        </div>

        <DialogFooter>
          {dupCount > 0 && (
            <div role="alert" className="mr-auto flex flex-col items-start gap-1 text-[12px] text-destructive max-w-[60%]">
              <div className="font-medium">
                Resolve {dupCount} duplicate {dupCount === 1 ? "label" : "labels"} before saving:
              </div>
              <ul className="list-none space-y-0.5">
                {dupGroups.map((g) => (
                  <li key={g.display.toLowerCase()} className="leading-tight">
                    <span className="font-mono">“{g.display}”</span>
                    <span className="text-destructive/80"> — rows {g.rows.join(", ")}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={autoFixDuplicates}
                className="mt-1 inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive hover:bg-destructive/20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                title='Append "(2)", "(3)", … to duplicates'
              >
                <Wand2 className="h-3 w-3" /> Auto-fix
              </button>
            </div>
          )}
          <LuminaButton variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </LuminaButton>
          <LuminaButton
            variant="primary"
            size="sm"
            disabled={!canSave}
            title={dupCount > 0 ? "Resolve duplicate labels first" : undefined}
            onClick={() => { onSave(cleaned); onOpenChange(false); }}
          >
            Save chips
          </LuminaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
