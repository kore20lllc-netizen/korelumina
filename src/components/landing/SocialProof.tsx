import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useReveal } from "../../hooks/use-reveal";
import { socialMetrics } from "./data";
import { luminaTile } from "../../lib/luminaPalette";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

export function SocialProof() {
  const ref = useReveal<HTMLDivElement>();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = openIndex !== null ? socialMetrics[openIndex] : null;
  const ActiveIcon = active?.icon;
  return (
    <section className="py-16 md:py-20 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina">
            Built for serious software teams
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {socialMetrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="glass-panel p-5 rounded-2xl transition-all duration-500 ease-fluid hover:-translate-y-1 flex flex-col"
              >
                <div className={`w-10 h-10 rounded-xl grid place-items-center mb-4 ${luminaTile(i)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground mb-3">{m.label}</span>
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className="mt-auto inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors group/link"
                >
                  Learn more
                  <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover/link:translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="glass-panel border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-lg">
          {active && ActiveIcon && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center ${luminaTile(openIndex!)}`}>
                    <ActiveIcon className="w-4 h-4" />
                  </div>
                  <DialogTitle className="text-xl tracking-tight">{active.label}</DialogTitle>
                </div>
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  {active.summary}
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-3 pt-2">
                {active.details.map((d) => (
                  <li key={d} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(265 90% 65%)" }} />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}