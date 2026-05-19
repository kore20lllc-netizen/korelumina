import { useState } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { Check, KeyRound, Sparkles, Gauge, Wallet, Wrench, Rocket, Layers, Users, Building2, Smartphone, ScanLine, ShieldCheck, Wand2 } from "lucide-react";
import { pricingTiers, transformAddOn, featureComparison, finalPricingCta } from "./data";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { startBuilding, contactSales } from "@/services/navigationService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const providers = [
  { name: "OpenAI", glyph: "AI" },
  { name: "Anthropic", glyph: "A" },
  { name: "Google AI", glyph: "G" },
];

const usageCards = [
  { icon: Sparkles, title: "Included Credits", body: "Each paid plan includes monthly AI credits." },
  { icon: Gauge, title: "Usage-Based Overage", body: "Additional AI usage is billed transparently." },
  { icon: KeyRound, title: "BYO API Keys", body: "Use your own keys and avoid token charges from KoreLumina." },
];

const escalationServices = [
  { icon: Wrench, title: "Quick Fix", price: "Starting at $500" },
  { icon: Rocket, title: "Feature Sprint", price: "Starting at $2,500" },
  { icon: Layers, title: "Modernization Project", price: "Starting at $10,000" },
  { icon: Users, title: "Dedicated Development", price: "Starting at $7,500/month" },
  { icon: Building2, title: "Enterprise Transformation", price: "Custom Quote" },
  {
    icon: ScanLine,
    title: "AI Repo Audit",
    price: "Starting at $500",
    description:
      "Comprehensive technical audit of any codebase with a repair roadmap and engineering estimate.",
    badge: "REPO AUDIT ENGINE",
  },
  {
    icon: ShieldCheck,
    title: "White-Glove Repair Sprint",
    price: "Starting at $2,500",
    description:
      "Our team implements the repair plan and delivers a production-ready application.",
    badge: "ENGINEER-LED",
  },
  {
    icon: Smartphone,
    title: "Mobile App Packaging",
    price: "Starting at $2,500",
    description: "Convert your KoreLumina web app into production-ready iOS and Android applications using Capacitor. Includes native project setup, app icons, splash screens, and store-ready builds.",
    badge: "APP STORE + PLAY STORE",
    hoverDetails: [
      "iOS + Android builds",
      "Capacitor integration",
      "Native plugin setup",
      "App icons & splash screens",
      "Store-ready packages",
    ],
  },
];

const pricingFaq = [
  { q: "What happens when I exceed my AI credits?", a: "Additional usage is billed automatically based on actual model consumption." },
  { q: "Can I use my own API keys?", a: "Yes. Connect OpenAI, Anthropic, or Google AI keys and pay providers directly." },
  { q: "Do I still pay for KoreLumina if I use my own keys?", a: "Yes. Your subscription covers access to the KoreLumina platform and orchestration engine." },
  { q: "What is the In-House Developer Escalation Layer?", a: "A premium service where our engineering team implements complex requirements for you." },
  { q: "What happens after my 5 free executions?", a: "Upgrade to Pro to unlock unlimited AI building and advanced features." },
  { q: "Can I use my own Supabase and GitHub?", a: "Yes, Pro and above let you connect your own infrastructure." },
  { q: "Can I import an existing app and turn it into a website?", a: "Yes, Pro and above include repository import and Transform App → Website." },
  { q: "Does Free include full browser preview?", a: "No. Free users can preview inside KoreLumina only. Full browser preview is available on Pro and above." },
  { q: "Can I remove KoreLumina branding?", a: "Yes, on Pro and higher." },
  { q: "Do you offer custom enterprise deployments?", a: "Yes, Enterprise includes private cloud and custom integrations." },
  { q: "Do I need Pro to use Transform App → Website?", a: "No. Free users can unlock this feature for a one-time payment of $49 for one project." },
  { q: "What does the $49 purchase include?", a: "One complete transformation of an imported application into a production-ready website." },
  { q: "When should I upgrade to Pro?", a: "Upgrade to Pro if you plan to transform multiple projects or want unlimited access to advanced features." },
];

function ctaFor(cta: string) {
  return cta === "Talk to Sales" ? contactSales : startBuilding;
}

