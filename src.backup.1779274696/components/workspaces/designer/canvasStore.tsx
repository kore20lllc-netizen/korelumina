import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type ElementKind = "headline" | "subhead" | "button" | "image" | "badge" | "card";

export interface CanvasElement {
  id: string;
  kind: ElementKind;
  label: string;
  x: number;        // px relative to canvas
  y: number;
  w: number;
  h: number;
  text?: string;
  accent?: "violet" | "magenta" | "cyan" | "gold";
}

interface CanvasState {
  elements: CanvasElement[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  toggleSelected: (id: string, additive?: boolean) => void;
  move: (ids: string[], dx: number, dy: number) => void;
  setPosition: (id: string, x: number, y: number) => void;
  add: (el: Omit<CanvasElement, "id">) => void;
  remove: (ids: string[]) => void;
  rename: (id: string, label: string) => void;
  /** Replace the entire canvas (used by AI Assist undo/redo). */
  replaceAll: (els: CanvasElement[]) => void;
}

const Ctx = createContext<CanvasState | null>(null);

const seed: CanvasElement[] = [
  { id: "badge-1", kind: "badge", label: "Eyebrow", x: 280, y: 60, w: 200, h: 32, text: "Selected · H1", accent: "cyan" },
  { id: "head-1", kind: "headline", label: "Headline", x: 120, y: 110, w: 520, h: 110, text: "Build, alive.", accent: "violet" },
  { id: "sub-1", kind: "subhead", label: "Subheadline", x: 200, y: 240, w: 360, h: 56, text: "A canvas that breathes — drop, tweak, watch it move.", accent: "violet" },
  { id: "cta-1", kind: "button", label: "Primary CTA", x: 220, y: 320, w: 150, h: 44, text: "Get started", accent: "magenta" },
  { id: "cta-2", kind: "button", label: "Secondary CTA", x: 390, y: 320, w: 150, h: 44, text: "Learn more", accent: "violet" },
  { id: "card-1", kind: "card", label: "Feature card", x: 80, y: 420, w: 220, h: 130, text: "Fluid motion", accent: "cyan" },
  { id: "card-2", kind: "card", label: "Feature card", x: 320, y: 420, w: 220, h: 130, text: "Adaptive depth", accent: "magenta" },
  { id: "card-3", kind: "card", label: "Feature card", x: 560, y: 420, w: 220, h: 130, text: "Living color", accent: "gold" },
];

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [elements, setElements] = useState<CanvasElement[]>(seed);
  const [selected, setSelected] = useState<string[]>(["head-1"]);

  const toggleSelected = useCallback((id: string, additive = false) => {
    setSelected((curr) => {
      if (!additive) return curr.length === 1 && curr[0] === id ? curr : [id];
      return curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id];
    });
  }, []);

  const move = useCallback((ids: string[], dx: number, dy: number) => {
    setElements((els) => els.map((e) => (ids.includes(e.id) ? { ...e, x: e.x + dx, y: e.y + dy } : e)));
  }, []);

  const setPosition = useCallback((id: string, x: number, y: number) => {
    setElements((els) => els.map((e) => (e.id === id ? { ...e, x, y } : e)));
  }, []);

  const add = useCallback((el: Omit<CanvasElement, "id">) => {
    const id = `${el.kind}-${Math.random().toString(36).slice(2, 7)}`;
    setElements((els) => [...els, { ...el, id }]);
    setSelected([id]);
  }, []);

  const remove = useCallback((ids: string[]) => {
    setElements((els) => els.filter((e) => !ids.includes(e.id)));
    setSelected((s) => s.filter((id) => !ids.includes(id)));
  }, []);

  const rename = useCallback((id: string, label: string) => {
    setElements((els) => els.map((e) => (e.id === id ? { ...e, label } : e)));
  }, []);

  const replaceAll = useCallback((els: CanvasElement[]) => {
    setElements(els);
    setSelected((s) => s.filter((id) => els.some((e) => e.id === id)));
  }, []);

  const value = useMemo<CanvasState>(
    () => ({ elements, selected, setSelected, toggleSelected, move, setPosition, add, remove, rename, replaceAll }),
    [elements, selected, toggleSelected, move, setPosition, add, remove, rename, replaceAll]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCanvas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCanvas must be used inside CanvasProvider");
  return ctx;
}