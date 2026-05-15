import { useReveal } from "../../hooks/use-reveal";
import { LuminaButton } from "../lumina/LuminaButton";
import { startBuilding, contactSales } from "../../services/navigationService";

export function FinalCTA() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="relative glass-panel rounded-[2rem] p-10 md:p-16 overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-violet/10 via-transparent to-gold/10 pointer-events-none" />

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">
              Ready to Build
            </p>

            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
              Build Production-Ready Software Faster
            </h2>

            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Launch SaaS platforms, internal tools, mobile apps, and AI products
              with KoreLumina.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <LuminaButton onClick={startBuilding}>
                Start Building
              </LuminaButton>

              <LuminaButton onClick={contactSales}>
                Talk to Sales
              </LuminaButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
