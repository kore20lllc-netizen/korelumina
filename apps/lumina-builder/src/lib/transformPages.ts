import type { CanvasElement } from "@/components/workspaces/designer/canvasStore";
import type { TransformMode } from "@/context/TransformContext";

export type PageKind = "home" | "pricing" | "features" | "contact";

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  build: (ctx: { brand: string; mode: TransformMode }) => CanvasElement[];
}

export interface GeneratedPage {
  id: string;
  name: string;
  route: string;
  kind: PageKind;
  templateId: string;
  sections: CanvasElement[];
}

let n = 0;
const uid = (k: string) => `${k}-${(++n).toString(36)}`;
const resetIds = () => { n = 0; };

/* ---------- Reusable section builders ----------------------------------- */

function hero(eyebrow: string, headline: string, sub: string, cta: string, secondary = "See live demo"): CanvasElement[] {
  return [
    { id: uid("badge"), kind: "badge",    label: "Hero · Eyebrow",     x: 260, y: 60,  w: 220, h: 32,  text: eyebrow,  accent: "gold" },
    { id: uid("head"),  kind: "headline", label: "Hero · Headline",    x: 80,  y: 110, w: 600, h: 120, text: headline, accent: "violet" },
    { id: uid("sub"),   kind: "subhead",  label: "Hero · Subheadline", x: 160, y: 250, w: 440, h: 60,  text: sub,      accent: "violet" },
    { id: uid("cta"),   kind: "button",   label: "Hero · Primary CTA", x: 240, y: 330, w: 160, h: 46,  text: cta,      accent: "magenta" },
    { id: uid("cta"),   kind: "button",   label: "Hero · Secondary",   x: 420, y: 330, w: 140, h: 46,  text: secondary,accent: "violet" },
  ];
}

function splitHero(eyebrow: string, headline: string, sub: string, cta: string): CanvasElement[] {
  return [
    { id: uid("badge"), kind: "badge",    label: "Split · Eyebrow",  x: 60,  y: 80,  w: 200, h: 32,  text: eyebrow,  accent: "cyan" },
    { id: uid("head"),  kind: "headline", label: "Split · Headline", x: 60,  y: 120, w: 380, h: 140, text: headline, accent: "violet" },
    { id: uid("sub"),   kind: "subhead",  label: "Split · Sub",      x: 60,  y: 280, w: 380, h: 70,  text: sub,      accent: "violet" },
    { id: uid("cta"),   kind: "button",   label: "Split · CTA",      x: 60,  y: 370, w: 170, h: 46,  text: cta,      accent: "magenta" },
    { id: uid("image"), kind: "image",    label: "Split · Visual",   x: 480, y: 80,  w: 320, h: 340, accent: "gold" },
  ];
}

function centeredHero(eyebrow: string, headline: string, sub: string, cta: string): CanvasElement[] {
  return [
    { id: uid("badge"), kind: "badge",    label: "Centered · Eyebrow",  x: 320, y: 60,  w: 200, h: 32,  text: eyebrow,  accent: "gold" },
    { id: uid("head"),  kind: "headline", label: "Centered · Headline", x: 100, y: 120, w: 640, h: 140, text: headline, accent: "violet" },
    { id: uid("sub"),   kind: "subhead",  label: "Centered · Sub",      x: 220, y: 280, w: 400, h: 60,  text: sub,      accent: "violet" },
    { id: uid("cta"),   kind: "button",   label: "Centered · CTA",      x: 340, y: 360, w: 180, h: 48,  text: cta,      accent: "magenta" },
  ];
}

function featureGrid(labels: string[], yStart = 460): CanvasElement[] {
  const accents: CanvasElement["accent"][] = ["cyan", "magenta", "gold", "violet"];
  return labels.slice(0, 4).map((label, i) => ({
    id: uid("card"),
    kind: "card",
    label: `Feature · ${label}`,
    x: 80 + (i % 2) * 320,
    y: yStart + Math.floor(i / 2) * 160,
    w: 280, h: 140,
    text: label,
    accent: accents[i % accents.length],
  }));
}

