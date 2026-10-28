import { useState } from "react";
import { ArrowLeft, Search, Eye, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";
import { LuminaFlagshipSurface } from "@/components/lumina/workspace/primitives/LuminaFlagshipSurface";
import { panelEyebrow, pillButton, quietButton } from "../workspaces/developer/shared/surfaces";
import { mockTemplates } from "@/lib/mockData";
import { luminaFrame } from "@/lib/luminaPalette";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTemplateByName } from "./registry";
import { useIsAuthenticated } from "@/hooks/use-auth";
import { checkEntitlement } from "@/services/entitlements";
import type { BuildIntent } from "@/context/WorkspaceContext";

const CATEGORY_TO_INTENT: Record<string, BuildIntent> = {
  "Website": "website", "Web App": "webapp", "Dashboard": "dashboard",
  "AI Tool": "ai-tool", "Mobile App": "mobile",
};

const categories = ["All", "Website", "Web App", "Dashboard", "AI Tool", "Mobile App"] as const;

export function TemplatesMarketplace() {
  const { setView, setActiveProject } = useWorkspace();
  const navigate = useNavigate();
  const authed = useIsAuthenticated();
  const [cat, setCat] = useState<typeof categories[number]>("All");
  const [q, setQ] = useState("");

  const filtered = mockTemplates
    .filter((t) => cat === "All" || t.category === cat)
    .filter((t) => (t.name + t.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));

  return (
    <section aria-label="Templates Marketplace" className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain bg-transparent text-white">
      <div className="space-y-5 p-4 md:p-6">
        <button onClick={() => setView("dashboard")} className={quietButton}>
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <LuminaFlagshipCard as="article" className="p-5 md:p-8">
        <header className="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className={panelEyebrow}>Marketplace</div>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">
              Premium <span className="text-gradient-lumina">templates</span>
            </h1>
          </div>
          <div className="min-w-0 w-full lg:w-80">
            <div className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-cyan-300/30 bg-slate-950/60 px-3 focus-within:ring-2 focus-within:ring-cyan-300/50">
              <Search className="h-3.5 w-3.5 text-sky-200/65" />
              <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search templates" placeholder="Search templates…" className="min-w-0 flex-1 bg-transparent text-[13px] text-sky-100 outline-none placeholder:text-sky-200/50" />
            </div>
          </div>
        </header>
        </LuminaFlagshipCard>

        <nav aria-label="Template categories" className="flex min-w-0 items-center gap-2 overflow-x-auto overscroll-contain rounded-2xl border border-cyan-300/30 bg-slate-950/60 p-3">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn(cat === c ? pillButton("active") : quietButton, "shrink-0 whitespace-nowrap")}
            >
              {c}
            </button>
          ))}
        </nav>

        {filtered.length === 0 && (
          <LuminaFlagshipSurface className="p-8 text-center" role="status">
            <p className="text-lg font-semibold text-amber-400">No matching templates</p>
            <p className="mt-2 text-sm text-sky-200/65">Try another search or category.</p>
          </LuminaFlagshipSurface>
        )}
        <div aria-label="Template catalog" className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((t, i) => {
            const live = getTemplateByName(t.name);
            return (
            <LuminaFlagshipCard as="article" key={t.id} className="flex min-w-0 flex-col" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={cn("relative aspect-[16/10] overflow-hidden", luminaFrame(i))}>
                <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/[0.06] blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
                {live && (
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full bg-white/90 text-slate-950">
                    <Eye className="w-2.5 h-2.5" /> Live preview
                  </span>
                )}
              </div>
              <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3 p-5">
                <div>
                  <div className="text-base font-semibold tracking-tight text-amber-400">{t.name}</div>
                  <div className="text-[11px] text-sky-200/65 mt-0.5">{t.category}</div>
                </div>
                <p className="text-[12px] text-sky-200/65 leading-relaxed">{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-950/50 border border-cyan-300/20 text-sky-200/65">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  {live && (
                    <button type="button" className={quietButton} onClick={() => navigate(`/templates/${live.slug}`)}>
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                  )}
                  <button
                    type="button"
                    className={cn(pillButton("active"), "min-w-0 flex-1 justify-center")}
                    onClick={() => {
                      if (!authed) {
                        toast.info("Sign in to use this template");
                        setView("auth");
                        return;
                      }
                      const gate = checkEntitlement("project.create");
                      if (!gate.allowed) {
                        toast.error(gate.reason ?? "Upgrade required");
                        setView("pricing");
                        return;
                      }
                      toast.error(
                        "Template forking requires a runtime-backed project creation endpoint.",
                      );
                    }}
                  >
                    {authed ? "Use template" : (<><Lock className="h-3.5 w-3.5" /> Sign in to use</>)}
                  </button>
                </div>
              </div>
            </LuminaFlagshipCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
