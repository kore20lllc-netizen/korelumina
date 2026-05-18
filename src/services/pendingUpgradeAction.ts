export type PendingUpgradeReason = "fullscreen" | "browser" | "slug";

const KEY = "korelumina:pendingUpgradeAction";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

type Stored = { reason: PendingUpgradeReason; slug?: string; ts: number };

export function setPendingUpgradeAction(reason: PendingUpgradeReason, slug?: string) {
  try {
    const payload: Stored = { reason, slug, ts: Date.now() };
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function getPendingUpgradeAction(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.reason || Date.now() - parsed.ts > TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingUpgradeAction() {
  try { window.localStorage.removeItem(KEY); } catch {}
}
