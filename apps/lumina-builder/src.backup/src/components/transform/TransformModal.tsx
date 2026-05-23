import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Wand2,
  CheckCircle2,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Globe,
  Layers,
  Palette,
  FileText,
  Search,
  Rocket,
  Crown,
  Zap,
  PenTool,
  Building2,
  FilePlus2,
  FileCheck2,
  Plus,
  Minus,
  ChevronRight,
  Code2,
  CheckSquare,
  Square,
} from "lucide-react";
import { useTransform, type TransformMode } from "@/context/TransformContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import { generatePages } from "@/lib/transformPages";
import { track } from "@/lib/analytics";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { checkEntitlement } from "@/services/entitlements";
import { auth, usage as usageProvider } from "@/providers/registry";
import { notificationService } from "@/services/notificationService";
import { projectRepository } from "@/services/projectRepository";

/* -------------------------------------------------------------------------- */
/*  Static mocked content (UI-only vertical slice).                            */
/* -------------------------------------------------------------------------- */

const MODES: {
  id: TransformMode;
  label: string;
  tagline: string;
  Icon: typeof Zap;
  bullets: string[];
  accent: string;
}[] = [
  {
    id: "quick",
    label: "Quick Website",
    tagline: "Core marketing site in minutes",
    Icon: Zap,
    bullets: ["Home", "Features", "Pricing", "Contact"],
    accent: "from-cyan/20 to-electric/10 border-cyan/30",
  },
  {
    id: "full",
    label: "Full Website",
    tagline: "Complete conversion-focused marketing site",
    Icon: Globe,
    bullets: ["Home + Solutions", "Pricing + FAQ", "Blog + Testimonials", "Legal pages"],
    accent: "from-violet/25 to-magenta/10 border-violet/40",
  },
  {
    id: "rebrand",
    label: "Premium Rebrand",
    tagline: "New design system + brand refresh",
    Icon: PenTool,
    bullets: ["Refined palette", "Typography system", "Custom motion", "Luxury components"],
    accent: "from-gold/25 to-magenta/10 border-gold/40",
  },
  {
    id: "whitelabel",
    label: "White-Label Website",
    tagline: "Agency-ready handoff",
    Icon: Building2,
    bullets: ["Style tokens", "Branded handoff doc", "Client preview link", "Reusable kit"],
    accent: "from-royal-blue/25 to-gold/10 border-royal-blue/40",
  },
];

const ANALYSIS_STEPS = [
  { label: "Scanning routes & layouts", Icon: Layers },
  { label: "Mapping components & design tokens", Icon: Palette },
  { label: "Detecting application type", Icon: Search },
  { label: "Inferring brand & value proposition", Icon: Sparkles },
];

function buildAnalysis(detected: { framework: string; appType: string; pages: number; components: number; designScore: number } | null) {
  return {
    framework: detected?.framework ?? "Next.js",
    appType: detected?.appType ?? "SaaS Dashboard",
    pages: detected?.pages ?? 27,
    components: detected?.components ?? 94,
    designScore: detected?.designScore ?? 7.8,
    audience: "Ops & analytics teams at growth-stage startups",
    valueProp: "A single workspace to monitor pipelines, KPIs and AI insights in real time.",
    keyFeatures: ["Realtime dashboards", "AI insights", "Role-based access", "Workflow automations"],
    branding: { palette: ["#1B2C5B", "#C9A24B", "#0E1224", "#F4F1EA"], font: "Inter + Söhne" },
  };
}

