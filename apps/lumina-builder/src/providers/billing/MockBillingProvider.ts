import { AppError } from "@/lib/errors";
import { readJSON, writeJSON, uid } from "@/lib/persistence";
import type { BillingProvider, Payment, Plan, Product, Role, Subscription } from "@/providers/types";
import { auth } from "@/providers/auth-registry";

const NS = "billing";

const PRODUCTS: Product[] = [
  { id: "pro_monthly",    name: "Pro · Monthly",      priceCents: 2400,  interval: "month",    planOnPurchase: "pro",      description: "Unlimited AI, unlimited projects, full preview suite." },
  { id: "pro_yearly",     name: "Pro · Yearly",       priceCents: 24000, interval: "year",     planOnPurchase: "pro",      description: "Pro features, 2 months free." },
  { id: "business_monthly", name: "Business · Monthly", priceCents: 9900, interval: "month",   planOnPurchase: "business", description: "Team seats, audit suite, branded preview URLs." },
  { id: "transform_one_time", name: "Transform App → Website", priceCents: 4900, interval: "one_time", description: "One-time unlock of the Transform engine for a single project." },
];

interface CheckoutSession { id: string; userId: string; productId: string; teamId?: string; createdAt: number }

function loadSubs(): Subscription[] { return readJSON<Subscription[]>(NS, "subs", []); }
function saveSubs(s: Subscription[]) { writeJSON(NS, "subs", s); }
function loadPays(): Payment[] { return readJSON<Payment[]>(NS, "payments", []); }
function savePays(p: Payment[]) { writeJSON(NS, "payments", p); }
function loadSessions(): CheckoutSession[] { return readJSON<CheckoutSession[]>(NS, "sessions", []); }
function saveSessions(s: CheckoutSession[]) { writeJSON(NS, "sessions", s); }

export class MockBillingProvider implements BillingProvider {
  listProducts() { return PRODUCTS; }
  getSubscription(userId: string) { return loadSubs().find((s) => s.userId === userId && s.status === "active") ?? null; }
  getTeamSubscription(teamId: string) { return loadSubs().find((s) => s.teamId === teamId && s.status === "active") ?? null; }
  listPayments(userId: string) { return loadPays().filter((p) => p.userId === userId).sort((a, b) => b.createdAt - a.createdAt); }
  async checkout({ userId, productId, teamId }: { userId: string; productId: string; teamId?: string }) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) throw new AppError("VALIDATION", "Unknown product.");
    const session: CheckoutSession = { id: uid("cs"), userId, productId, teamId, createdAt: Date.now() };
    saveSessions([...loadSessions(), session]);
    return { url: `#mock-checkout/${session.id}`, sessionId: session.id };
  }
  async confirmCheckout(sessionId: string) {
    const sessions = loadSessions();
    const s = sessions.find((x) => x.id === sessionId);
    if (!s) throw new AppError("NOT_FOUND", "Checkout session expired.");
    const product = PRODUCTS.find((p) => p.id === s.productId)!;
    await new Promise((r) => setTimeout(r, 400));
    const payment: Payment = { id: uid("pay"), userId: s.userId, productId: s.productId, amountCents: product.priceCents, status: "paid", createdAt: Date.now(), invoiceUrl: `#invoice/${uid("inv")}` };
    savePays([...loadPays(), payment]);
    let subscription: Subscription | undefined;
    if (product.interval && product.interval !== "one_time" && product.planOnPurchase) {
      const plan: Plan = product.id as Plan;
      const renewMs = product.interval === "year" ? 365 : 30;
      subscription = { id: uid("sub"), userId: s.userId, teamId: s.teamId, plan, status: "active", startedAt: Date.now(), renewsAt: Date.now() + renewMs * 86400_000 };
      const subs = loadSubs().filter((x) => {
        if (x.status !== "active") return true;
        if (s.teamId) return x.teamId !== s.teamId;
        return x.userId !== s.userId;
      });
      saveSubs([...subs, subscription]);
      await auth.setRole(product.planOnPurchase as Role);
    }
    saveSessions(sessions.filter((x) => x.id !== sessionId));
    return { subscription, payment };
  }
  async cancel(userId: string) {
    const subs = loadSubs();
    const i = subs.findIndex((s) => s.userId === userId && s.status === "active");
    if (i < 0) throw new AppError("NOT_FOUND", "No active subscription.");
    subs[i] = { ...subs[i], status: "canceled", canceledAt: Date.now() };
    saveSubs(subs);
    await auth.setRole("free");
    return subs[i];
  }
  async reactivate(userId: string) {
    const subs = loadSubs();
    const i = subs.findIndex((s) => s.userId === userId && s.status === "canceled");
    if (i < 0) throw new AppError("NOT_FOUND", "No canceled subscription to reactivate.");
    subs[i] = { ...subs[i], status: "active", canceledAt: undefined };
    saveSubs(subs);
    const product = PRODUCTS.find((p) => p.id === subs[i].plan);
    if (product?.planOnPurchase) await auth.setRole(product.planOnPurchase as Role);
    return subs[i];
  }
  openPortalUrl(userId: string) { return `#mock-portal/${userId}`; }
}