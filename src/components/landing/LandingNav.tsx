import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LuminaButton } from "../lumina/LuminaButton";
import { cn } from "../../lib/utils";
import {
  startBuilding,
  goToSignIn,
  goToPricing,
  goToTemplates,
  goToDocs,
} from "../../services/navigationService";
import luminaLogo from "../../assets/lumina.png";

const links: Array<{ label: string; onClick: () => void }> = [
  {
    label: "Features",
    onClick: () =>
      document
        .getElementById("features")
        ?.scrollIntoView({ behavior: "smooth" }),
  },
  { label: "Templates", onClick: goToTemplates },
  { label: "Pricing", onClick: goToPricing },
  { label: "Docs", onClick: goToDocs },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border" : ""
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 group"
        >
          <span className="relative h-8 w-8 rounded-xl overflow-hidden grid place-items-center ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
            <img
              src={luminaLogo.src}
              alt="KoreLumina"
              className="h-full w-full object-cover"
            />
          </span>

          <span className="font-display font-bold tracking-tight text-foreground text-[17px]">
            Kore<span className="text-gradient-lumina">Lumina</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={link.onClick}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LuminaButton onClick={goToSignIn}>
            <span className="eyebrow-lumina">Sign In</span>
          </LuminaButton>

          <LuminaButton onClick={startBuilding}>
            Start Building
          </LuminaButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2"
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-6 flex flex-col gap-4">
            {links.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  link.onClick();
                }}
                className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}

            <div className="pt-4 flex flex-col gap-3">
              <LuminaButton
                onClick={() => {
                  setOpen(false);
                  goToSignIn();
                }}
              >
                Sign In
              </LuminaButton>

              <LuminaButton
                onClick={() => {
                  setOpen(false);
                  startBuilding();
                }}
              >
                Start Building
              </LuminaButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
