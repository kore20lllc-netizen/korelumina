import { isAuthenticated } from "@/lib/auth";

export type AppView =
  "landing" | "entry" | "dashboard" | "workspace" | "auth" | "settings" | "pricing" | "templates" | "repo-audit" | "deployment-diagnostics" | "runtime-operations" | "knowledge-operations" | "admin";

export type NavEvent =
  | { type: "view"; view: AppView }
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
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error("navigation listener failed:", error);
    }
  }
}

function navigate(view: AppView): void {
  emit({ type: "view", view });
}

/**
 * CRITICAL BUSINESS RULE
 *
 * In the original Lovable build:
 * - Clicking "Start Building" from the landing page ALWAYS opens the Auth card.
 * - It does NOT check authentication state.
 * - It does NOT open Dashboard.
 * - It does NOT open Workspace.
 *
 * After successful login, AuthView itself routes to Dashboard.
 */
export function startBuilding(): void {
  navigate("auth");
}

export function goToSignIn(): void {
  navigate("auth");
}

export function goToDashboard(): void {
  if (isAuthenticated()) {
    navigate("dashboard");
  } else {
    navigate("auth");
  }
}

export function goToWorkspace(): void {
  if (isAuthenticated()) {
    navigate("workspace");
  } else {
    navigate("auth");
  }
}

export function goToPricing(): void {
  navigate("pricing");
}

export function goToTemplates(): void {
  navigate("templates");
}

export function goToSettings(): void {
  navigate("settings");
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
  navigate("repo-audit");
}
