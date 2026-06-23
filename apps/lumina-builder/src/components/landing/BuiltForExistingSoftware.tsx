import { useReveal } from "@/hooks/use-reveal";
import { Check } from "lucide-react";

const realities = [
  "Inherited repositories",
  "Legacy systems",
  "Technical debt",
  "Broken architectures",
  "Incomplete documentation",
  "Production constraints",
];

export function BuiltForExistingSoftware() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
        <div className="glass-panel-landing rounded-3xl p-8 md:p-12">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-4">
            Built for existing software
          </p>

          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
            Most businesses do not start from a blank page.
          </h2>

          <p className="mt-6 text-muted-foreground leading-relaxed">
            They inherit repositories, internal tools, years of decisions, and systems already
            running in production. KoreLumina is designed to understand, modernize, repair,
            and evolve software companies already own.
          </p>
        </div>

        <div className="glass-panel-landing rounded-3xl p-8 md:p-12">
          <p className="text-sm font-medium tracking-tight mb-5">
            Designed for real-world codebases
          </p>

          <ul className="grid sm:grid-cols-2 gap-3">
            {realities.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
