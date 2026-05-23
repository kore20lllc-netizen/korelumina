import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Project } from "@/context/WorkspaceContext";
import { buildSections, type GeneratedPage } from "@/lib/transformPages";

export type TransformSource = "import-success" | "builder" | "designer" | "command";
export type TransformMode = "quick" | "full" | "rebrand" | "whitelabel";

export interface TransformOpenPayload {
  project?: Project | null;
  /** Optional pre-detected analysis from the import success screen. */
  detected?: {
    framework: string;
    appType: string;
    pages: number;
    components: number;
    designScore: number;
  } | null;
  source: TransformSource;
}

interface TransformState {
  open: boolean;
  payload: TransformOpenPayload | null;
  openTransform: (p: TransformOpenPayload) => void;
  closeTransform: () => void;
  /** Pages produced by a completed transform, editable in Designer Space. */
  generatedPages: GeneratedPage[];
  activePageId: string | null;
  setActivePage: (id: string) => void;
  setGeneratedPages: (pages: GeneratedPage[]) => void;
  clearGenerated: () => void;
  /** Swap the layout template of a generated page, regenerating its sections. */
  setPageTemplate: (pageId: string, templateId: string) => void;
}

const Ctx = createContext<TransformState | null>(null);

export function TransformProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<TransformOpenPayload | null>(null);
  const [generatedPages, _setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const openTransform = useCallback((p: TransformOpenPayload) => {
    setPayload(p);
    setOpen(true);
  }, []);
  const closeTransform = useCallback(() => {
    setOpen(false);
  }, []);
  const setGeneratedPages = useCallback((pages: GeneratedPage[]) => {
    _setGeneratedPages(pages);
    setActivePageId(pages[0]?.id ?? null);
  }, []);
  const setActivePage = useCallback((id: string) => setActivePageId(id), []);
  const clearGenerated = useCallback(() => {
    _setGeneratedPages([]);
    setActivePageId(null);
  }, []);

  const setPageTemplate = useCallback((pageId: string, templateId: string) => {
    _setGeneratedPages((pages) =>
      pages.map((p) => {
        if (p.id !== pageId) return p;
        const brand = payload?.project?.name ?? "Your product";
        // mode is implicit — pages were generated under one. Default to "full" for regen.
        const sections = buildSections(p.kind, templateId, brand, "full");
        return { ...p, templateId, sections };
      })
    );
  }, [payload?.project?.name]);

  const value = useMemo<TransformState>(
    () => ({
      open, payload, openTransform, closeTransform,
      generatedPages, activePageId, setActivePage, setGeneratedPages, clearGenerated, setPageTemplate,
    }),
    [open, payload, openTransform, closeTransform, generatedPages, activePageId, setActivePage, setGeneratedPages, clearGenerated, setPageTemplate]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTransform() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransform must be used inside TransformProvider");
  return ctx;
}