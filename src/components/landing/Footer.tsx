import { goToPricing, goToTemplates, goToDocs, contactSales, goToSignIn } from "@/services/navigationService";
import luminaLogo from "@/assets/lumina.webp";

const cols = [
  { title: "Product", links: [
    { label: "Features", onClick: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) },
    { label: "Templates", onClick: goToTemplates },
    { label: "Pricing", onClick: goToPricing },
    { label: "Docs", onClick: goToDocs },
  ]},
  { title: "Company", links: [
    { label: "Contact Sales", onClick: contactSales },
    { label: "Sign In", onClick: goToSignIn },
  ]},
  { title: "Legal", links: [
    { label: "Privacy", onClick: () => {} },
    { label: "Terms", onClick: () => {} },
  ]},
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-6 py-14 mt-10">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="relative h-8 w-8 rounded-xl overflow-hidden grid place-items-center ring-1 ring-white/10">
              <img src={luminaLogo} alt="KoreLumina" className="h-full w-full object-cover" />
            </span>
            <span className="font-display font-bold tracking-tight text-[17px]">
              Kore<span className="text-gradient-lumina">Lumina</span>
            </span>
          </div>
          <p className="eyebrow-lumina text-sm leading-relaxed max-w-xs">
            The operating system for AI-native software development.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="eyebrow-lumina text-xs uppercase tracking-[0.2em] mb-4">{c.title}</p>
            <ul className="flex flex-col gap-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <button onClick={l.onClick} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} KoreLumina. All rights reserved.</span>
        <span>Built with Lumina.</span>
      </div>
    </footer>
  );
}
