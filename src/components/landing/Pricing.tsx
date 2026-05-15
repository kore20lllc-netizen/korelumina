import { useReveal } from "../../hooks/use-reveal";
import {
  Check,
  KeyRound,
  Sparkles,
  Gauge,
  Wallet,
  Wrench,
  Rocket,
  Layers,
  Users,
  Building2,
  Smartphone,
} from "lucide-react";
import { pricingTiers } from "./data";
import { LuminaButton } from "../lumina/LuminaButton";
import {
  startBuilding,
  contactSales,
} from "../../services/navigationService";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const providers = [
  { name: "OpenAI", glyph: "AI" },
  { name: "Anthropic", glyph: "A" },
  { name: "Google", glyph: "G" },
  { name: "xAI", glyph: "X" },
];

const icons = {
  KeyRound,
  Sparkles,
  Gauge,
  Wallet,
  Wrench,
  Rocket,
  Layers,
  Users,
  Building2,
  Smartphone,
};

function ctaFor(cta: string) {
  if (/sales|contact|talk/i.test(cta)) {
    return contactSales;
  }
  return startBuilding;
}

export function Pricing() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="pricing" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-7xl mx-auto opacity-0">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">
            Pricing
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Transparent Pricing for Every Stage
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more power, and escalate to our
            engineering team when your product requires custom implementation.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {pricingTiers.map((t) => (
            <div
              key={t.name}
              className={[
                "glass-panel rounded-3xl p-8 flex flex-col",
                t.highlighted ? "ring-2 ring-gold/40" : "",
              ].join(" ")}
            >
              <div className="mb-6">
                <h3 className="font-display text-2xl font-semibold mb-2">
                  {t.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t.body}
                </p>
                <div className="text-4xl font-semibold tracking-tight">
                  {t.price}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((feature: string) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm"
                  >
                    <Check className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <LuminaButton
                  className="w-full"
                  onClick={ctaFor(t.cta)}
                >
                  {t.cta}
                </LuminaButton>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 glass-panel rounded-3xl p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">
            AI Providers
          </p>
          <div className="flex flex-wrap gap-3">
            {providers.map((provider) => (
              <div
                key={provider.name}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"
              >
                <span className="font-semibold">{provider.glyph}</span>
                <span>{provider.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <Accordion type="single" collapsible>
            <AccordionItem value="pricing-faq">
              <AccordionTrigger>
                What is the In-House Developer Escalation Layer?
              </AccordionTrigger>
              <AccordionContent>
                A premium implementation service where KoreLumina engineers build
                advanced functionality, integrations, and production systems
                directly inside your workspace.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
