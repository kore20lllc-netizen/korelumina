import { useReveal } from "../../hooks/use-reveal";
import { templateTeasers } from "./data";
import { luminaTile } from "../../lib/luminaPalette";
import { startBuilding } from "../../services/navigationService";

function openTemplate(_template: unknown) {
  startBuilding();
}

export function Templates() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="templates" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-7xl mx-auto opacity-0">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-gold mb-4">
            Templates
          </p>

          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
            Launch Faster with Premium Starters
          </h2>

          <p className="text-lg text-muted-foreground">
            Start from production-ready templates for SaaS platforms,
            marketplaces, internal tools, and AI products.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templateTeasers.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => openTemplate(template)}
              className={[
                luminaTile,
                "text-left rounded-3xl p-6 transition-all hover:-translate-y-1",
              ].join(" ")}
            >
              <div className="aspect-[16/10] rounded-2xl bg-white/5 border border-white/10 mb-5" />

              <h3 className="font-display text-xl font-semibold mb-2">
                {template.name}
              </h3>

              <p className="text-sm text-muted-foreground mb-4">
                {template.body}
              </p>

              <div className="flex flex-wrap gap-2">
                {template.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
