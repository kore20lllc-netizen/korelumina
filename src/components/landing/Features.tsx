import { useReveal } from "../../hooks/use-reveal";
import { features } from "./data";
import { luminaFrame, luminaTile } from "../../lib/luminaPalette";

export function Features() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="features" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Features</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-royal-blue royal-glow">Everything your team needs in one studio.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`glass-panel p-6 rounded-2xl ${luminaFrame(i)} transition-all duration-500 ease-fluid hover:-translate-y-1`}>
                <div className={`w-12 h-12 rounded-xl grid place-items-center mb-4 ${luminaTile(i)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
