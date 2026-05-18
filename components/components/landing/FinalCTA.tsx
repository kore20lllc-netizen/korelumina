import { useReveal } from "@/hooks/use-reveal";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { startBuilding, contactSales } from "@/services/navigationService";

export function FinalCTA() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="relative glass-panel rounded-[2rem] p-10 md:p-16 overflow-hidden text-center">
          <div className="absolute inset-0 bg-aurora opacity-90 pointer-events-none" aria-hidden />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-royal-blue royal-glow">
              Start building with KoreLumina.
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
              Bring a repo, an idea, or a blank page. Ship production software with the operating system designed for AI-native teams.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <LuminaButton variant="primary" size="lg" onClick={startBuilding}>Start Building</LuminaButton>
              <LuminaButton variant="outline" size="lg" onClick={contactSales}>Talk to Sales</LuminaButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