export function Pricing() {
  const ref = useReveal<HTMLDivElement>();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  return (
    <section id="pricing" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0 space-y-20 md:space-y-28">
        {/* Plans */}
        <div>
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
              Simple plans. Real software ownership.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Build with AI, own your stack, and scale on your terms.
            </p>
            <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-surface-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-4 h-8 rounded-full text-[12px] transition",
                  billing === "monthly"
                    ? "bg-surface-3 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={cn(
                  "px-4 h-8 rounded-full text-[12px] inline-flex items-center gap-2 transition",
                  billing === "yearly"
                    ? "bg-surface-3 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Yearly
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide text-primary-foreground bg-button-lumina">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricingTiers.map((t) => {
              const price = billing === "yearly" ? t.yearlyPrice : t.price;
              const cadence = billing === "yearly" ? t.yearlyCadence : t.cadence;
              const note = billing === "yearly" ? t.yearlyNote : "";
              const tier = t as typeof t & { badge?: string; addOnLine?: string; footnote?: string };
              return (
              <div key={t.name} className="relative flex">
                {t.highlighted && (
                  <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-primary-foreground bg-button-lumina shadow-[var(--glow-violet)]">
                    Most Popular
                  </span>
                )}
                <div
                  className={`group relative glass-panel-landing p-8 rounded-2xl flex flex-col flex-1 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 ${t.highlighted ? "border-white/20" : ""}`}
                >
                {t.highlighted && (
                  <div
                    className="absolute -inset-px rounded-2xl pointer-events-none"
                    style={{ background: "var(--gradient-lumina)", opacity: 0.18, filter: "blur(20px)" }}
                    aria-hidden
                  />
                )}
                {!t.highlighted && tier.badge && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide text-gold border border-gold/30 bg-gold/[0.06]">
                    {tier.badge}
                  </span>
                )}
                <div className="relative flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold tracking-tight mb-2">{t.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-semibold tracking-tight">{price}</span>
                    {cadence && <span className="text-muted-foreground ml-1 text-sm">{cadence}</span>}
                  </div>
                  {note && (
                    <div className="text-[11px] text-gold mb-2">{note}</div>
                  )}
                  <p className="text-sm text-muted-foreground mb-6">{t.body}</p>
                  <ul className="flex flex-col gap-2.5 mb-8">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                    {tier.addOnLine && (
                      <li className="flex items-start gap-2 text-sm text-gold">
                        <Sparkles className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                        <span>{tier.addOnLine}</span>
                      </li>
                    )}
                  </ul>
                  <div className="mt-auto">
                    <LuminaButton
                      variant={t.highlighted ? "primary" : "outline"}
                      size="lg"
                      className="w-full"
                      onClick={ctaFor(t.cta)}
                    >
                      {t.cta}
                    </LuminaButton>
                    {tier.footnote && (
                      <p className="mt-3 text-[11px] text-muted-foreground/80 leading-relaxed">
                        {tier.footnote}
                      </p>
                    )}
                  </div>
                </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Transform App → Website one-time add-on */}
          <div className="relative glass-panel-landing rounded-3xl p-8 md:p-10 mt-8">
            <div
              className="absolute -inset-px rounded-3xl pointer-events-none"
              style={{ background: "var(--gradient-lumina)", opacity: 0.14, filter: "blur(40px)" }}
              aria-hidden
            />
            <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide text-gold border border-gold/40 bg-gold/[0.08]">
              One-time add-on · Free users
            </span>
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--gradient-lumina)" }}
                  >
                    <Wand2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina">Add-On</p>
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-gradient-royal-gold">
                  {transformAddOn.title}
                </h3>
                <p className="text-sm text-foreground/85 mt-2">{transformAddOn.subtitle}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {transformAddOn.description}
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-gold">{transformAddOn.price}</span>
                  <span className="text-sm text-muted-foreground">{transformAddOn.cadence}</span>
                </div>
                <div className="mt-5">
                  {/* TODO: wire to Stripe one-time checkout once Lovable Payments is enabled */}
                  <LuminaButton variant="primary" size="lg" onClick={startBuilding}>
                    {transformAddOn.cta}
                  </LuminaButton>
                  <p className="mt-3 text-[11px] text-muted-foreground/80">{transformAddOn.note}</p>
                </div>
              </div>
              <ul className="grid sm:grid-cols-1 gap-2.5">
                {transformAddOn.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Matrix */}
        <div>
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Feature Matrix</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
              What's included by plan
            </h3>
          </div>
          <div className="glass-panel-landing rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-5 py-4 font-medium text-muted-foreground">Feature</th>
                    <th className="px-5 py-4 font-medium text-foreground text-center">Free</th>
                    <th className="px-5 py-4 font-medium text-foreground text-center">Pro</th>
                    <th className="px-5 py-4 font-medium text-foreground text-center">Business</th>
                    <th className="px-5 py-4 font-medium text-foreground text-center">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((row) => (
                    <tr key={row.feature} className="border-b border-white/5 last:border-b-0">
                      <td className="px-5 py-4 text-foreground whitespace-nowrap">{row.feature}</td>
                      {[row.free, row.pro, row.biz, row.ent].map((v, i) => (
                        <td key={i} className="px-5 py-4 text-center">
                          {v === true ? (
                            <Check className="w-4 h-4 text-cyan inline-block" aria-label="Included" />
                          ) : v === false ? (
                            <span className="text-muted-foreground/50" aria-label="Not included">—</span>
                          ) : (
                            <span className="text-gold font-medium">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* BYO API Keys */}
        <div className="relative glass-panel-landing rounded-3xl p-8 md:p-12">
          <div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: "var(--gradient-lumina)", opacity: 0.1, filter: "blur(40px)" }}
            aria-hidden
          />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-center mb-3">
                <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina">BYO API Keys</p>
              </div>
              <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-gradient-royal-gold">Bring Your Own API Keys</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Connect your own OpenAI, Anthropic, or Google API keys and pay model providers directly while continuing to use all KoreLumina platform features.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2.5">
                {[
                  "Full cost transparency",
                  "No token markup",
                  "Use your preferred models",
                  "Enterprise-friendly billing",
                  "Optional cost savings",
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina">Supported providers</p>
              </div>
              <div className="grid gap-3">
                {providers.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-all hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold text-primary-foreground"
                      style={{ background: "var(--gradient-lumina)" }}
                    >
                      {p.glyph}
                    </div>
                    <div className="font-medium tracking-tight">{p.name}</div>
                    <KeyRound className="ml-auto w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Usage Billing */}
        <div>
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">AI Usage</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 text-gradient-royal-gold">Transparent AI Usage Billing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every paid plan includes AI credits. When credits are exhausted, additional usage is billed automatically based on actual model consumption. BYO API key users pay providers directly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {usageCards.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="glass-panel-landing rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gradient-lumina)" }}
                >
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-semibold tracking-tight mb-1.5">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* In-House Developer Escalation */}
        <div>
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">In-House Developer Escalation</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-3 text-gradient-royal-gold">
              AI when you want speed. Experts when you need certainty.
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Escalate your project to KoreLumina's in-house engineering team for custom development, integrations, modernization, and enterprise delivery.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {escalationServices.map(({ icon: Icon, title, price, description, badge, hoverDetails }) => (
              <div
                key={title}
                className="group glass-panel-landing rounded-2xl p-6 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--gradient-lumina)" }}
                >
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h4 className="font-semibold tracking-tight">{title}</h4>
                {badge && (
                  <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide text-primary-foreground bg-button-lumina border border-white/10 w-fit">
                    {badge}
                  </span>
                )}
                <p className="text-sm text-muted-foreground mt-1">{price}</p>
                {description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{description}</p>
                )}
                {hoverDetails && (
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ul className="space-y-1">
                      {hoverDetails.map((d) => (
                        <li key={d} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="w-1 h-1 rounded-full bg-cyan mt-1.5 flex-shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <LuminaButton variant="primary" size="lg" onClick={contactSales}>
              Book a Consultation
            </LuminaButton>
            <LuminaButton variant="outline" size="lg" onClick={contactSales}>
              Request a Custom Quote
            </LuminaButton>
          </div>
        </div>

        {/* Pricing FAQ */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Pricing FAQ</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">Common questions</h3>
          </div>
          <div className="glass-panel-landing rounded-2xl px-2 sm:px-6">
            <Accordion type="single" collapsible className="w-full">
              {pricingFaq.map((f, i) => (
                <AccordionItem key={f.q} value={`pf-${i}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-foreground hover:text-foreground hover:no-underline py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Final pricing CTA */}
        <div className="relative glass-panel-landing rounded-3xl p-10 md:p-14 text-center">
          <div
            className="absolute -inset-px rounded-3xl pointer-events-none"
            style={{ background: "var(--gradient-lumina)", opacity: 0.15, filter: "blur(40px)" }}
            aria-hidden
          />
          <div className="relative">
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-gradient-royal-gold">
              {finalPricingCta.headline}
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              {finalPricingCta.subheadline}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <LuminaButton variant="primary" size="lg" onClick={startBuilding}>
                {finalPricingCta.primary}
              </LuminaButton>
              <LuminaButton variant="outline" size="lg" onClick={contactSales}>
                {finalPricingCta.secondary}
              </LuminaButton>
            </div>
          </div>
        </div>
      </div>
      {/* SEO: pricing schema */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "KoreLumina",
            description: "AI-native platform to build, own, and scale production software.",
            offers: pricingTiers.map((t) => ({
              "@type": "Offer",
              name: t.name,
              price: t.price.replace(/[^0-9.]/g, "") || "0",
              priceCurrency: "USD",
              category: t.name,
              description: t.body,
            })),
          }),
        }}
      />
    </section>
  );
}