function featureAlternating(labels: string[]): CanvasElement[] {
  const out: CanvasElement[] = [];
  labels.slice(0, 3).forEach((label, i) => {
    const leftImage = i % 2 === 0;
    const yBase = 460 + i * 220;
    out.push(
      { id: uid("image"), kind: "image",   label: `Alt · ${label} visual`, x: leftImage ? 80 : 440, y: yBase, w: 300, h: 180, accent: "cyan" },
      { id: uid("head"),  kind: "subhead", label: `Alt · ${label} title`,  x: leftImage ? 420 : 80, y: yBase + 20, w: 320, h: 50, text: label, accent: "violet" },
      { id: uid("sub"),   kind: "subhead", label: `Alt · ${label} copy`,   x: leftImage ? 420 : 80, y: yBase + 80, w: 320, h: 80, text: "Composable, brand-tokenised, ready to ship.", accent: "violet" },
    );
  });
  return out;
}

function featureBento(labels: string[]): CanvasElement[] {
  const sizes = [
    { w: 380, h: 220 }, { w: 220, h: 220 },
    { w: 220, h: 220 }, { w: 380, h: 220 },
  ];
  const accents: CanvasElement["accent"][] = ["gold", "cyan", "violet", "magenta"];
  let x = 80, y = 460;
  return labels.slice(0, 4).map((label, i) => {
    const cell = { id: uid("card"), kind: "card" as const, label: `Bento · ${label}`, x, y, w: sizes[i].w, h: sizes[i].h, text: label, accent: accents[i] };
    if (i === 0) { x += sizes[i].w + 20; }
    else if (i === 1) { x = 80; y += sizes[i].h + 20; }
    else if (i === 2) { x += sizes[i].w + 20; }
    return cell;
  });
}

function pricingTiers(): CanvasElement[] {
  const tiers = [
    { name: "Starter", price: "$0 · forever",  accent: "cyan" as const,    cta: "Choose" },
    { name: "Pro",     price: "$24 · monthly", accent: "gold" as const,    cta: "Start Pro" },
    { name: "Team",    price: "$96 · monthly", accent: "magenta" as const, cta: "Choose" },
  ];
  const out: CanvasElement[] = [];
  tiers.forEach((t, i) => {
    out.push(
      { id: uid("card"), kind: "card",    label: `Plan · ${t.name}`,       x: 60 + i * 240, y: 460, w: 220, h: 220, text: t.name,  accent: t.accent },
      { id: uid("sub"),  kind: "subhead", label: `Plan · ${t.name} price`, x: 60 + i * 240, y: 640, w: 220, h: 40,  text: t.price, accent: t.accent },
      { id: uid("cta"),  kind: "button",  label: `Plan · ${t.name} CTA`,   x: 100 + i * 240, y: 700, w: 140, h: 42, text: t.cta,   accent: t.name === "Pro" ? "magenta" : "violet" },
    );
  });
  return out;
}

function pricingCompare(): CanvasElement[] {
  return [
    { id: uid("badge"), kind: "badge",    label: "Compare · Toggle",    x: 320, y: 380, w: 200, h: 36, text: "Monthly · Annual", accent: "violet" },
    { id: uid("card"),  kind: "card",     label: "Compare · Table",     x: 60,  y: 440, w: 720, h: 280, text: "Feature comparison", accent: "cyan" },
    { id: uid("cta"),   kind: "button",   label: "Compare · CTA",       x: 340, y: 740, w: 180, h: 48,  text: "Start free", accent: "magenta" },
  ];
}

function pricingSingleHighlight(): CanvasElement[] {
  return [
    { id: uid("card"),  kind: "card",     label: "Highlight · Plan",     x: 220, y: 440, w: 420, h: 280, text: "Pro · $24 / mo",  accent: "gold" },
    { id: uid("sub"),   kind: "subhead",  label: "Highlight · Includes", x: 220, y: 740, w: 420, h: 60,  text: "Everything in Starter + premium support, SSO, analytics.", accent: "violet" },
    { id: uid("cta"),   kind: "button",   label: "Highlight · CTA",      x: 340, y: 820, w: 180, h: 48,  text: "Start Pro",       accent: "magenta" },
  ];
}

