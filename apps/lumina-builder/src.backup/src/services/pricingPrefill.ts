/** Lightweight session hint so SettingsView can prefill the Pricing screen
 *  with a plan recommendation and seat context. */
const KEY = "korelumina:pricingPrefill";

export interface PricingPrefill {
  recommendedTier: "pro" | "business" | "enterprise";
  /** Current plan when the hint was created. */
  currentPlan: string;
  /** Active seats in the workspace at hint time. */
  activeSeats: number;
  /** Pending invites at hint time. */
  pendingSeats: number;
  /** Seats remaining (Infinity → -1). */
  seatsLeft: number;
  /** Seat cap on current plan (Infinity → -1). */
  seatCap: number;
  /** Short human reason for the recommendation. */
  reason: string;
  /** Workspace name for context. */
  workspaceName?: string;
}

const ser = (n: number) => (n === Infinity ? -1 : n);

export function setPricingPrefill(p: Omit<PricingPrefill, "seatsLeft" | "seatCap"> & { seatsLeft: number; seatCap: number }) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ...p, seatsLeft: ser(p.seatsLeft), seatCap: ser(p.seatCap) }),
    );
  } catch {}
}

export function getPricingPrefill(): PricingPrefill | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PricingPrefill;
  } catch { return null; }
}

export function clearPricingPrefill() {
  try { sessionStorage.removeItem(KEY); } catch {}
}
