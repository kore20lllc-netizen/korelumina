import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Sparkles, Users, X } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { pricingTiers } from "@/components/landing/data";
import { auth } from "@/providers/auth-registry";
import { billing } from "@/providers/billing-registry";
import { notificationService } from "@/services/notificationService";
import { normalizeError } from "@/lib/errors";
import { getPendingUpgradeAction, clearPendingUpgradeAction } from "@/services/pendingUpgradeAction";
import { getPricingPrefill, clearPricingPrefill, type PricingPrefill } from "@/services/pricingPrefill";

const TIER_TO_PRODUCT: Record<string, string | "sales" | null> = {
  free: null,
  pro: "pro_monthly",
  business: "business_monthly",
  enterprise: "sales",
};

export function PricingView() {
  const { setView, usage } = useWorkspace();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<PricingPrefill | null>(() => getPricingPrefill());
  const recommendedRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (prefill && recommendedRef.current) {
      recommendedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [prefill]);
  const dismissPrefill = () => { clearPricingPrefill(); setPrefill(null); };
  const pct = Math.min(100, Math.round((usage.aiExecutions / usage.aiLimit) * 100));

  const checkout = async (tierId: string, tierName: string) => {
    const productId = TIER_TO_PRODUCT[tierId];
    if (productId === null) { setView("dashboard"); return; }
    if (productId === "sales") { toast.success("Sales team will reach out."); return; }
    const user = auth.getUser();
    if (!user) { toast.error("Sign in to upgrade."); setView("auth"); return; }
    setBusy(tierId);
    try {
      const { sessionId } = await billing.checkout({ userId: user.id, productId });
      await billing.confirmCheckout(sessionId);
      notificationService.push({ title: "Upgrade complete", body: `You're now on ${tierName}.`, kind: "success" });
      toast.success(`Upgraded to ${tierName}`);
      // Consume any deferred action queued before the paywall.
      const pending = getPendingUpgradeAction();
      if (pending) {
        clearPendingUpgradeAction();
        if ((pending.reason === "browser" || pending.reason === "slug") && pending.slug) {
          navigate(`/preview/${pending.slug}`);
          return;
        }
        if (pending.reason === "fullscreen") {
          toast("Resume your previous action to continue.");
        }
      }
    } catch (e) {
      toast.error(normalizeError(e).userMessage);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
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

        {prefill && (
          <div className="glass rounded-2xl p-4 mb-6 border border-violet/30 bg-violet/[0.04] flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet/15 border border-violet/30 grid place-items-center flex-shrink-0">
              <Users className="h-4 w-4 text-violet" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-foreground">
                Recommended: <span className="capitalize text-violet">{prefill.recommendedTier}</span>
                {prefill.workspaceName ? <span className="text-muted-foreground"> · {prefill.workspaceName}</span> : null}
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{prefill.reason}</div>
              <div className="text-[11px] text-muted-foreground mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>Current plan: <span className="text-foreground/80 capitalize">{prefill.currentPlan}</span></span>
                <span>Active seats: <span className="text-foreground/80 tabular-nums">{prefill.activeSeats}</span></span>
                <span>Pending: <span className="text-foreground/80 tabular-nums">{prefill.pendingSeats}</span></span>
                <span>Seats left: <span className="text-foreground/80 tabular-nums">{prefill.seatsLeft === -1 ? "∞" : prefill.seatsLeft}</span> / {prefill.seatCap === -1 ? "∞" : prefill.seatCap}</span>
              </div>
            </div>
            <button onClick={dismissPrefill} className="text-muted-foreground hover:text-foreground p-1 -m-1" aria-label="Dismiss recommendation">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {pricingTiers.map((p) => {
            const tierId = p.name.toLowerCase();
            const isCurrent = tierId === usage.plan?.toLowerCase();
            const isEnterprise = tierId === "enterprise";
            const isRecommended = !!prefill && tierId === prefill.recommendedTier;
            return (
              <div
                key={p.name}
                ref={isRecommended ? recommendedRef : undefined}
                className={cn(
                  "rounded-2xl p-6 glass flex flex-col",
                  p.highlighted && "ring-1 ring-violet/60 shadow-[0_0_0_1px_hsl(var(--violet)/0.4),0_8px_28px_-12px_hsl(var(--violet)/0.5)]",
                  isRecommended && "ring-2 ring-violet shadow-[0_0_0_1px_hsl(var(--violet)/0.5),0_12px_40px_-12px_hsl(var(--violet)/0.6)]",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-display text-lg">{p.name}</div>
                  {isRecommended ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet/20 text-violet border border-violet/40 uppercase tracking-widest inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> Recommended</span>
                  ) : p.highlighted ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet/15 text-violet border border-violet/30 uppercase tracking-widest inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> Popular</span>
                  ) : null}
                </div>
                <div className="font-display text-3xl mt-2">
                  {p.price}
                  {p.cadence && <span className="text-[12px] text-muted-foreground"> {p.cadence}</span>}
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">{p.body}</p>
                <ul className="mt-4 space-y-1.5 text-[12px] text-muted-foreground flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><Check className="h-3 w-3 text-cyan mt-0.5 shrink-0" /> {f}</li>
                  ))}
                </ul>
                <LuminaButton
                  variant={p.highlighted ? "primary" : "ghost"}
                  size="md"
                  className="mt-5 w-full"
                  disabled={isCurrent || busy === tierId}
                  onClick={() => checkout(tierId, p.name)}
                >
                  {busy === tierId ? "Processing…" : isCurrent ? "Current plan" : isEnterprise ? "Contact sales" : p.cta}
                </LuminaButton>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