function contactForm(): CanvasElement[] {
  return [
    { id: uid("card"),  kind: "card",   label: "Contact · Form",   x: 200, y: 440, w: 460, h: 320, text: "Name · Email · Message", accent: "violet" },
    { id: uid("cta"),   kind: "button", label: "Contact · Submit", x: 340, y: 780, w: 180, h: 48,  text: "Send message", accent: "magenta" },
  ];
}

function contactSplit(): CanvasElement[] {
  return [
    { id: uid("card"),  kind: "card",    label: "Contact · Form",    x: 80,  y: 440, w: 380, h: 320, text: "Name · Email · Message", accent: "violet" },
    { id: uid("card"),  kind: "card",    label: "Contact · Office",  x: 480, y: 440, w: 300, h: 150, text: "Our HQ · San Francisco", accent: "cyan" },
    { id: uid("card"),  kind: "card",    label: "Contact · Support", x: 480, y: 610, w: 300, h: 150, text: "Support · 1 business day", accent: "gold" },
  ];
}

function ctaBand(headline: string, cta: string, y = 820): CanvasElement[] {
  return [
    { id: uid("head"), kind: "headline", label: "CTA · Headline", x: 120, y,         w: 520, h: 80, text: headline, accent: "gold" },
    { id: uid("cta"),  kind: "button",   label: "CTA · Primary",  x: 300, y: y + 100, w: 180, h: 48, text: cta,     accent: "magenta" },
  ];
}

/* ---------- Template registry ------------------------------------------- */

export const TEMPLATES: Record<PageKind, PageTemplate[]> = {
  home: [
    {
      id: "home-editorial",
      name: "Editorial",
      description: "Magazine-style hero, four-feature grid, gold CTA band.",
      build: ({ brand, mode }) => [
        ...hero(`${brand} · ${mode === "rebrand" ? "Rebrand" : "Premium"}`,
          "The product your team already loves — now with a website that sells it.",
          "Editorial design, scroll-linked motion and SEO-ready routes, composed from your existing app.",
          "Get a demo"),
        ...featureGrid(["Realtime dashboards", "AI insights", "Role-based access", "Workflow automations"]),
        ...ctaBand("Ready to launch a website your brand deserves?", "Start the rebrand"),
      ],
    },
    {
      id: "home-split",
      name: "Split Hero",
      description: "Left copy / right visual, bento feature grid.",
      build: ({ brand }) => [
        ...splitHero(`${brand} · Live`, "Operate your product. Sell it just as well.", "A premium marketing site composed from your real app — no rewrites.", "Book a walkthrough"),
        ...featureBento(["Composable hero", "Edge SEO", "Brand tokens", "Realtime preview"]),
      ],
    },
    {
      id: "home-centered",
      name: "Centered",
      description: "Symmetrical centered hero, alternating feature rows.",
      build: ({ brand }) => [
        ...centeredHero(`${brand}`, "Premium by default.", "Every section is composable, brand-tokenised and editable here.", "Get started"),
        ...featureAlternating(["Composable blocks", "Edge-rendered SEO", "Realtime preview"]),
      ],
    },
  ],

  pricing: [
    {
      id: "pricing-three-tier",
      name: "Three-Tier",
      description: "Classic Starter / Pro / Team line-up with highlighted plan.",
      build: () => [
        ...hero("Pricing", "Simple, transparent pricing.", "Pick a plan that grows with you. Cancel anytime.", "Start free"),
        ...pricingTiers(),
      ],
    },
    {
      id: "pricing-compare",
      name: "Comparison Table",
      description: "Monthly/annual toggle with a full feature comparison table.",
      build: () => [
        ...hero("Pricing", "Compare every plan, side by side.", "Annual saves 20%. Switch any time.", "Start free"),
        ...pricingCompare(),
      ],
    },
    {
      id: "pricing-single",
      name: "Single Highlight",
      description: "One headline plan, optimised for conversion.",
      build: () => [
        ...centeredHero("Pricing", "One plan. Everything in.", "Designed for teams who want simplicity over tiers.", "Start Pro"),
        ...pricingSingleHighlight(),
      ],
    },
  ],

  features: [
    {
      id: "features-grid",
      name: "Feature Grid",
      description: "Four-up grid with accent cards.",
      build: () => [
        ...hero("Features", "Everything you need, nothing you don't.", "Designed for operators who care about craft, speed and clarity.", "Explore features"),
        ...featureGrid(["Composable blocks", "Brand tokens", "Edge-rendered SEO", "Realtime preview"]),
      ],
    },
    {
      id: "features-alternating",
      name: "Alternating Rows",
      description: "Image/copy zig-zag rows for depth.",
      build: () => [
        ...centeredHero("Features", "Built for craft.", "Three deeply-considered capabilities, presented in detail.", "See it live"),
        ...featureAlternating(["Composable hero", "Brand tokens", "Realtime preview"]),
      ],
    },
    {
      id: "features-bento",
      name: "Bento Grid",
      description: "Mixed-size bento for editorial richness.",
      build: () => [
        ...splitHero("Features", "Made to be composed.", "Snap together hero, grids, pricing and CTAs from a single design system.", "Compose your site"),
        ...featureBento(["Hero kits", "Brand tokens", "Edge SEO", "Realtime preview"]),
      ],
    },
  ],

  contact: [
    {
      id: "contact-centered",
      name: "Centered Form",
      description: "Single column form, one CTA.",
      build: () => [
        ...centeredHero("Contact", "Let's build something premium together.", "Tell us about your product. We reply within one business day.", "Send message"),
        ...contactForm(),
      ],
    },
    {
      id: "contact-split",
      name: "Split Contact",
      description: "Form on the left, office + support cards on the right.",
      build: () => [
        ...hero("Contact", "Get in touch.", "Sales, partnerships and support — all here.", "Send message"),
        ...contactSplit(),
      ],
    },
    {
      id: "contact-cta",
      name: "Sales CTA",
      description: "High-conversion sales banner with a single call-to-action.",
      build: () => [
        ...splitHero("Contact", "Talk to sales.", "We'll tailor a demo to your stack and team.", "Book a call"),
        ...ctaBand("Prefer email? We answer within one business day.", "Email sales", 480),
      ],
    },
  ],
};

