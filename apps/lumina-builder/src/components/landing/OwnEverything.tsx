import { useReveal } from "@/hooks/use-reveal";
import { Check } from "lucide-react";

const ownership = [
  "Your repositories",
  "Your infrastructure",
  "Your deployment pipeline",
  "Your databases",
  "Your AI providers",
  "Your data",
  "Your intellectual property",
  "Your customer relationships",
];

export function OwnEverything() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="relative glass-panel-landing rounded-3xl p-8 md:p-14 overflow-hidden">
          <div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: "var(--gradient-lumina)", opacity: 0.12, filter: "blur(42px)" }}
            aria-hidden
          />

          <div className="relative grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-4">
                Ownership
              </p>

              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
                KoreLumina helps operate your software. It never owns it.
              </h2>

              <p className="mt-6 text-muted-foreground leading-relaxed">
                Build managed or bring your own stack. Connect your preferred tools.
                Keep your code, infrastructure, data, and deployment path under your control.
              </p>
            </div>

            <ul className="grid sm:grid-cols-2 gap-3">
              {ownership.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium tracking-tight">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
