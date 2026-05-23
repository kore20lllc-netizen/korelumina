import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { setCurrentRole, type WorkspaceRole } from "@/services/workspaceAccessService";
import { toast } from "sonner";

export type UpgradeReason = "fullscreen" | "browser" | "slug";

const REASON_COPY: Record<UpgradeReason, { title: string; subtitle: string }> = {
  fullscreen: {
    title: "Unlock Fullscreen Preview",
    subtitle: "Expand your build into a distraction-free fullscreen workspace.",
  },
  browser: {
    title: "Unlock Browser Preview",
    subtitle: "Open a dedicated browser shell to share live previews with clients.",
  },
  slug: {
    title: "Unlock Custom Project URLs",
    subtitle: "Give every project a clean, branded preview URL you can share.",
  },
};

type Tier = {
  id: "pro" | "business";
  name: string;
  price: string;
  cadence: string;
  highlight?: boolean;
  icon: typeof Sparkles;
  perks: string[];
  role: WorkspaceRole;
};

const TIERS: Tier[] = [
  {
    id: "pro",
    name: "Pro",
    price: "$99",
    cadence: "/month",
    highlight: true,
    icon: Sparkles,
    role: "pro",
    perks: [
      "Fullscreen preview",
      "Browser preview route",
      "Custom project URL slug",
      "Priority generation queue",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "$499",
    cadence: "/month",
    icon: Crown,
    role: "business",
    perks: [
      "Everything in Pro",
      "Branded preview URLs",
      "Advanced sharing controls",
      "Team seats & SSO",
    ],
  },
];

export function UpgradeModal({
  open,
  onOpenChange,
  reason = "fullscreen",
  onUpgraded,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  reason?: UpgradeReason;
  onUpgraded?: (tier: Tier["id"]) => void;
}) {
  const { setView } = useWorkspace();
  const [loadingTier, setLoadingTier] = useState<Tier["id"] | null>(null);
  const copy = REASON_COPY[reason];

  const handleCheckout = async (tier: Tier) => {
    setLoadingTier(tier.id);
    // Simulated checkout: in production this would redirect to Stripe / Paddle.
    await new Promise((r) => setTimeout(r, 900));
    setCurrentRole(tier.role);
    setLoadingTier(null);
    toast.success(`Welcome to ${tier.name}`, {
      description: "Your preview features are now unlocked.",
    });
    onUpgraded?.(tier.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-2xl">
        <DialogHeader>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-gold/40 text-[10px] uppercase tracking-[0.16em] text-gold w-fit mb-2">
            <Sparkles className="h-3 w-3" />
            Upgrade
          </div>
          <DialogTitle className="font-display text-2xl">{copy.title}</DialogTitle>
          <DialogDescription>{copy.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const loading = loadingTier === tier.id;
            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-2xl border p-5 flex flex-col gap-4 transition",
                  tier.highlight
                    ? "border-gold/50 bg-gradient-to-b from-gold/[0.08] to-transparent shadow-[0_0_40px_-12px_hsl(var(--gold)/0.4)]"
                    : "border-border bg-surface-1/40",
                )}
              >
                {tier.highlight && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] rounded-full bg-gold text-background font-medium">
                    Recommended
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className={cn("h-9 w-9 grid place-items-center rounded-lg", tier.highlight ? "bg-gold/15 text-gold" : "bg-surface-2 text-foreground")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{tier.name}</div>
                    <div className="text-xs text-muted-foreground">Billed monthly</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-semibold tracking-tight">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                </div>
                <ul className="space-y-2 text-sm flex-1">
                  {tier.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 text-cyan shrink-0" />
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout(tier)}
                  disabled={loading}
                  variant={tier.highlight ? "default" : "secondary"}
                  className="w-full"
                >
                  {loading ? (
                    "Processing…"
                  ) : (
                    <>
                      Upgrade to {tier.name}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Cancel anytime. Secure checkout.</span>
          <button
            onClick={() => {
              onOpenChange(false);
              setView("pricing");
            }}
            className="text-foreground hover:text-gold transition inline-flex items-center gap-1"
          >
            Compare all plans
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}