/* ---------- Public API -------------------------------------------------- */

export function buildSections(kind: PageKind, templateId: string, brand: string, mode: TransformMode): CanvasElement[] {
  resetIds();
  const tpl = TEMPLATES[kind].find((t) => t.id === templateId) ?? TEMPLATES[kind][0];
  return tpl.build({ brand, mode });
}

function defaultTemplateFor(kind: PageKind, mode: TransformMode): string {
  if (kind === "home")     return mode === "rebrand" || mode === "full" ? "home-editorial" : "home-split";
  if (kind === "pricing")  return mode === "whitelabel" ? "pricing-single" : "pricing-three-tier";
  if (kind === "features") return mode === "rebrand" ? "features-bento" : "features-grid";
  return "contact-centered";
}

export function generatePages(mode: TransformMode, projectName: string): GeneratedPage[] {
  const brand = projectName || "Your product";
  const make = (id: string, name: string, kind: PageKind, route: string): GeneratedPage => {
    const templateId = defaultTemplateFor(kind, mode);
    return { id, name, kind, route, templateId, sections: buildSections(kind, templateId, brand, mode) };
  };

  const home     = make("page-home",     "Home",     "home",     "/src/pages/marketing/Home.tsx");
  const features = make("page-features", "Features", "features", "/src/pages/marketing/Features.tsx");
  const pricing  = make("page-pricing",  "Pricing",  "pricing",  "/src/pages/marketing/Pricing.tsx");
  const contact  = make("page-contact",  "Contact",  "contact",  "/src/pages/marketing/Contact.tsx");

  if (mode === "whitelabel") return [home, pricing, contact];
  return [home, features, pricing, contact];
}