function buildPlan(mode: TransformMode) {
  const newRoutes = {
    quick: ["/src/pages/marketing/Home.tsx", "/src/pages/marketing/Features.tsx", "/src/pages/marketing/Pricing.tsx", "/src/pages/marketing/Contact.tsx"],
    full: [
      "/src/pages/marketing/Home.tsx",
      "/src/pages/marketing/Features.tsx",
      "/src/pages/marketing/Solutions.tsx",
      "/src/pages/marketing/Pricing.tsx",
      "/src/pages/marketing/Testimonials.tsx",
      "/src/pages/marketing/Faq.tsx",
      "/src/pages/marketing/Blog.tsx",
      "/src/pages/marketing/Contact.tsx",
      "/src/pages/legal/Privacy.tsx",
      "/src/pages/legal/Terms.tsx",
    ],
    rebrand: [
      "/src/pages/marketing/Home.tsx",
      "/src/pages/marketing/Features.tsx",
      "/src/pages/marketing/Pricing.tsx",
      "/src/pages/marketing/Contact.tsx",
      "/src/styles/brand-tokens.css",
      "/src/components/marketing/PremiumHero.tsx",
    ],
    whitelabel: [
      "/src/pages/marketing/Home.tsx",
      "/src/pages/marketing/Pricing.tsx",
      "/src/pages/marketing/Contact.tsx",
      "/handoff/brand-guide.md",
      "/handoff/component-kit.json",
    ],
  }[mode];

  const preserved = [
    "/src/pages/dashboard/*",
    "/src/pages/app/*",
    "/src/integrations/*",
    "/src/lib/* (utilities)",
    "/src/context/* (auth, workspace)",
  ];

  const reusedComponents = ["Hero KPI cards", "Brand color tokens", "Logo & icon set", "Existing dashboard screenshots", "Empty-state illustrations"];

  const designUpgrades = [
    "Glassmorphism navigation",
    "Royal-blue + warm-gold accent system",
    "Luxury 96-unit section spacing",
    "Editorial display type at 64–96px",
    "Soft scroll-linked motion (200ms ease-fluid)",
  ];

  const seo = [
    "OpenGraph + Twitter cards on every marketing route",
    "JSON-LD `Organization` and `SoftwareApplication` schema",
    "Per-page canonicals + meta descriptions <160ch",
    "Sitemap.xml + robots.txt",
  ];

  return { newRoutes, preserved, reusedComponents, designUpgrades, seo };
}

/* -------------------------------------------------------------------------- */
/*  Wizard                                                                     */
/* -------------------------------------------------------------------------- */

type Stage = "mode" | "analyzing" | "plan" | "diff" | "applying" | "success";

