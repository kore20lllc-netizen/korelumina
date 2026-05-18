import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import { startBuilding, goToSignIn, goToPricing, goToTemplates, goToDocs } from "@/services/navigationService";
import luminaLogo from "@/assets/lumina.png";

const links: Array<{ label: string; onClick: () => void }> = [
  { label: "Features", onClick: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) },
  { label: "Templates", onClick: goToTemplates },
  { label: "Pricing", onClick: goToPricing },
  { label: "Docs", onClick: goToDocs },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-fluid",
        scrolled ? "backdrop-blur-xl bg-background/60 border-b border-white/10" : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 group"
        >
          <span className="relative h-8 w-8 rounded-xl overflow-hidden grid place-items-center ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
            <img src={luminaLogo.src} alt="KoreLumina" className="h-full w-full object-cover" />
          </span>
          <span className="font-display font-bold tracking-tight text-foreground text-[17px]">
            Kore<span className="text-gradient-lumina">Lumina</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={l.onClick}
              className="eyebrow-lumina relative px-3 py-2 text-sm transition-colors rounded-lg hover:bg-surface-1 group/link"
            >
              {l.label}
              <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px scale-x-0 origin-left bg-brand transition-transform duration-300 ease-fluid group-hover/link:scale-x-100" />
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LuminaButton variant="subtle" size="md" onClick={goToSignIn}>
            <span className="eyebrow-lumina">Sign In</span>
          </LuminaButton>
          <LuminaButton variant="primary" size="md" onClick={startBuilding}>Start Building</LuminaButton>
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-surface-1 text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-background/85 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={() => { setOpen(false); l.onClick(); }}
                className="eyebrow-lumina text-left px-3 py-3 text-sm rounded-lg hover:bg-surface-1"
              >
                {l.label}
              </button>
            ))}
            <div className="flex gap-2 mt-2">
              <LuminaButton variant="ghost" size="md" className="flex-1" onClick={() => { setOpen(false); goToSignIn(); }}>
                <span className="eyebrow-lumina">Sign In</span>
              </LuminaButton>
              <LuminaButton variant="primary" size="md" className="flex-1" onClick={() => { setOpen(false); startBuilding(); }}>Start Building</LuminaButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}