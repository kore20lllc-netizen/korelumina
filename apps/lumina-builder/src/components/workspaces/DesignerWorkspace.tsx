import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Type, Palette, Move, Maximize2, Plus,
  FileText, Layout, Image as ImageIcon, Square, Smartphone, Tablet, Monitor,
  Trash2, Sparkles, MousePointer2, Wand2, X,
} from "lucide-react";
import { premiumSurfaces, electricContour, premiumSpacing } from "@/components/design-system/lumina";
import { ExecutivePremiumIcon } from "@/components/design-system/executive/ExecutivePremiumIcon";
import { panelSurface, panelReflection, panelEyebrow, pillButton } from "./developer/shared/surfaces";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { cn } from "@/lib/utils";
import { CanvasProvider, useCanvas, type CanvasElement, type ElementKind } from "./designer/canvasStore";
import { DesignerCanvas } from "./designer/DesignerCanvas";
import { AIAssistPanel } from "./designer/AIAssistPanel";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { LuminaAIMark } from "@/components/ai/LuminaAIMark";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useTransform } from "@/context/TransformContext";
import { TEMPLATES } from "@/lib/transformPages";
import { track } from "@/lib/analytics";
import { useRuntimeBoot } from "@/hooks/useRuntimeBoot";

const kindIcon: Record<ElementKind, any> = {
  headline: Type, subhead: Type, button: Square, image: ImageIcon, badge: Sparkles, card: Layout,
};

export function DesignerWorkspace() {
  return (
    <CanvasProvider>
      <DesignerWorkspaceInner />
    </CanvasProvider>
  );
}

