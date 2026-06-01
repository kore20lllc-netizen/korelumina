import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronRight, ChevronDown, Type, Palette, Move, Maximize2, Plus,
  FileText, Layout, Image as ImageIcon, Square, Smartphone, Tablet, Monitor,
  Trash2, Sparkles, MousePointer2, Wand2, X,
} from "lucide-react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { cn } from "@/lib/utils";
import { CanvasProvider, useCanvas, type CanvasElement, type ElementKind } from "./designer/canvasStore";
import { DesignerCanvas } from "./designer/DesignerCanvas";
import { AIAssistPanel, AIAssistTrigger } from "./designer/AIAssistPanel";
import { TransformButton } from "@/components/transform/TransformButton";
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
  const { runtimeUrl } = useRuntimeBoot(projectId);
  const { generatedPages, activePageId, setActivePage, clearGenerated, setPageTemplate } = useTransform();
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
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 p-4 md:p-6">
      {/* Left: pages + layers */}
      <aside className="w-full lg:w-64 shrink-0 glass-panel p-4 flex flex-col gap-4 max-h-[40vh] lg:max-h-none overflow-y-auto anim-in">
        <TransformButton source="designer" project={activeProject} className="w-full" />

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
            <button className="h-6 w-6 grid place-items-center rounded-md hover:bg-surface-2 transition"><Plus className="h-3 w-3" /></button>
          </div>
          <div className="space-y-1">
            {pages.map((p, i) => {
              const isActive = usingGenerated ? p.id === activePageId : i === 0;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (usingGenerated) {
                      setActivePage(p.id);
                      setSelected([]);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full h-8 px-2 rounded-lg text-sm transition text-left",
                    isActive
                      ? "bg-surface-2 text-foreground"
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
                  onClick={(e) => toggleSelected(el.id, e.shiftKey || e.metaKey)}
                  className={cn(
                    "flex items-center gap-1.5 w-full h-7 pl-9 pr-2 rounded-md text-xs transition",
                    active
                      ? "bg-surface-3 text-foreground shadow-[inset_0_0_15px_hsl(var(--violet)/0.2)]"
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
                className="aspect-square flex flex-col items-center justify-center gap-1 rounded-lg bg-surface-1 border border-border hover:border-violet/40 hover:bg-surface-2 transition"
              >
                <Icon className="h-3.5 w-3.5 text-foreground/80" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center: canvas / preview */}
      <div className="flex-1 min-h-[360px]">
        <PreviewFrame url={runtimeUrl} projectId={projectId ?? undefined}>
          <DesignerCanvas />
        </PreviewFrame>
      </div>

      {/* Right: properties */}
      <aside className="w-full lg:w-72 shrink-0 glass-panel p-4 max-h-[50vh] lg:max-h-none overflow-y-auto anim-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Properties</div>
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
          <div className="grid grid-cols-3 p-0.5 rounded-lg bg-surface-1 border border-border">
            {([
              { id: "mobile" as const, Icon: Smartphone },
              { id: "tablet" as const, Icon: Tablet },
              { id: "desktop" as const, Icon: Monitor },
            ]).map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => { setBreakpoint(id); toast(`Editing ${id}`); }}
                className={cn(
                  "h-8 grid place-items-center rounded-md text-xs transition capitalize",
                  breakpoint === id ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground"
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
              className="w-full h-9 px-3 rounded-lg bg-surface-1 border border-border text-sm outline-none focus:border-violet/50 transition"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Family">
              <select className="w-full h-9 px-2 rounded-lg bg-surface-1 border border-border text-sm outline-none">
                <option>Space Grotesk</option><option>Inter</option><option>Söhne</option>
              </select>
            </Field>
            <Field label="Weight">
              <select className="w-full h-9 px-2 rounded-lg bg-surface-1 border border-border text-sm outline-none">
                <option>600</option><option>700</option>
              </select>
            </Field>
          </div>
          <Field label="Size"><Slider value={56} suffix="px" /></Field>
        </Section>

        <Section icon={Palette} label="Color">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-button-lumina shadow-[0_0_18px_-2px_hsl(var(--violet)/0.7)]" />
            <input defaultValue="Lumina gradient" className="flex-1 h-9 px-3 rounded-lg bg-surface-1 border border-border text-sm outline-none" />
          </div>
          <div className="grid grid-cols-6 gap-1.5 mt-3">
            {["magenta", "violet", "electric", "cyan", "gold", "rose"].map((c) => (
              <button key={c} className="aspect-square rounded-lg border border-border hover:scale-110 transition shadow-md" style={{ background: `hsl(var(--${c}))` }} />
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
            <div className="grid grid-cols-3 p-0.5 rounded-lg bg-surface-1 border border-border">
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
      </aside>

      <AIAssistTrigger open={aiOpen} onClick={() => setAiOpen(true)} />
      <AIAssistPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}

function Section({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-t border-border first:border-t-0 first:pt-0 space-y-3">
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
    <div className="h-9 px-3 rounded-lg bg-surface-1 border border-border text-sm flex items-center justify-between">
      <span className="tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs">{suffix}</span>
    </div>
  );
}
