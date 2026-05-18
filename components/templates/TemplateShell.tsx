import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { luminaTile } from "@/lib/luminaPalette";
import { useIsAuthenticated } from "@/hooks/use-auth";
import type { TemplateRegistryEntry } from "./registry";

interface TemplateShellProps {
  template: TemplateRegistryEntry;
  children: ReactNode;
}

export function TemplateShell({ template, children }: TemplateShellProps) {
  const navigate = useNavigate();
  const authed = useIsAuthenticated();

  const handleUse = () => {
    if (!authed) {
      try {
        window.localStorage.setItem("korelumina:view", "auth");
      } catch {}
      toast.info("Sign in to use this template");
      navigate("/");
      return;
    }
    toast.success(`Using ${template.name}`);
    try {
      window.localStorage.setItem("korelumina:view", "workspace");
    } catch {}
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to marketplace
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-7 h-7 rounded-md grid place-items-center ${luminaTile(template.accent)}`}>
              <span className="text-[10px] font-semibold text-white">{template.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-semibold tracking-tight truncate">{template.name}</div>
                {!authed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-tight px-1.5 py-0.5 rounded-md bg-surface-1 border border-border text-muted-foreground">
                    <Eye className="w-2.5 h-2.5" /> Preview only
                  </span>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Live preview · {template.category}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LuminaButton variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ExternalLink className="w-3.5 h-3.5" /> Exit
            </LuminaButton>
            <LuminaButton size="sm" onClick={handleUse}>
              {authed ? "Use this template" : (<><Lock className="w-3.5 h-3.5" /> Sign in to use</>)}
            </LuminaButton>
          </div>
        </div>
      </header>
      <main className="relative">{children}</main>
      <footer className="border-t border-white/5 py-6 text-center text-[11px] text-muted-foreground">
        {!authed
          ? "Preview only — sign in to fork this template into a workspace."
          : `Live preview — ${template.stack.join(" · ")} · Built with KoreLumina`}
      </footer>
    </div>
  );
}