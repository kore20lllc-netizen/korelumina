import { Check } from "lucide-react";
import { LuminaButton } from "../lumina/LuminaButton";
import { HeroVideoFrame } from "./HeroVideoFrame";
import { trustBadges } from "./data";
import { startBuilding } from "../../services/navigationService";

export function Hero() {
  return (
    <section className="relative px-6 pt-24 pb-20 md:pt-32 md:pb-28">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-5">
            AI-Powered Software Development Platform
          </p>

          <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight leading-[0.95] mb-6">
            Build Production-Ready Apps with AI
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            Generate, edit, and deploy SaaS products, internal tools, and mobile
            apps from a single premium AI workspace.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <LuminaButton onClick={startBuilding}>
              Start Building
            </LuminaButton>
          </div>

          <ul className="flex flex-wrap gap-2 pt-4">
            {trustBadges.map((badge) => (
              <li
                key={badge}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 text-gold" />
                {badge}
              </li>
            ))}
          </ul>
        </div>

        <HeroVideoFrame />
      </div>
    </section>
  );
}
