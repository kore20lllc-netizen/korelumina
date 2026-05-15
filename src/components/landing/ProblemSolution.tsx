import { AlertTriangle, Sparkles } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";

export function ProblemSolution() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 grid md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 md:p-10 rounded-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-surface-1 text-xs text-muted-foreground mb-5">
            <AlertTriangle className="w-3.5 h-3.5 text-gold" /> Today
          </div>
          <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 text-royal-blue royal-glow">AI builders stop at code.</h3>
          <p className="text-muted-foreground leading-relaxed">
            They generate components and call it done. Real software needs runtime, refactors across many files, governance, and a team that can operate it once it ships.
          </p>
        </div>
        <div className="glass-panel p-8 md:p-10 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-aurora opacity-50 pointer-events-none" aria-hidden />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-surface-1 text-xs text-muted-foreground mb-5">
              <Sparkles className="w-3.5 h-3.5 text-cyan" /> KoreLumina
            </div>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 text-royal-blue royal-glow">
              We run the whole system.
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Repo intelligence, runtime, AI orchestration, transformation, expert escalation, and enterprise hardening — one operating system from idea to production.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}