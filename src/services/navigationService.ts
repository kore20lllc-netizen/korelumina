// Lightweight event-bus navigation service consumed by landing components.
// LandingPage subscribes and translates events into WorkspaceContext setView calls.

export type NavEvent =
  | "startBuilding"
  | "watchDemo"
  | "goToPricing"
  | "goToTemplates"
  | "goToDocs"
  | "goToSignIn"
  | "contactSales";

type Listener = (e: NavEvent) => void;
const listeners = new Set<Listener>();

function emit(e: NavEvent) {
  listeners.forEach((l) => l(e));
}

export function onNav(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const startBuilding = () => emit("startBuilding");
export const watchDemo = () => emit("watchDemo");
export const goToPricing = () => emit("goToPricing");
export const goToTemplates = () => emit("goToTemplates");
export const goToDocs = () => emit("goToDocs");
export const goToSignIn = () => emit("goToSignIn");
export const contactSales = () => emit("contactSales");