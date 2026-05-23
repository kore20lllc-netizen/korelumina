import { Check } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { HeroVideoFrame } from "./HeroVideoFrame";
import { trustBadges } from "./data";
import { startBuilding } from "@/services/navigationService";

export function Hero() {
  return (
    <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="relative glass-panel rounded-[2rem] p-6 sm:p-10 md:p-14 overflow-hidden">
          <div className="absolute inset-0 bg-aurora opacity-80 pointer-events-none" aria-hidden />
          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div className="anim-in flex flex-col gap-6">
              <span className="lumina-pill self-center inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-surface-1 tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-button-lumina" />
                <span className="eyebrow-lumina text-[12px]">
                  The operating system for AI-native software development
                </span>
              </span>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
                Import any project. Build with AI. Deploy on your terms.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
                Create, modernize, and operate production software with AI while keeping full ownership of your code, infrastructure, and data.
              </p>
              <p className="text-sm md:text-base text-muted-foreground/90 max-w-xl leading-relaxed">
                No infrastructure required. KoreLumina can provision everything for you, or connect to the tools you already use.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <LuminaButton variant="primary" size="lg" onClick={startBuilding}>Start Building</LuminaButton>
              </div>
              <ul className="flex flex-wrap gap-2 pt-4">
                {trustBadges.map((b) => (
                  <li key={b} className="lumina-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-surface-1 text-[12px] text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-cyan" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div id="demo" className="anim-in" style={{ animationDelay: "120ms" }}>
              <HeroVideoFrame />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}