export function TransformModal() {
  const { open, payload, closeTransform, setGeneratedPages } = useTransform();
  const { usage, setView, setMode: setWorkspaceMode } = useWorkspace();
  const gate = checkEntitlement("transform");
  const isFreePlan = !gate.allowed;
  void usage;
  if (!isFeatureEnabled("transform_to_website")) return null;

  const projectCtx = {
    project_id: payload?.project?.id ?? null,
    project_name: payload?.project?.name ?? null,
    source: payload?.source ?? null,
  };

  const [stage, setStage] = useState<Stage>("mode");
  const [mode, setMode] = useState<TransformMode>("full");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [applyPct, setApplyPct] = useState(0);

  // Reset on open/close
  useEffect(() => {
    if (!open) return;
    setStage("mode");
    setMode("full");
    setAnalysisStep(0);
    setApplyPct(0);
  }, [open]);

  // Fire upgrade-gate impression when a Free user opens the wizard.
  useEffect(() => {
    if (open && isFreePlan) {
      track("transform.upgrade_gate_shown", projectCtx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isFreePlan, payload?.source, payload?.project?.id]);

  // Funnel stage tracking
  useEffect(() => {
    if (!open || isFreePlan) return;
    const ctx = { mode, ...projectCtx };
    if (stage === "analyzing") track("transform.analysis_started", ctx);
    else if (stage === "plan") track("transform.plan_viewed", ctx);
    else if (stage === "diff") track("transform.diff_viewed", ctx);
    else if (stage === "applying") track("transform.applied", ctx);
    else if (stage === "success") track("transform.completed", ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, open, isFreePlan, mode, payload?.project?.id]);

  // Drive analysis animation
  useEffect(() => {
    if (stage !== "analyzing") return;
    setAnalysisStep(0);
    const timers: number[] = [];
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setAnalysisStep(i + 1), 550 * (i + 1)));
    });
    timers.push(
      window.setTimeout(() => setStage("plan"), 550 * ANALYSIS_STEPS.length + 450)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [stage]);

  // Drive apply animation
  useEffect(() => {
    if (stage !== "applying") return;
    setApplyPct(0);
    const start = performance.now();
    const duration = 2400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setApplyPct(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setStage("success");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const analysis = useMemo(() => buildAnalysis(payload?.detected ?? null), [payload]);
  const plan = useMemo(() => buildPlan(mode), [mode]);
  const projectName = payload?.project?.name ?? "Your application";

  const handleClose = () => {
    if (open) track("transform.closed", { stage, mode, ...projectCtx });
    closeTransform();
  };

  const completeTransform = useCallback(() => {
    const pages = generatePages(mode, payload?.project?.name ?? "Your product");
    setGeneratedPages(pages);
    setWorkspaceMode("designer");
    setView("workspace");
    track("transform.opened_in_designer", { mode, page_count: pages.length, ...projectCtx });
    const _u = auth.getUser();
    if (_u) usageProvider.recordTransformation(_u.id);
    const targetId = payload?.project?.id;
    if (targetId) {
      const existing = projectRepository.get(targetId);
      if (existing) {
        const planRoutes = buildPlan(mode).newRoutes;
        const stub = (name: string) =>
          `export default function ${name}Page(){\n  return (\n    <main className=\"min-h-screen\">\n      <h1 className=\"font-display text-4xl\">${name}</h1>\n      <p className=\"text-muted-foreground mt-3\">Generated by Transform App → Website (${mode}).</p>\n    </main>\n  );\n}\n`;
        const next: Record<string, string> = { ...(existing.files ?? {}) };
        for (const route of planRoutes) {
          const path = route.replace(/^\//, "");
          const base = (path.split("/").pop() ?? "Page").replace(/\.(tsx|ts|css|md|json)$/i, "");
          next[path] = path.endsWith(".md")
            ? `# ${base}\n\nGenerated handoff doc.\n`
            : path.endsWith(".json")
              ? "{}\n"
              : path.endsWith(".css")
                ? `:root{--brand:hsl(265 90% 65%);}\n`
                : stub(base);
        }
        projectRepository.saveFiles(targetId, next);
      }
    }
    notificationService.push({ title: "Transform complete", body: `${pages.length} pages generated.`, kind: "success" });
    toast.success(`${pages.length} pages opened in Designer`);
    closeTransform();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, payload?.project?.id, payload?.project?.name, setGeneratedPages, setWorkspaceMode, setView, closeTransform]);

  // Auto-navigate to Designer the moment apply finishes — skip the success step.
  useEffect(() => {
    if (stage === "success") completeTransform();
  }, [stage, completeTransform]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="glass-strong border-border max-w-3xl p-0 overflow-hidden">
        {/* Premium header with gold + royal-blue wash */}
        <div className="relative">
          <div className="absolute inset-0 pointer-events-none opacity-60 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--royal-blue)/0.35),transparent_55%),radial-gradient(circle_at_85%_0%,hsl(var(--gold)/0.28),transparent_50%)]" />
          <DialogHeader className="relative p-6 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.22em] bg-gold/10 border border-gold/30 text-gold">
                <Crown className="h-3 w-3" /> Premium
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.22em] bg-royal-blue/10 border border-royal-blue/30 text-[hsl(var(--royal-blue))]">
                KoreLumina
              </span>
            </div>
            <DialogTitle className="font-display text-xl md:text-2xl tracking-tight">
              Transform App <span className="text-muted-foreground">→</span> Website
            </DialogTitle>
            <p className="text-[12px] text-muted-foreground mt-1.5 max-w-xl">
              Turn <span className="text-foreground">{projectName}</span> into a premium conversion-focused
              marketing website in minutes — while preserving the original app.
            </p>
            {!isFreePlan && (
              <Stepper stage={stage} />
            )}
          </DialogHeader>
        </div>

        <div className="p-6 min-h-[360px] max-h-[70vh] overflow-y-auto">
          {isFreePlan ? (
            <UpgradeGate
              onClose={handleClose}
              onUpgrade={() => {
                track("transform.upgrade_clicked", projectCtx);
                handleClose();
                setView("pricing");
              }}
            />
          ) : stage === "mode" ? (
            <ModeStep
              mode={mode}
              setMode={(m) => { setMode(m); track("transform.mode_selected", { mode: m, ...projectCtx }); }}
              onNext={() => setStage("analyzing")}
            />
          ) : stage === "analyzing" ? (
            <AnalyzingStep step={analysisStep} />
          ) : stage === "plan" ? (
            <PlanStep
              analysis={analysis}
              mode={mode}
              onBack={() => setStage("mode")}
              onNext={() => setStage("diff")}
            />
          ) : stage === "diff" ? (
            <DiffStep
              plan={plan}
              mode={mode}
              onBack={() => setStage("plan")}
              onApply={() => setStage("applying")}
            />
          ) : stage === "applying" ? (
            <ApplyingStep pct={applyPct} />
          ) : (
            <SuccessStep
              onOpen={() => {
                const pages = generatePages(mode, payload?.project?.name ?? "Your product");
                setGeneratedPages(pages);
                setWorkspaceMode("designer");
                setView("workspace");
                track("transform.opened_in_designer", { mode, page_count: pages.length, ...projectCtx });
                const _u = auth.getUser();
                if (_u) usageProvider.recordTransformation(_u.id);
                // Persist generated route stubs into the project's file map so
                // they survive reload and appear in the file tree.
                const targetId = payload?.project?.id;
                if (targetId) {
                  const existing = projectRepository.get(targetId);
                  if (existing) {
                    const planRoutes = buildPlan(mode).newRoutes;
                    const stub = (name: string) =>
                      `export default function ${name}Page(){\n  return (\n    <main className=\"min-h-screen\">\n      <h1 className=\"font-display text-4xl\">${name}</h1>\n      <p className=\"text-muted-foreground mt-3\">Generated by Transform App → Website (${mode}).</p>\n    </main>\n  );\n}\n`;
                    const next: Record<string, string> = { ...(existing.files ?? {}) };
                    for (const route of planRoutes) {
                      const path = route.replace(/^\//, "");
                      const base = (path.split("/").pop() ?? "Page").replace(/\.(tsx|ts|css|md|json)$/i, "");
                      next[path] = path.endsWith(".md")
                        ? `# ${base}\n\nGenerated handoff doc.\n`
                        : path.endsWith(".json")
                          ? "{}\n"
                          : path.endsWith(".css")
                            ? `:root{--brand:hsl(265 90% 65%);}\n`
                            : stub(base);
                    }
                    projectRepository.saveFiles(targetId, next);
                  }
                }
                notificationService.push({ title: "Transform complete", body: `${pages.length} pages generated.`, kind: "success" });
                toast.success(`${pages.length} pages opened in Designer`);
                handleClose();
              }}
              onClose={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

const STEPS: { id: Stage; label: string }[] = [
  { id: "mode", label: "Mode" },
  { id: "analyzing", label: "Analyze" },
  { id: "plan", label: "Plan" },
  { id: "diff", label: "Diff" },
  { id: "applying", label: "Apply" },
  { id: "success", label: "Done" },
];

function Stepper({ stage }: { stage: Stage }) {
  const idx = STEPS.findIndex((s) => s.id === stage);
  return (
    <ol className="flex items-center gap-2 mt-4 text-[11px]">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                "h-5 px-2 rounded-full flex items-center gap-1.5 border tabular-nums transition-colors",
                done && "bg-cyan/10 text-cyan border-cyan/30",
                active && "bg-gold/15 text-gold border-gold/40 shadow-[0_0_18px_-6px_hsl(var(--gold)/0.6)]",
                !done && !active && "bg-surface-1 text-muted-foreground border-border"
              )}
            >
              {done ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
              <span className="uppercase tracking-widest">{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-3 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

function ModeStep({ mode, setMode, onNext }: { mode: TransformMode; setMode: (m: TransformMode) => void; onNext: () => void }) {
  return (
    <div className="space-y-5 anim-in">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Step 1</div>
        <h3 className="font-display text-lg">Choose a transformation mode</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {MODES.map((m) => {
          const active = mode === m.id;
          const I = m.Icon;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "text-left p-4 rounded-2xl border bg-gradient-to-br transition-all",
                m.accent,
                active
                  ? "ring-2 ring-gold/60 shadow-[0_10px_30px_-12px_hsl(var(--gold)/0.55)]"
                  : "opacity-90 hover:opacity-100 hover:scale-[1.01]"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-9 w-9 grid place-items-center rounded-xl bg-background/40 backdrop-blur border border-white/10">
                  <I className="h-4 w-4 text-foreground" />
                </div>
                {active && <span className="h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_hsl(var(--gold))]" />}
              </div>
              <div className="font-display font-semibold text-[15px]">{m.label}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5">{m.tagline}</div>
              <ul className="mt-3 grid grid-cols-2 gap-1 text-[11px] text-foreground/85">
                {m.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-current opacity-60" />{b}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end pt-1">
        <LuminaButton onClick={onNext} size="md">
          Analyze repository <ArrowRight className="h-3.5 w-3.5" />
        </LuminaButton>
      </div>
    </div>
  );
}

function AnalyzingStep({ step }: { step: number }) {
  return (
    <div className="space-y-6 anim-in py-4">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 grid place-items-center rounded-xl bg-gold/10 border border-gold/30">
          <Wand2 className="h-5 w-5 text-gold animate-pulse" />
          <span className="absolute inset-0 rounded-xl ring-2 ring-gold/30 animate-ping" />
        </div>
        <div>
          <div className="font-display text-[15px]">Analyzing your application</div>
          <div className="text-[12px] text-muted-foreground">Reading routes, components, design tokens & content</div>
        </div>
      </div>
      <ol className="space-y-2.5">
        {ANALYSIS_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const I = s.Icon;
          return (
            <li key={s.label} className="flex items-center gap-3 text-[13px]">
              <span
                className={cn(
                  "h-7 w-7 grid place-items-center rounded-lg border",
                  done && "bg-cyan/15 border-cyan/40 text-cyan",
                  active && "bg-gold/15 border-gold/40 text-gold",
                  !done && !active && "bg-surface-1 border-border text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <I className="h-3.5 w-3.5" />}
              </span>
              <span className={cn(done || active ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PlanStep({
  analysis,
  mode,
  onBack,
  onNext,
}: {
  analysis: ReturnType<typeof buildAnalysis>;
  mode: TransformMode;
  onBack: () => void;
  onNext: () => void;
}) {
  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? mode;
  return (
    <div className="space-y-5 anim-in">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Step 2 — AI summary</div>
        <h3 className="font-display text-lg">We understand your application</h3>
      </div>

      {/* Detection grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <Stat label="Framework" value={analysis.framework} />
        <Stat label="App type" value={analysis.appType} />
        <Stat label="Pages" value={String(analysis.pages)} />
        <Stat label="Components" value={String(analysis.components)} />
        <Stat label="Design" value={`${analysis.designScore}/10`} accent="gold" />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Audience & value">
          <p className="text-[12px] text-muted-foreground"><span className="text-foreground">Audience:</span> {analysis.audience}</p>
          <p className="text-[12px] text-muted-foreground mt-2"><span className="text-foreground">Promise:</span> {analysis.valueProp}</p>
        </Card>
        <Card title="Brand & identity">
          <div className="flex items-center gap-1.5">
            {analysis.branding.palette.map((c) => (
              <span key={c} className="h-6 w-6 rounded-md border border-white/10" style={{ background: c }} />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">Typography: {analysis.branding.font}</p>
        </Card>
      </div>

      <Card title={`Proposed architecture · ${modeLabel}`}>
        <ul className="grid grid-cols-2 gap-1.5 text-[12px]">
          {buildPlan(mode).newRoutes.slice(0, 10).map((r) => (
            <li key={r} className="flex items-center gap-1.5 text-foreground/85"><FilePlus2 className="h-3 w-3 text-gold" />{r}</li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-between pt-1">
        <LuminaButton variant="ghost" onClick={onBack} size="md"><ArrowLeft className="h-3.5 w-3.5" />Back</LuminaButton>
        <LuminaButton onClick={onNext} size="md">Review changes <ArrowRight className="h-3.5 w-3.5" /></LuminaButton>
      </div>
    </div>
  );
}

function DiffStep({
  plan,
  mode,
  onBack,
  onApply,
}: {
  plan: ReturnType<typeof buildPlan>;
  mode: TransformMode;
  onBack: () => void;
  onApply: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    () => Object.fromEntries(plan.newRoutes.map((r) => [r, true]))
  );
  const [expanded, setExpanded] = useState<string | null>(plan.newRoutes[0] ?? null);

  const selectedCount = plan.newRoutes.filter((r) => selected[r]).length;
  const allOn = selectedCount === plan.newRoutes.length;

  const toggle = (r: string) => {
    setSelected((s) => {
      const next = !s[r];
      track("transform.diff_file_toggled", { mode, file: r, selected: next });
      return { ...s, [r]: next };
    });
  };
  const toggleAll = () => {
    const next = !allOn;
    track("transform.diff_file_toggled", { mode, file: "*", selected: next });
    setSelected(Object.fromEntries(plan.newRoutes.map((r) => [r, next])));
  };

  return (
    <div className="space-y-5 anim-in">
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1">Step 3 — Review & approve</div>
        <h3 className="font-display text-lg">
          Diff preview · <span className="text-gold">{selectedCount}</span>
          <span className="text-muted-foreground"> / {plan.newRoutes.length} new files selected</span>
        </h3>
        <p className="text-[12px] text-muted-foreground mt-1">
          Tick each route you want generated and expand to preview the scaffolded code. Your existing app stays untouched.
        </p>
      </div>

      {/* File-by-file checklist with expandable previews */}
      <div className="rounded-xl border border-border bg-surface-1/40 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-1/60">
          <span className="h-5 w-5 grid place-items-center rounded-md border bg-cyan/15 text-cyan border-cyan/30">
            <Plus className="h-3 w-3" />
          </span>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">New marketing routes</span>
          <button
            onClick={toggleAll}
            className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            {allOn ? <CheckSquare className="h-3 w-3 text-gold" /> : <Square className="h-3 w-3" />}
            {allOn ? "Deselect all" : "Select all"}
          </button>
        </div>
        <ul className="divide-y divide-border">
          {plan.newRoutes.map((path) => {
            const isOn = !!selected[path];
            const isOpen = expanded === path;
            return (
              <li key={path}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => toggle(path)}
                    className="h-5 w-5 grid place-items-center rounded-md border border-border bg-surface-2 hover:border-gold/50 transition-colors shrink-0"
                    aria-label={isOn ? "Deselect file" : "Select file"}
                  >
                    {isOn ? <CheckSquare className="h-3.5 w-3.5 text-gold" /> : <Square className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => {
                      const next = isOpen ? null : path;
                      setExpanded(next);
                      if (next) track("transform.diff_file_expanded", { mode, file: path });
                    }}
                    className="flex-1 min-w-0 flex items-center gap-2 text-left group"
                  >
                    <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-90 text-gold")} />
                    <FilePlus2 className={cn("h-3 w-3 shrink-0", isOn ? "text-cyan" : "text-muted-foreground/60")} />
                    <span className={cn(
                      "font-mono text-[11px] truncate",
                      isOn ? "text-foreground/90" : "text-muted-foreground/60 line-through"
                    )}>{path}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground/70 shrink-0">
                      {fileMeta(path).kind} · +{fileMeta(path).lines}
                    </span>
                  </button>
                </div>
                {isOpen && (
                  <div className="px-3 pb-3 anim-in">
                    <div className="rounded-lg border border-border bg-background/60 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-surface-2/50">
                        <Code2 className="h-3 w-3 text-[hsl(var(--royal-blue))]" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Preview</span>
                        <span className="ml-auto text-[10px] text-muted-foreground/70 font-mono truncate">{path}</span>
                      </div>
                      <pre className="px-3 py-2.5 text-[11px] leading-relaxed font-mono text-foreground/85 overflow-x-auto max-h-56">
{previewFor(path)}
                      </pre>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Preserved + reused remain static, collapsed-style summary */}
      <div className="rounded-xl border border-border bg-surface-1/40 overflow-hidden">
        <DiffSection icon={<Minus className="h-3 w-3" />} accent="muted" label="Preserved (untouched)" items={plan.preserved} />
        <DiffSection icon={<FileCheck2 className="h-3 w-3" />} accent="gold" label="Reused from your app" items={plan.reusedComponents} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card title="Design upgrades">
          <ul className="space-y-1 text-[12px]">
            {plan.designUpgrades.map((d) => (
              <li key={d} className="flex items-start gap-1.5"><Palette className="h-3 w-3 text-gold mt-0.5 shrink-0" />{d}</li>
            ))}
          </ul>
        </Card>
        <Card title="SEO recommendations">
          <ul className="space-y-1 text-[12px]">
            {plan.seo.map((s) => (
              <li key={s} className="flex items-start gap-1.5"><FileText className="h-3 w-3 text-[hsl(var(--royal-blue))] mt-0.5 shrink-0" />{s}</li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex justify-between pt-1">
        <LuminaButton variant="ghost" onClick={onBack} size="md"><ArrowLeft className="h-3.5 w-3.5" />Back</LuminaButton>
        <LuminaButton onClick={onApply} size="md" disabled={selectedCount === 0}>
          <Sparkles className="h-3.5 w-3.5" />
          Approve & transform{selectedCount > 0 ? ` · ${selectedCount}` : ""}
        </LuminaButton>
      </div>
    </div>
  );
}

function ApplyingStep({ pct }: { pct: number }) {
  return (
    <div className="space-y-6 anim-in py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-to-br from-royal-blue/30 to-gold/20 border border-gold/30">
          <Rocket className="h-5 w-5 text-gold" />
        </div>
        <div>
          <div className="font-display text-[15px]">Generating your marketing website…</div>
          <div className="text-[12px] text-muted-foreground">Writing routes, components, SEO metadata & tokens</div>
        </div>
        <div className="ml-auto text-[12px] tabular-nums text-muted-foreground">{pct}%</div>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--royal-blue)),hsl(var(--violet)),hsl(var(--gold)))] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="grid grid-cols-2 gap-1.5 text-[12px] text-muted-foreground">
        {["Routes scaffolded", "Components composed", "Design tokens applied", "SEO metadata", "Sitemap generated", "Preview built"].map((l, i) => {
          const done = pct > (i + 1) * 14;
          return (
            <li key={l} className={cn("flex items-center gap-1.5", done && "text-foreground")}>
              {done ? <CheckCircle2 className="h-3 w-3 text-cyan" /> : <Loader2 className="h-3 w-3 animate-spin" />}
              {l}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SuccessStep({ onOpen, onClose }: { onOpen: () => void; onClose: () => void }) {
  return (
    <div className="anim-in py-6 text-center">
      <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-gradient-to-br from-cyan/20 via-gold/20 to-royal-blue/30 border border-gold/40 shadow-[0_10px_40px_-10px_hsl(var(--gold)/0.55)]">
        <CheckCircle2 className="h-6 w-6 text-gold" />
      </div>
      <h3 className="font-display text-xl mt-4">Transformation complete</h3>
      <p className="text-[13px] text-muted-foreground mt-2 max-w-md mx-auto">
        Your application has been transformed into a premium marketing website while preserving your original app.
      </p>
      <div className="flex items-center justify-center gap-2 mt-6">
        <LuminaButton variant="ghost" onClick={onClose}>Close</LuminaButton>
        <LuminaButton onClick={onOpen}>
          <Globe className="h-3.5 w-3.5" /> Open marketing site
        </LuminaButton>
      </div>
    </div>
  );
}

function UpgradeGate({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  return (
    <div className="anim-in py-2">
      <div className="text-center mb-6">
        <div className="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-gradient-to-br from-gold/25 to-royal-blue/30 border border-gold/40">
          <Lock className="h-6 w-6 text-gold" />
        </div>
        <h3 className="font-display text-xl mt-4">Unlock Transform App → Website</h3>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-md mx-auto">
          Choose how you want to access this feature. Pay once for a single project, or go Pro for unlimited transformations.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* One-time */}
        <div className="relative rounded-2xl border border-gold/40 bg-gradient-to-b from-gold/[0.08] to-transparent p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="h-4 w-4 text-gold" />
            <div className="font-display text-[15px]">One-time unlock</div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-display text-3xl font-semibold tracking-tight text-gold">$49</span>
            <span className="text-xs text-muted-foreground">one-time</span>
          </div>
          <ul className="space-y-1.5 text-[12px] mt-3 flex-1">
            {["Single transformation", "One project only"].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-gold shrink-0" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
          {/* TODO: wire to Stripe one-time checkout once Lovable Payments is enabled */}
          <LuminaButton onClick={onUpgrade} size="md" className="w-full mt-4">
            Unlock for $49
          </LuminaButton>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-violet/40 bg-gradient-to-b from-violet/[0.08] to-transparent p-5 flex flex-col">
          <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] rounded-full bg-button-lumina text-primary-foreground font-medium">
            Most Popular
          </span>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-4 w-4 text-foreground" />
            <div className="font-display text-[15px]">Pro subscription</div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="font-display text-3xl font-semibold tracking-tight">$99</span>
            <span className="text-xs text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-1.5 text-[12px] mt-3 flex-1">
            {[
              "Unlimited transformations",
              "Unlimited projects",
              "Full browser preview",
              "Repo import",
              "BYO infrastructure",
              "Custom domains",
            ].map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-cyan shrink-0" />
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
          <LuminaButton variant="primary" onClick={onUpgrade} size="md" className="w-full mt-4">
            <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
          </LuminaButton>
        </div>
      </div>

      <div className="flex items-center justify-center mt-5">
        <LuminaButton variant="ghost" onClick={onClose}>Not now</LuminaButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Small visual helpers                                                       */
/* -------------------------------------------------------------------------- */

function Stat({ label, value, accent }: { label: string; value: string; accent?: "gold" }) {
  return (
    <div className={cn(
      "rounded-xl border bg-surface-1/60 p-3",
      accent === "gold" ? "border-gold/30" : "border-border"
    )}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-display text-[15px] mt-1 truncate", accent === "gold" && "text-gold")}>{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-1/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">{title}</div>
      {children}
    </div>
  );
}

function DiffSection({
  icon, accent, label, items,
}: {
  icon: React.ReactNode;
  accent: "cyan" | "gold" | "muted";
  label: string;
  items: string[];
}) {
  const dot =
    accent === "cyan" ? "bg-cyan/15 text-cyan border-cyan/30"
    : accent === "gold" ? "bg-gold/15 text-gold border-gold/30"
    : "bg-surface-2 text-muted-foreground border-border";
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest">
        <span className={cn("h-5 w-5 grid place-items-center rounded-md border", dot)}>{icon}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className="ml-auto tabular-nums text-muted-foreground/70">{items.length}</span>
      </div>
      <ul className="px-3 pb-3 font-mono text-[11px] text-foreground/85 space-y-0.5">
        {items.map((i) => <li key={i} className="truncate">{i}</li>)}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mocked file preview generators                                             */
/* -------------------------------------------------------------------------- */

function fileMeta(path: string): { kind: string; lines: number } {
  if (path.endsWith(".css")) return { kind: "Tokens", lines: 48 };
  if (path.endsWith(".md")) return { kind: "Doc", lines: 62 };
  if (path.endsWith(".json")) return { kind: "Config", lines: 34 };
  if (path.includes("/legal/")) return { kind: "Page", lines: 86 };
  if (path.includes("/components/")) return { kind: "Component", lines: 72 };
  return { kind: "Route", lines: 124 };
}

function componentNameFromPath(path: string): string {
  const base = path.split("/").pop()?.replace(/\.[a-z]+$/i, "") ?? "Page";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function previewFor(path: string): string {
  if (path.endsWith(".css")) {
    return `:root {
  --brand-royal: 222 56% 24%;
  --brand-gold:  41 56% 54%;
  --brand-ink:   228 38% 10%;
  --brand-sand:  43 33% 94%;
  --radius-lux:  18px;
  --shadow-lux:  0 24px 60px -24px hsl(var(--brand-royal) / .35);
}`;
  }
  if (path.endsWith(".md")) {
    return `# Brand Guide

## Voice
Confident, editorial, calm. Speak like a premium magazine, not a SaaS dashboard.

## Color
- Royal Blue  #1B2C5B   primary
- Warm Gold   #C9A24B   accent
- Ink         #0E1224   surfaces
- Sand        #F4F1EA   light surfaces

## Typography
Display: Söhne / Inter Display, 64–96px, -2% tracking
Body:    Inter, 16/28, balanced wrap`;
  }
  if (path.endsWith(".json")) {
    return `{
  "tokens": {
    "color": { "primary": "#1B2C5B", "accent": "#C9A24B" },
    "radius": { "lux": 18 },
    "spacing": { "section": 96 }
  },
  "components": ["Hero", "FeatureGrid", "PricingTable", "CTA"]
}`;
  }
  const name = componentNameFromPath(path);
  if (path.includes("/legal/")) {
    return `import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function ${name}() {
  return (
    <MarketingLayout title="${name}" description="Legal · ${name}">
      <article className="prose mx-auto max-w-3xl py-24">
        <h1>${name}</h1>
        <p>Last updated {new Date().toLocaleDateString()}.</p>
        {/* … generated legal copy … */}
      </article>
    </MarketingLayout>
  );
}`;
  }
  if (path.includes("/components/")) {
    return `import { motion } from "framer-motion";

export function ${name}() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative py-24"
    >
      <h2 className="font-display text-5xl tracking-tight">${name}</h2>
      {/* … luxury composition … */}
    </motion.section>
  );
}`;
  }
  // Marketing route
  return `import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { Hero } from "@/components/marketing/Hero";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { CTA } from "@/components/marketing/CTA";

export default function ${name}() {
  return (
    <MarketingLayout
      title="${name} · KoreLumina"
      description="Premium ${name.toLowerCase()} page generated by Transform App → Website."
    >
      <Hero
        eyebrow="${name}"
        headline="Built for teams who care about craft."
        sub="A conversion-focused ${name.toLowerCase()} page, composed from your existing brand."
      />
      <FeatureGrid />
      <CTA />
    </MarketingLayout>
  );
}`;
}