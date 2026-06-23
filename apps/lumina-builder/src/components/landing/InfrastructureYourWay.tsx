import { useReveal } from "@/hooks/use-reveal";
import { Check, Server, GitBranch } from "lucide-react";

const managed = [
  "No setup required",
  "Managed database",
  "Managed deployment",
  "Authentication included",
  "Storage included",
  "SSL and hosting included",
  "KoreLumina subdomain included",
];

const byos = [
  "Connect your own Supabase",
  "Connect your own GitHub repository",
  "Connect your own Vercel account",
  "Use your own deployment pipeline",
  "Full ownership and portability",
];

export function InfrastructureYourWay() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="infrastructure" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">Infrastructure</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
            Infrastructure Freedom
          </h2>
          <p className="text-muted-foreground leading-relaxed mt-4">
            Use KoreLumina-managed infrastructure, bring your own providers, or move between both as your company grows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Fully Managed */}
          <div className="group relative glass-panel-landing rounded-2xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:border-white/20 border-white/20">
            <div
              className="absolute -inset-px rounded-2xl pointer-events-none"
              style={{ background: "var(--gradient-lumina)", opacity: 0.14, filter: "blur(28px)" }}
              aria-hidden
            />
            <div className="relative flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--gradient-lumina)" }}
                >
                  <Server className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-primary-foreground bg-button-lumina shadow-[var(--glow-violet)]">
                  Recommended
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight mb-2">Fully Managed</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Provisioned, configured, and operated for you. Build the moment you sign in.
              </p>
              <ul className="flex flex-col gap-2.5">
                {managed.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bring Your Own Stack */}
          <div className="group relative glass-panel-landing rounded-2xl p-8 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
            <div className="relative flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.03]"
                >
                  <GitBranch className="w-5 h-5 text-cyan" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide text-gold border border-white/10 bg-white/[0.04]">
                  Advanced
                </span>
              </div>
              <h3 className="text-xl font-semibold tracking-tight mb-2">Bring Your Own Stack</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Connect the providers and pipelines you already trust. Your keys, your perimeter.
              </p>
              <ul className="flex flex-col gap-2.5">
                {byos.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-cyan mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-sm md:text-base text-muted-foreground mt-10">
          Start managed. Connect your own tools anytime. Keep your code, data, and deployment path portable.
        </p>
      </div>
    </section>
  );
}