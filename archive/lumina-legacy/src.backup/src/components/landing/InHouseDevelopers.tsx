import { useReveal } from "@/hooks/use-reveal";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { contactSales } from "@/services/navigationService";
import { Layers, Wrench, ShieldCheck, Rocket, Sparkles, Check } from "lucide-react";

const highlights = [
  { icon: Layers, title: "Full architecture review" },
  { icon: Wrench, title: "Dependency and build troubleshooting" },
  { icon: ShieldCheck, title: "Security and environment analysis" },
  { icon: Rocket, title: "Guided modernization" },
  { icon: Sparkles, title: "White-glove engineering support" },
];

export function InHouseDevelopers() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="in-house-developers" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="relative glass-panel-landing rounded-3xl p-8 md:p-14">
          <div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: "var(--gradient-lumina)", opacity: 0.12, filter: "blur(40px)" }}
            aria-hidden
          />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">In-House Developers</p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
                When AI Hits a Wall, Our In-House Developers Take Over
              </h2>
              <p className="text-muted-foreground leading-relaxed mt-5">
                Every Business and Enterprise plan includes access to senior engineers who use KoreLumina's internal tools
                to audit, repair, and modernize your codebase.
              </p>
              <p className="mt-5 text-sm text-gold eyebrow-lumina tracking-[0.18em] uppercase">
                AI-first when possible. Senior engineers when needed.
              </p>
              <div className="mt-7">
                <LuminaButton variant="primary" size="lg" onClick={contactSales}>
                  Talk to Our Team
                </LuminaButton>
              </div>
            </div>
            <ul className="grid sm:grid-cols-2 gap-3">
              {highlights.map(({ icon: Icon, title }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--gradient-lumina)" }}
                  >
                    <Icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium tracking-tight">{title}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}