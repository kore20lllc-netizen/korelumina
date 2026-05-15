import { useMemo, useState } from "react";
import { useReveal } from "../../hooks/use-reveal";
import { architectureSystems, enterpriseLayer } from "./data";
import { luminaTile } from "../../lib/luminaPalette";
import { Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

const CATEGORIES = ["All", "Security", "Compliance", "Collaboration", "Infrastructure"] as const;
type Category = (typeof CATEGORIES)[number];

export function PlatformArchitecture() {
  const ref = useReveal<HTMLDivElement>();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? enterpriseLayer
        : enterpriseLayer.filter((p) => p.category === activeCategory),
    [activeCategory],
  );
  const counts = useMemo(() => {
    const map: Record<string, number> = { All: enterpriseLayer.length };
    for (const p of enterpriseLayer) map[p.category] = (map[p.category] ?? 0) + 1;
    return map;
  }, []);
  return (
    <section id="architecture" className="py-24 md:py-32 px-6 relative">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Platform architecture</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5 text-royal-blue royal-glow">
            Six systems. One software operating system.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            From repository intelligence to live runtime orchestration, every layer works together to turn ideas and existing codebases into production software.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {architectureSystems.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="glass-panel p-6 rounded-2xl group transition-all duration-500 ease-fluid hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl grid place-items-center mb-5 ${luminaTile(i)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-16">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Enterprise layer</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-royal-blue royal-glow">
              Built for teams that ship at scale
            </h3>
          </div>
          <div
            role="tablist"
            aria-label="Enterprise category filters"
            className="flex flex-wrap items-center justify-center gap-2 mb-8"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "relative inline-flex items-center gap-2 h-8 px-3.5 rounded-full text-[12px] font-medium tracking-tight transition-all duration-300 ease-fluid",
                    isActive
                      ? "text-white bg-brand ring-1 ring-white/20 shadow-[0_4px_16px_-6px_hsl(255_90%_65%/0.55)]"
                      : "text-muted-foreground hover:text-foreground bg-surface-1 border border-border hover:border-white/15",
                  )}
                >
                  {cat}
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full",
                      isActive ? "bg-white/15 text-white" : "bg-surface-2 text-muted-foreground/80",
                    )}
                  >
                    {counts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                No items in this category yet.
              </div>
            )}
            {filtered.map((p, i) => {
              const Icon = p.icon;
              const tile = luminaTile(i);
              return (
                <div
                  key={p.label}
                  className="relative glass-panel p-5 rounded-2xl group transition-all duration-500 ease-fluid hover:-translate-y-1 overflow-hidden focus-within:-translate-y-1"
                  tabIndex={0}
                >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${tile}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] font-semibold tracking-tight mb-1">{p.label}</h4>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                  <div
                    role="tooltip"
                    className={
                      "pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-background/85 backdrop-blur-xl px-3 py-2 " +
                      "flex items-start gap-2 opacity-0 translate-y-2 transition-all duration-300 ease-fluid " +
                      "group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 " +
                      "shadow-[0_8px_28px_-12px_hsl(255_90%_65%/0.45)]"
                    }
                  >
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-brand-gradient" style={{ color: "hsl(265 90% 65%)" }} />
                    <span className="text-[11px] leading-snug text-foreground/90">{p.benefit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
