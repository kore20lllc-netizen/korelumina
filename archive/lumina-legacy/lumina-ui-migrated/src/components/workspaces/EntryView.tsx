import { Globe, AppWindow, BarChart3, Brain, Github, Sparkles, Wand2, Palette, Code2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useWorkspace, type BuildIntent, type SkillMode } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { GlowCard } from "@/components/lumina/GlowCard";
import { cn } from "@/lib/utils";
import { luminaTile } from "@/lib/luminaPalette";

const intents: { id: BuildIntent; label: string; desc: string; icon: any; accent: "violet" | "magenta" | "cyan" | "gold" }[] = [
  { id: "website", label: "Website", desc: "Marketing, portfolio, brand sites", icon: Globe, accent: "magenta" },
  { id: "webapp", label: "Web App", desc: "SaaS, internal tools, products", icon: AppWindow, accent: "violet" },
  { id: "dashboard", label: "Dashboard", desc: "Analytics, ops, control center", icon: BarChart3, accent: "cyan" },
  { id: "ai-tool", label: "AI Tool", desc: "Agents, copilots, generators", icon: Brain, accent: "gold" },
  { id: "import", label: "Continue", desc: "Import from GitHub", icon: Github, accent: "violet" },
];

const modes: { id: SkillMode; label: string; desc: string; icon: any; tag: string }[] = [
  { id: "ai", label: "AI Mode", desc: "Describe it. We build it.", icon: Wand2, tag: "Non-tech" },
  { id: "designer", label: "Designer Mode", desc: "Visual canvas, sections, styles.", icon: Palette, tag: "Visual" },
  { id: "developer", label: "Developer Mode", desc: "Files, code, full control.", icon: Code2, tag: "Code" },
];

export function EntryView() {
  const { setView, setIntent, setMode, mode } = useWorkspace();
  const [pickedIntent, setPickedIntent] = useState<BuildIntent | null>(null);
  const [pickedMode, setPickedMode] = useState<SkillMode>(mode);

  const handleStart = () => {
    if (!pickedIntent) return;
    setIntent(pickedIntent);
    setMode(pickedMode);
    setView("workspace");
  };

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

        {/* Intent grid */}
        <section className="mt-16 anim-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-baseline justify-between mb-5 px-1">
            <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">01 · Build intent</h2>
            <span className="text-[11px] text-muted-foreground/50">Pick one</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
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
    </div>
  );
}
