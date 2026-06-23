import { useReveal } from "@/hooks/use-reveal";

export function FutureOfSoftware() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-5xl mx-auto opacity-0">
        <div className="glass-panel-landing rounded-3xl p-8 md:p-14 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-4">
            The future of software
          </p>

          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
            Software teams do not need another isolated tool.
          </h2>

          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            The next generation of software companies will be built around operating systems
            that coordinate intelligence, infrastructure, execution, governance, and people.
          </p>

          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            KoreLumina exists to become that operating system: one control plane for building,
            modernizing, deploying, and operating software.
          </p>
        </div>
      </div>
    </section>
  );
}
