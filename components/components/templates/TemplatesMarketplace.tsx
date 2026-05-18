import { useState } from "react";
import { ArrowLeft, Search, Eye, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { mockTemplates } from "@/lib/mockData";
import { luminaFrame } from "@/lib/luminaPalette";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTemplateByName } from "./registry";
import { useIsAuthenticated } from "@/hooks/use-auth";

const categories = ["All", "Website", "Web App", "Dashboard", "AI Tool", "Mobile App"] as const;

export function TemplatesMarketplace() {
  const { setView } = useWorkspace();
  const navigate = useNavigate();
  const authed = useIsAuthenticated();
  const [cat, setCat] = useState<typeof categories[number]>("All");
  const [q, setQ] = useState("");

  const filtered = mockTemplates
    .filter((t) => cat === "All" || t.category === cat)
    .filter((t) => (t.name + t.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-10">
        <button onClick={() => setView("dashboard")} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-2">Marketplace</div>
            <h1 className="font-display text-3xl md:text-4xl tracking-[-0.025em]">
              Premium <span className="text-gradient-lumina">templates</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-surface-1 border border-border w-72">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="bg-transparent outline-none text-[13px] flex-1" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "h-8 px-3 rounded-full text-[11px] uppercase tracking-widest border transition whitespace-nowrap",
                cat === c ? "bg-surface-3 border-white/15 text-foreground" : "bg-surface-1 border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t, i) => {
            const live = getTemplateByName(t.name);
            return (
            <div key={t.id} className="rounded-2xl glass overflow-hidden flex flex-col anim-in" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className={cn("relative aspect-[16/10] overflow-hidden", luminaFrame(i))}>
                <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/[0.06] blur-3xl" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
                {live && (
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full bg-white/90 text-foreground">
                    <Eye className="w-2.5 h-2.5" /> Live preview
                  </span>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div>
                  <div className="font-display font-semibold text-[14px]">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{t.category}</div>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{t.description}</p>
                <div className="flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md bg-surface-1 border border-border text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-2">
                  {live && (
                    <LuminaButton variant="ghost" size="sm" onClick={() => navigate(`/templates/${live.slug}`)}>
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </LuminaButton>
                  )}
                  <LuminaButton
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      if (!authed) {
                        toast.info("Sign in to use this template");
                        setView("auth");
                        return;
                      }
                      toast.success(`Using ${t.name}`);
                      setView("workspace");
                    }}
                  >
                    {authed ? "Use template" : (<><Lock className="h-3.5 w-3.5" /> Sign in to use</>)}
                  </LuminaButton>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}