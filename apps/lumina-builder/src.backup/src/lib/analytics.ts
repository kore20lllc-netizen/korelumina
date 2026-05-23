/**
 * Lightweight analytics dispatcher.
 *
 * Events are:
 *   - logged to the console in dev,
 *   - pushed to window.dataLayer (GTM-compatible) when present,
 *   - dispatched as a CustomEvent("kl:analytics") so any listener can consume them,
 *   - buffered in-memory for QA / replay.
 *
 * Swap the transport with a real provider (PostHog, Segment, etc.) in one place.
 */

export type AnalyticsEvent =
  // Transform App → Website funnel
  | "transform.opened"
  | "transform.closed"
  | "transform.mode_selected"
  | "transform.analysis_started"
  | "transform.plan_viewed"
  | "transform.diff_viewed"
  | "transform.diff_file_toggled"
  | "transform.diff_file_expanded"
  | "transform.applied"
  | "transform.completed"
  | "transform.opened_in_designer"
  | "transform.upgrade_gate_shown"
  | "transform.upgrade_clicked";

export interface AnalyticsProps {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AnalyticsEntry {
  event: AnalyticsEvent;
  props: AnalyticsProps;
  ts: number;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const buffer: AnalyticsEntry[] = [];
const listeners = new Set<(entry: AnalyticsEntry) => void>();

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  const payload: AnalyticsEntry = { event, props: props ?? {}, ts: Date.now() };
  buffer.push(payload);
  if (buffer.length > 200) buffer.shift();

  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...payload.props });
    window.dispatchEvent(new CustomEvent("kl:analytics", { detail: payload }));
  }
  listeners.forEach((fn) => { try { fn(payload); } catch { /* noop */ } });
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, props ?? {});
  }
}

export function getAnalyticsBuffer(): AnalyticsEntry[] {
  return [...buffer];
}

export function subscribeAnalytics(fn: (entry: AnalyticsEntry) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
