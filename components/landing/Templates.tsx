import { useNavigate } from "react-router-dom";
import { useReveal } from "@/hooks/use-reveal";
import { templateTeasers, type TemplatePreview } from "./data";
import { luminaTile } from "@/lib/luminaPalette";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { goToTemplates } from "@/services/navigationService";
import { ArrowRight, Eye, Sparkles } from "lucide-react";

function PreviewArt({ kind }: { kind: TemplatePreview }) {
  if (kind === "marketing") {
    return (
      <div className="absolute inset-0 p-4 flex flex-col gap-2">
        <div className="h-1.5 w-10 rounded-full bg-white/60" />
        <div className="h-3 w-2/3 rounded bg-white/80" />
        <div className="h-2 w-1/2 rounded bg-white/50" />
        <div className="mt-auto flex gap-2">
          <div className="h-6 w-16 rounded-md bg-white/85" />
          <div className="h-6 w-16 rounded-md border border-white/60" />
        </div>
      </div>
    );
  }
  if (kind === "dashboard") {
    return (
      <div className="absolute inset-0 p-3 flex flex-col gap-2">
        <div className="flex gap-1.5">
          <div className="h-7 flex-1 rounded-md bg-white/30 backdrop-blur-sm" />
          <div className="h-7 flex-1 rounded-md bg-white/50" />
          <div className="h-7 flex-1 rounded-md bg-white/30" />
        </div>
        <div className="flex-1 rounded-md bg-white/20 relative overflow-hidden">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <polyline
              points="0,30 15,22 30,26 45,14 60,18 75,8 90,12 100,4"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 flex-1 rounded bg-white/40" />
          <div className="h-2 flex-1 rounded bg-white/40" />
          <div className="h-2 flex-1 rounded bg-white/40" />
        </div>
      </div>
    );
  }
  if (kind === "crm") {
    return (
      <div className="absolute inset-0 p-3 flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="flex items-center gap-2 rounded-md bg-white/25 px-2 py-1.5">
            <div className="w-4 h-4 rounded-full bg-white/80" />
            <div className="h-1.5 flex-1 rounded bg-white/60" />
            <div className="h-1.5 w-8 rounded bg-white/40" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="absolute inset-0 p-3 flex flex-col gap-2 justify-end">
      <div className="self-start max-w-[70%] rounded-2xl rounded-bl-sm bg-white/30 px-2.5 py-1.5">
        <div className="h-1.5 w-16 rounded bg-white/80 mb-1" />
        <div className="h-1.5 w-10 rounded bg-white/60" />
      </div>
      <div className="self-end max-w-[70%] rounded-2xl rounded-br-sm bg-white/80 px-2.5 py-1.5">
        <div className="h-1.5 w-20 rounded bg-foreground/40 mb-1" />
        <div className="h-1.5 w-12 rounded bg-foreground/30" />
      </div>
      <div className="self-start max-w-[55%] rounded-2xl rounded-bl-sm bg-white/30 px-2.5 py-1.5">
        <div className="h-1.5 w-10 rounded bg-white/70" />
      </div>
    </div>
  );
}

export function Templates() {
  const ref = useReveal<HTMLDivElement>();
  const navigate = useNavigate();
  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div className="text-center mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Templates</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-royal-blue royal-glow">
              Start from a production-ready scaffold.
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl leading-relaxed">
              Hand-crafted starters wired with auth, payments, and design tokens — ready to fork and ship.
            </p>
          </div>
          <LuminaButton variant="ghost" size="md" onClick={goToTemplates}>
            Browse all templates <ArrowRight className="w-4 h-4" />
          </LuminaButton>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templateTeasers.map((t) => (
            <button
              key={t.name}
              onClick={() => navigate(`/templates/${t.slug}`)}
              className="text-left glass-panel rounded-2xl overflow-hidden transition-all duration-500 ease-fluid hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_hsl(265_90%_65%/0.55)] group flex flex-col"
            >
              <div className={`aspect-[4/3] ${luminaTile(t.accent)} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-aurora opacity-60" aria-hidden />
                <PreviewArt kind={t.preview} />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-md text-foreground/90 border border-white/15">
                    {t.category}
                  </span>
                  {t.badge && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-tight px-2 py-0.5 rounded-full bg-white/90 text-foreground">
                      {t.badge === "New" && <Sparkles className="w-2.5 h-2.5" />}
                      {t.badge}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/40 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-background/85 border border-white/15 text-foreground">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <div>
                  <h3 className="font-semibold tracking-tight mb-1">{t.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.body}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium tracking-tight px-2 py-0.5 rounded-full bg-surface-1 border border-border text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground/80 truncate">{t.stack.join(" · ")}</span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground group-hover:text-foreground transition-colors">
                    Use
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
