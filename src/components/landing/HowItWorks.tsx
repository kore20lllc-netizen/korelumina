import { useReveal } from "../../hooks/use-reveal";
import { howItWorks } from "./data";
import { luminaTile } from "../../lib/luminaPalette";
import { ArrowRight } from "lucide-react";

export function HowItWorks() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">How it works</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-royal-blue royal-glow">From repo to running software, in four moves.</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {howItWorks.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="relative">
                <div className="glass-panel p-6 rounded-2xl h-full">
                  <div className={`w-11 h-11 rounded-xl grid place-items-center mb-4 ${luminaTile(i)}`}>
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Step {i + 1}</div>
                  <h3 className="text-lg font-semibold tracking-tight mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
                {i < howItWorks.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
