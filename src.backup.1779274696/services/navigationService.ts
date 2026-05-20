export type ViewName =
  | "landing"
  | "auth"
  | "entry"
  | "dashboard"
  | "workspace"
  | "pricing"
  | "templates"
  | "repo-audit";

export type NavEvent =
  | { type: "view"; view: ViewName }
  | { type: "scroll"; targetId: string; block?: ScrollLogicalPosition }
  | { type: "external"; url: string; target?: string; features?: string }
  | { type: "mailto"; href: string };

type Listener = (event: NavEvent) => void;

const listeners = new Set<Listener>();

export function onNav(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: NavEvent): void {
  listeners.forEach((listener) => listener(event));
}

function isAuthenticated(): boolean {
  try {
    return !!window.localStorage.getItem("korelumina:auth");
  } catch {
    return false;
  }
}

/**
 * Lovable behavior:
 * - If NOT authenticated → open auth modal/card
 * - If authenticated     → open entry/dashboard
 */
export function startBuilding(): void {
  emit({
    type: "view",
    view: isAuthenticated() ? "entry" : "auth",
  });
}

export function goToSignIn(): void {
  emit({
    type: "view",
    view: "auth",
  });
}

export function goToPricing(): void {
  emit({
    type: "scroll",
    targetId: "pricing",
    block: "start",
  });
}

export function goToTemplates(): void {
  emit({
    type: "scroll",
    targetId: "templates",
    block: "start",
  });
}

export function goToDocs(): void {
  emit({
    type: "scroll",
    targetId: "faq",
    block: "start",
  });
}

export function watchDemo(): void {
  emit({
    type: "scroll",
    targetId: "demo",
    block: "center",
  });
}

export function contactSales(): void {
  emit({
    type: "mailto",
    href: "mailto:sales@korelumina.app?subject=KoreLumina%20Enterprise",
  });
}

export function goToRepoAudit(): void {
  emit({
    type: "view",
    view: isAuthenticated() ? "repo-audit" : "auth",
  });
}