function DesignerWorkspaceInner() {
  const [breakpoint, setBreakpoint] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [aiOpen, setAiOpen] = useState(false);
  const { elements, selected, toggleSelected, setSelected, remove, add, replaceAll } = useCanvas();
  const { activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? null;
  const {
    runtimeUrl,
    runtimePhase,
    runtimeMessage,
    runtimeProgress,
    runtimeError,
  } = useRuntimeBoot(projectId);
  const { openTransform, generatedPages, activePageId, setActivePage, clearGenerated, setPageTemplate } = useTransform();
  const primary: CanvasElement | undefined = elements.find((e) => e.id === selected[0]);

  // When generated pages exist (after Transform → Website), load the active page
  // into the editable canvas. Switching pages swaps the canvas instantly.
  useEffect(() => {
    if (!generatedPages.length || !activePageId) return;
    const page = generatedPages.find((p) => p.id === activePageId);
    if (page) replaceAll(page.sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId, generatedPages]);

  const usingGenerated = generatedPages.length > 0;
  const activePage = usingGenerated ? generatedPages.find((p) => p.id === activePageId) ?? null : null;
  const templateOptions = activePage ? TEMPLATES[activePage.kind] : [];
  const pages = usingGenerated
    ? generatedPages.map((p) => ({ id: p.id, name: p.name, route: p.route }))
    : ["Home", "Pricing", "About", "Blog"].map((n) => ({ id: n, name: n, route: undefined as string | undefined }));

  return (
    <section aria-label="Designer workspace" className="relative flex h-full min-h-0 w-full flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent p-4 text-white md:p-6 lg:overflow-y-hidden">
      <header className="relative min-w-0 overflow-hidden rounded-[28px] border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20 bg-slate-950/[0.48] backdrop-blur-[44px] backdrop-saturate-[170%] shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_30px_rgba(37,99,235,.16),0_28px_160px_rgba(0,0,0,.40),inset_0_0_22px_rgba(56,189,248,.05)] shrink-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_6%_8%,rgba(217,119,6,.18),transparent_30%),radial-gradient(circle_at_30%_70%,rgba(124,58,237,.20),transparent_34%),radial-gradient(circle_at_95%_90%,rgba(34,211,238,.06),transparent_24%)]" />
        <div aria-hidden="true" className={panelReflection} />
        <div className="relative z-10 grid gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-4">
              <ExecutivePremiumIcon icon={Palette} state="active" />
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-400/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100/80">Workspace</span>
                <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em]">
                  <span className="text-gradient-lumina">Designer</span>{" "}
                  <span className="bg-gradient-to-r from-[#D9A441] via-[#B97A18] to-[#7A4B05] bg-clip-text text-transparent">{activeProject?.name ?? "No project"}</span>
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isFeatureEnabled("transform_to_website") && (
                <button type="button" className={pillButton("warning")} onClick={() => {
                  track("transform.opened", { source: "designer", project_id: activeProject?.id ?? null, project_type: activeProject?.type ?? null, framework: null });
                  openTransform({ source: "designer", project: activeProject, detected: null });
                }}><Wand2 className="h-3 w-3" /> Transform to Website</button>
              )}
            </div>
          </div>
          <div className="grid min-w-0 content-start gap-3 sm:grid-cols-3">
            <DesignerReading label="Server" value={runtimePhase === "idle" ? "Stopped" : runtimePhase.replaceAll("-", " ")} detail={runtimeError ?? (runtimeMessage || "Not started")} />
            <DesignerReading label="Page" value={usingGenerated ? activePage?.name ?? "None" : "Home"} detail={usingGenerated ? `${generatedPages.length} editable pages` : "Design canvas"} />
            <DesignerReading label="Selection" value={selected.length === 1 ? primary?.label ?? "None" : `${selected.length} selected`} detail={`${elements.length} layers · ${breakpoint}`} />
          </div>
        </div>
      </header>
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[256px_minmax(0,1fr)_420px] xl:grid-cols-[256px_minmax(0,1fr)_480px]">
      {/* Left: pages + layers */}
      <aside aria-label="Pages, layers and insert tools" className={cn(panelSurface, "h-[40vh] lg:h-auto lg:max-h-none")}>
        <div aria-hidden="true" className={panelReflection} />
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3"><Layout className="h-3.5 w-3.5 text-cyan-300" /><h2 className={panelEyebrow}>Design navigator</h2></div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto [&>*]:shrink-0 p-4">

        {usingGenerated && (
          <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-royal-blue/10 p-3 anim-in">
            <div className="flex items-start gap-2">
              <div className="h-7 w-7 grid place-items-center rounded-lg bg-gold/15 border border-gold/30 shrink-0">
                <Wand2 className="h-3.5 w-3.5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-widest text-gold">Transformed site</div>
                <div className="text-[12px] text-foreground/85 mt-0.5">
                  {generatedPages.length} editable pages — drag sections to refine.
                </div>
              </div>
              <button
                onClick={() => { clearGenerated(); toast("Generated pages dismissed"); }}
                className="h-6 w-6 grid place-items-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition shrink-0"
                aria-label="Dismiss generated site"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              Pages
              {usingGenerated && (
                <span className="px-1.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[9px] uppercase tracking-widest">AI</span>
              )}
            </div>
            <button aria-label="Add page" className="h-6 w-6 grid place-items-center rounded-md hover:bg-surface-2 transition"><Plus className="h-3 w-3" /></button>
          </div>
          <div className="space-y-1">
            {pages.map((p, i) => {
              const isActive = usingGenerated ? p.id === activePageId : i === 0;
              return (
                <button
                  key={p.id}
                  aria-pressed={isActive}
                  onClick={() => {
                    if (usingGenerated) {
                      setActivePage(p.id);
                      setSelected([]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full h-9 px-2 rounded-xl border border-transparent text-sm transition text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40",
                    isActive
                      ? "bg-cyan-400/10 text-cyan-100 ring-1 ring-inset ring-cyan-300/25"
                      : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                  )}
                  title={p.route}
                >
                  <FileText className={cn("h-3.5 w-3.5 shrink-0", isActive && usingGenerated && "text-gold")} />
                  <span className="truncate">{p.name}</span>
                  {isActive && usingGenerated && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_6px_hsl(var(--gold))]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {usingGenerated && activePage && (
          <div className="border-t border-border pt-4 anim-in">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                <Layout className="h-3 w-3" /> Templates
              </div>
              <button
                onClick={() => {
                  setPageTemplate(activePage.id, activePage.templateId);
                  setSelected([]);
                  track("transform.opened_in_designer", { mode: "regenerate", page_count: 1 });
                  toast("Layout regenerated");
                }}
                className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-gold transition flex items-center gap-1"
                title="Regenerate current layout"
              >
                <Sparkles className="h-3 w-3" /> Regen
              </button>
            </div>
            <div className="space-y-1">
              {templateOptions.map((t) => {
                const active = t.id === activePage.templateId;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (active) return;
                      setPageTemplate(activePage.id, t.id);
                      setSelected([]);
                      toast(`Switched to "${t.name}"`);
                    }}
                    className={cn(
                      "w-full text-left rounded-lg border px-2.5 py-2 transition",
                      active
                        ? "border-gold/70 bg-gradient-to-br from-gold/15 to-royal-blue/10 shadow-[0_0_28px_-6px_hsl(var(--gold)/0.75)]"
                        : "border-border bg-surface-1 hover:border-violet/40 hover:bg-surface-2"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        active ? "bg-gold shadow-[0_0_6px_hsl(var(--gold))]" : "bg-muted-foreground/40"
                      )} />
                      <span className={cn("text-xs truncate", active ? "text-foreground" : "text-foreground/85")}>
                        {t.name}
                      </span>
                      {active && (
                        <span className="ml-auto text-[9px] uppercase tracking-widest text-gold">Active</span>
                      )}
                    </div>
                    <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground line-clamp-2">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Layers</div>
            <span className="text-[10px] text-muted-foreground">{elements.length}</span>
          </div>
          <div className="flex items-center gap-1.5 w-full h-7 px-2 rounded-md mb-1 bg-surface-1 text-xs text-foreground">
            <FileText className="h-3.5 w-3.5 text-violet" /> Home
          </div>
          <div className="flex items-center gap-1.5 w-full h-7 pl-5 pr-2 rounded-md mb-1 bg-surface-1/60 text-xs text-muted-foreground">
            <Layout className="h-3.5 w-3.5" /> Hero section
          </div>
          <div className="space-y-0.5 mt-0.5">
            {elements.map((el) => {
              const Icon = kindIcon[el.kind];
              const active = selected.includes(el.id);
              return (
                <button
                  key={el.id}
                  aria-pressed={active}
                  onClick={(e) => toggleSelected(el.id, e.shiftKey || e.metaKey)}
                  className={cn(
                    "flex items-center gap-1.5 w-full h-8 pl-9 pr-2 rounded-xl border border-transparent text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40",
                    active
                      ? "bg-cyan-400/10 text-cyan-100 ring-1 ring-inset ring-cyan-300/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
                  )}
                >
                  <Icon className={cn("h-3 w-3", active && "text-cyan")} />
                  <span className="truncate">{el.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Insert</div>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { kind: "headline" as const, label: "H1", Icon: Type },
              { kind: "button" as const, label: "Btn", Icon: Square },
              { kind: "card" as const, label: "Card", Icon: Layout },
              { kind: "image" as const, label: "Image", Icon: ImageIcon },
              { kind: "badge" as const, label: "Pill", Icon: Sparkles },
              { kind: "subhead" as const, label: "Text", Icon: Type },
            ]).map(({ kind, label, Icon }) => (
              <button
                key={kind + label}
                onClick={() => {
                  const defaults: Record<string, Partial<CanvasElement>> = {
                    headline: { w: 360, h: 80, text: "New headline" },
                    button: { w: 140, h: 44, text: "Button", accent: "magenta" },
                    card: { w: 200, h: 130, text: "New card", accent: "cyan" },
                    image: { w: 200, h: 140 },
                    badge: { w: 160, h: 28, text: "Label" },
                    subhead: { w: 280, h: 50, text: "Supporting text" },
                  };
                  add({ kind, label, x: 240, y: 200, w: 200, h: 80, accent: "violet", ...(defaults[kind] || {}) } as Omit<CanvasElement, "id">);
                  toast(`${label} added`);
                }}
                aria-label={`Insert ${kind}`}
                className={cn("aspect-square flex flex-col items-center justify-center gap-1 hover:border-cyan-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40", premiumSpacing.radius.control, premiumSurfaces.base.card, electricContour.strength.subtle, premiumSurfaces.interaction.hoverLift)}
              >
                <Icon className="h-3.5 w-3.5 text-foreground/80" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
        </div>
      </aside>

      {/* Center: canvas / preview */}
      <main aria-label="Designer canvas" className={cn(panelSurface, "min-h-[480px] lg:min-h-0")}>
        <div aria-hidden="true" className={panelReflection} />
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3"><h2 className={panelEyebrow}>Design canvas</h2></div>
        <div className="min-h-0 flex-1 p-3">
        <PreviewFrame
          url={runtimeUrl}
          projectId={projectId ?? undefined}
          runtimePhase={runtimePhase}
          runtimeMessage={runtimeMessage}
          runtimeProgress={runtimeProgress}
          runtimeError={runtimeError}
        >
          <DesignerCanvas />
        </PreviewFrame>
        </div>
      </main>

      {/* Right: properties */}
      <aside aria-label="Design properties" className={cn(panelSurface, "h-[50vh] lg:h-auto lg:max-h-none")}>
        <div aria-hidden="true" className={panelReflection} />
        <div role="tablist" aria-label="Designer inspector" className="flex shrink-0 items-center gap-1 border-b border-white/10 px-3 pt-3">
          {[{ id: "properties", label: "Properties" }, { id: "ai", label: "AI Assist" }].map((tab) => {
            const active = aiOpen === (tab.id === "ai");
            return <button key={tab.id} type="button" role="tab" aria-selected={active} onClick={() => setAiOpen(tab.id === "ai")} className={cn("relative inline-flex h-9 items-center gap-2 rounded-t-xl px-3.5 text-xs font-semibold transition", active ? "bg-white/[0.06] text-sky-50" : "text-sky-300/60 hover:text-sky-100")}>
              {tab.id === "ai" ? <LuminaAIMark className="h-4 w-4" /> : <Palette className="h-3.5 w-3.5" />}{tab.label}
              {active && <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-amber-300/70 via-cyan-300 to-violet-400/70" />}
            </button>;
          })}
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto p-4", aiOpen && "hidden")}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-display font-semibold text-base mt-0.5">
              {selected.length === 0 ? "Nothing selected" : selected.length > 1 ? `${selected.length} elements` : primary?.label}
            </div>
          </div>
          {primary && (
            <span className="px-2 py-0.5 rounded-full bg-cyan/15 text-cyan text-[10px] uppercase tracking-widest border border-cyan/30">
              {primary.kind}
            </span>
          )}
        </div>

        <div className="pb-3 mb-1 border-b border-border">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Breakpoint</div>
          <div className={cn("grid grid-cols-3 p-1", premiumSpacing.radius.control, premiumSurfaces.base.inset, electricContour.strength.subtle)}>
            {([
              { id: "mobile" as const, Icon: Smartphone },
              { id: "tablet" as const, Icon: Tablet },
              { id: "desktop" as const, Icon: Monitor },
            ]).map(({ id, Icon }) => (
              <button
                key={id}
                aria-label={`Edit ${id} breakpoint`}
                aria-pressed={breakpoint === id}
                onClick={() => { setBreakpoint(id); toast(`Editing ${id}`); }}
                className={cn(
                  "h-8 grid place-items-center rounded-md text-xs transition capitalize",
                  breakpoint === id ? "bg-cyan-400/15 text-cyan-100 ring-1 ring-inset ring-cyan-300/40" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>

        {primary && selected.length === 1 && (
          <Section icon={Move} label="Position">
            <div className="grid grid-cols-2 gap-2">
              <Field label="X"><ReadOut value={Math.round(primary.x)} suffix="px" /></Field>
              <Field label="Y"><ReadOut value={Math.round(primary.y)} suffix="px" /></Field>
              <Field label="W"><ReadOut value={Math.round(primary.w)} suffix="px" /></Field>
              <Field label="H"><ReadOut value={Math.round(primary.h)} suffix="px" /></Field>
            </div>
          </Section>
        )}

        <Section icon={Type} label="Typography">
          <Field label="Text">
            <input
              key={primary?.id ?? "none"}
              defaultValue={primary?.text ?? "Build, alive."}
              className="w-full h-9 px-3 rounded-lg bg-slate-950/30 border border-blue-400/30 text-sm outline-none focus:border-violet/50 transition"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Family">
              <select className="w-full h-9 px-2 rounded-lg bg-slate-950/30 border border-blue-400/30 text-sm outline-none">
                <option>Space Grotesk</option><option>Inter</option><option>Söhne</option>
              </select>
            </Field>
            <Field label="Weight">
              <select className="w-full h-9 px-2 rounded-lg bg-slate-950/30 border border-blue-400/30 text-sm outline-none">
                <option>600</option><option>700</option>
              </select>
            </Field>
          </div>
          <Field label="Size"><Slider value={56} suffix="px" /></Field>
        </Section>

        <Section icon={Palette} label="Color">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-button-lumina shadow-[0_0_18px_-2px_hsl(var(--violet)/0.7)]" />
            <input defaultValue="Lumina gradient" className="min-w-0 flex-1 h-9 px-3 rounded-lg bg-slate-950/30 border border-blue-400/30 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-6 gap-1.5 mt-3">
            {["magenta", "violet", "electric", "cyan", "gold", "rose"].map((c) => (
              <button key={c} aria-label={`${c} color swatch`} className="aspect-square rounded-lg border border-border hover:scale-110 transition shadow-md" style={{ background: `hsl(var(--${c}))` }} />
            ))}
          </div>
        </Section>

        <Section icon={Move} label="Spacing">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Padding Y"><Slider value={48} suffix="px" /></Field>
            <Field label="Padding X"><Slider value={24} suffix="px" /></Field>
          </div>
        </Section>

        <Section icon={Maximize2} label="Layout">
          <Field label="Align">
            <div className={cn("grid grid-cols-3 p-1", premiumSpacing.radius.control, premiumSurfaces.base.inset, electricContour.strength.subtle)}>
              {["Left", "Center", "Right"].map((a, i) => (
                <button key={a} className={cn("h-7 rounded-md text-xs transition", i === 1 ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground")}>{a}</button>
              ))}
            </div>
          </Field>
        </Section>

        {selected.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <MousePointer2 className="h-3 w-3" /> {selected.length} selected
            </span>
            <button
              onClick={() => { remove(selected); setSelected([]); toast("Deleted"); }}
              className="h-7 px-2.5 rounded-md text-[11px] text-rose hover:bg-rose/10 border border-border hover:border-rose/40 flex items-center gap-1 transition"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}
        </div>
        <AIAssistPanel docked open={aiOpen} onClose={() => setAiOpen(false)} />
      </aside>
      </div>
    </section>
  );
}

function DesignerReading({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/60">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize text-sky-100" title={value}>{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-sky-300/60" title={detail}>{detail}</div>
    </div>
  );
}

function Section({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-t border-cyan-300/10 first:border-t-0 first:pt-0", premiumSpacing.insetY.standard, premiumSpacing.stack.dense)}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
function Slider({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-1.5 rounded-full bg-surface-2">
        <div className="absolute inset-y-0 left-0 rounded-full bg-button-lumina" style={{ width: `${value}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-[0_0_10px_hsl(var(--violet))]" style={{ left: `calc(${value}% - 6px)` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">{value}{suffix}</span>
    </div>
  );
}

function ReadOut({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="h-9 px-3 rounded-lg bg-slate-950/30 border border-blue-400/30 text-sm flex items-center justify-between">
      <span className="tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs">{suffix}</span>
    </div>
  );
}
