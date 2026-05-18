import { useState } from "react";
import { Check, Sparkles, Zap, ShieldCheck, Globe2, ArrowRight, Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { luminaTile } from "@/lib/luminaPalette";
import { cn } from "@/lib/utils";

const features = [
  { icon: Zap, title: "Ship in days", body: "Production-ready scaffolding with auth, payments, and design tokens wired in." },
  { icon: ShieldCheck, title: "Secure by default", body: "RLS, role-based access, and audit trails baked into every primitive." },
  { icon: Globe2, title: "Deploy anywhere", body: "Bring your own cloud — FolderGit2, Vercel, AWS, or a private VPC." },
];

const tiers = [
  { name: "Starter", monthly: 0, annual: 0, body: "For solo builders kicking the tires.", features: ["1 project", "Community support", "Core primitives"] },
  { name: "Pro", monthly: 29, annual: 24, body: "For teams shipping production software.", features: ["Unlimited projects", "Priority support", "Advanced analytics", "Team workspaces"], highlight: true },
  { name: "Scale", monthly: 99, annual: 84, body: "For organizations operating at scale.", features: ["SSO + SCIM", "Dedicated engineer", "BYO infrastructure", "Audit log export"] },
];

const faqs = [
  { q: "Can I bring my own infrastructure?", a: "Yes — Aurora is framework-agnostic. Connect any cloud, database, or auth provider you already trust." },
  { q: "Do you offer a free trial?", a: "The Starter tier is free forever. Pro and Scale include a 14-day trial with no credit card required." },
  { q: "How is billing handled?", a: "Monthly or annual via Stripe Billing. Annual plans save 17% and can be paid by invoice on Scale." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from the billing portal in one click. Your data stays available for 30 days after cancellation." },
];

export function AuroraMarketing() {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="relative">
      {/* Announcement bar */}
      <div className="border-b border-white/5 bg-surface-1/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-9 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Sparkles className="w-3 h-3" style={{ color: "hsl(265 90% 65%)" }} />
          <span>Aurora 2.0 is live — multi-region edge, faster cold starts</span>
          <a href="#features" className="text-foreground hover:underline">Read more →</a>
        </div>
      </div>

      {/* Hero */}
      <section className="px-4 md:px-8 pt-20 pb-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-surface-1 text-[11px] text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3" /> The SaaS marketing starter
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            The fastest way to launch{" "}
            <span className="text-gradient-lumina">your next product.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl mx-auto">
            Aurora gives you a production-grade marketing site, pricing page, and blog —
            wired together with the design tokens your product already ships with.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button className="h-10 px-5 rounded-lg bg-button-lumina text-primary-foreground text-[13px] font-medium shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition">
              Start free
            </button>
            <button className="h-10 px-5 rounded-lg border border-white/15 bg-transparent text-[13px] font-medium hover:bg-white/[0.04] transition">
              Book a demo
            </button>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section className="px-4 md:px-8 pb-16">
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-5">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 opacity-70">
          {["Northwind", "Acme", "Helix Co.", "Pulse", "Nimbus", "Lumen"].map((n) => (
            <span key={n} className="text-sm font-semibold tracking-tight text-muted-foreground">
              {n}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 md:px-8 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Built for serious teams.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-panel p-6 rounded-2xl">
                  <div className={`w-10 h-10 rounded-xl grid place-items-center mb-4 ${luminaTile(i)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold tracking-tight mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 md:px-8 py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">Simple, predictable pricing.</h2>
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-surface-1">
              {(["Monthly", "Annual"] as const).map((label, i) => {
                const isActive = (i === 1) === annual;
                return (
                  <button
                    key={label}
                    onClick={() => setAnnual(i === 1)}
                    className={cn(
                      "h-7 px-3 rounded-full text-[12px] font-medium transition",
                      isActive ? "bg-surface-3 text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {label}
                    {i === 1 && <span className="ml-1.5 text-[10px] text-muted-foreground/80">-17%</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={cn(
                  "glass-panel p-6 rounded-2xl flex flex-col",
                  t.highlight && "ring-1 ring-white/15 shadow-[0_18px_44px_-18px_hsl(265_90%_65%/0.55)]",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold tracking-tight">{t.name}</h3>
                  {t.highlight && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-foreground">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-semibold tracking-tight">
                    ${annual ? t.annual : t.monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t.body}</p>
                <ul className="space-y-2 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(265 90% 65%)" }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={cn(
                    "mt-auto h-9 rounded-lg text-[13px] font-medium transition",
                    t.highlight
                      ? "bg-button-lumina text-primary-foreground shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06]"
                      : "border border-white/15 hover:bg-white/[0.04]",
                  )}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-4 md:px-8 py-20 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-0.5 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" style={{ color: "hsl(45 90% 60%)" }} />
            ))}
          </div>
          <p className="text-xl md:text-2xl font-medium tracking-tight leading-relaxed mb-5">
            “Aurora replaced our entire marketing stack in a weekend. Hero, pricing, blog — everything just works.”
          </p>
          <p className="text-sm text-muted-foreground">Mia Chen — Head of Growth, Nimbus</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 md:px-8 py-20 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Frequently asked.</h2>
          </div>
          <Accordion type="single" collapsible className="glass-panel rounded-2xl px-2">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-white/5">
                <AccordionTrigger className="px-3 text-left text-sm font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="px-3 text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 md:px-8 py-20 border-t border-white/5">
        <div className="max-w-3xl mx-auto glass-panel rounded-3xl p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            Ready to launch?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Fork Aurora and ship your marketing site today. No credit card required.
          </p>
          <button className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-button-lumina text-primary-foreground text-[13px] font-medium shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition">
            Start free <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}