import { Check, ArrowLeft, Sparkles } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const plans = [
  { id: "free", name: "Free",   price: "$0",   features: ["5 AI executions / mo", "1 project", "Community support"] },
  { id: "pro",  name: "Pro",    price: "$24",  features: ["Unlimited AI", "10 projects", "Custom domains", "Priority support"], featured: true },
  { id: "team", name: "Team",   price: "$96",  features: ["Everything in Pro", "Unlimited projects", "Team workspaces", "SSO"] },
];

export function PricingView() {
  const { setView, usage } = useWorkspace();
  const pct = Math.min(100, Math.round((usage.aiExecutions / usage.aiLimit) * 100));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <button onClick={() => setView("dashboard")} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl tracking-[-0.025em]">
            Pricing & <span className="text-gradient-lumina">usage</span>
          </h1>
        </div>

        <div className="glass rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Current plan</div>
              <div className="font-display text-xl capitalize mt-0.5">{usage.plan}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">AI executions</div>
              <div className="font-medium tabular-nums">{usage.aiExecutions} / {usage.aiLimit}</div>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full bg-button-lumina transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "rounded-2xl p-6 glass flex flex-col",
                p.featured && "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-display text-lg">{p.name}</div>
                {p.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet/15 text-violet border border-violet/30 uppercase tracking-widest inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> Popular</span>}
              </div>
              <div className="font-display text-3xl mt-2">{p.price}<span className="text-[12px] text-muted-foreground"> / mo</span></div>
              <ul className="mt-4 space-y-1.5 text-[12px] text-muted-foreground flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-3 w-3 text-cyan" /> {f}</li>
                ))}
              </ul>
              <LuminaButton
                variant={p.featured ? "primary" : "ghost"}
                size="md"
                className="mt-5 w-full"
                onClick={() => toast.success(`Upgraded to ${p.name}`)}
              >
                {p.id === usage.plan ? "Current plan" : "Upgrade"}
              </LuminaButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}