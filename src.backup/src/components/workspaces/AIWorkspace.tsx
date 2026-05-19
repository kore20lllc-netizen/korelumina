import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";
import { PromptComposer } from "./ai/PromptComposer";
import { TemplateGrid } from "./ai/TemplateGrid";
import { ActivityPanel } from "./ai/ActivityPanel";
import { activityLog } from "./ai/data";
import { generateDraft } from "@/services/api";
import { normalizeError } from "@/lib/errors";
import { notificationService } from "@/services/notificationService";
import { toast } from "sonner";

export function AIWorkspace() {
  const { rightPanelOpen, activeProject } = useWorkspace();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const prevItemCountRef = useRef(activityLog.length);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const shouldFocusDrawerRef = useRef(false);
  const shouldRestoreDrawerToggleRef = useRef(false);

  // Focus management: only move focus for manual opens so automatic expansion doesn't scroll the page.
  useEffect(() => {
    if (!previewExpanded) return;
    if (drawerOpen && shouldFocusDrawerRef.current) {
      lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
      // Defer to allow transition/render
      const id = window.requestAnimationFrame(() => {
        const target =
          drawerContentRef.current?.querySelector<HTMLElement>(
            'a, button, [tabindex]:not([tabindex="-1"]), input, select, textarea',
          ) ?? drawerContentRef.current;
        target?.focus({ preventScroll: true });
        shouldFocusDrawerRef.current = false;
      });
      return () => window.cancelAnimationFrame(id);
    } else if (!drawerOpen && shouldRestoreDrawerToggleRef.current) {
      // Restore focus to the toggle when drawer collapses
      drawerToggleRef.current?.focus({ preventScroll: true });
      shouldRestoreDrawerToggleRef.current = false;
    }
  }, [drawerOpen, previewExpanded]);

  // Escape key closes the drawer when open
  useEffect(() => {
    if (!previewExpanded || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        shouldRestoreDrawerToggleRef.current = true;
        setDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, previewExpanded]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || generating) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setAnnouncement(`Generation started: ${prompt.trim().slice(0, 120)}`);
    try {
      const projectId = activeProject?.id ?? "scratch";
      const draft = await generateDraft(projectId, prompt.trim(), {
        signal: controller.signal,
        onEvent: (e) => {
          if (e.status === "running") setAnnouncement(`Step: ${e.label}`);
        },
      });
      notificationService.push({ title: "Draft ready", body: draft.summary, kind: "success" });
      setAnnouncement(`Generation complete · ${draft.files.length} file${draft.files.length === 1 ? "" : "s"}`);
    } catch (e) {
      const err = normalizeError(e);
      toast.error(err.userMessage);
      setAnnouncement(`Generation failed: ${err.userMessage}`);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setGenerating(false);
    }
  }, [prompt, generating, activeProject?.id]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // Auto-collapse the drawer to peek state while generating; expand on completion.
  // Only applies when the preview is expanded (drawer is mounted).
  const wasGeneratingRef = useRef(false);
  useEffect(() => {
    if (!previewExpanded) {
      wasGeneratingRef.current = generating;
      return;
    }
    if (generating && !wasGeneratingRef.current) {
      // Generation just started → peek (fade contents out, keep panel in place)
      shouldFocusDrawerRef.current = false;
      shouldRestoreDrawerToggleRef.current = false;
      setDrawerOpen(false);
    } else if (!generating && wasGeneratingRef.current) {
      // Generation just completed → reveal contents via fade-in (no translate)
      shouldFocusDrawerRef.current = false;
      shouldRestoreDrawerToggleRef.current = false;
      setDrawerOpen(true);
      setAnnouncement("Generation complete");
    }
    wasGeneratingRef.current = generating;
  }, [generating, previewExpanded]);

  // Announce when new activity items are added to the drawer
  useEffect(() => {
    const count = activityLog.length;
    if (count > prevItemCountRef.current) {
      const added = activityLog.slice(prevItemCountRef.current);
      const summary = added.map((s) => s.text).join(", ");
      setAnnouncement(
        `${added.length} new activity ${added.length === 1 ? "item" : "items"}: ${summary}`,
      );
    }
    prevItemCountRef.current = count;
  }, []);

  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row gap-4 p-4 md:p-6">
      {/* Live region: announces generation state and new activity items */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      {/* Left column: composer + templates (stacked, scrollable) */}
      <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col gap-4">
        <div className="glass-panel p-6 md:p-8 anim-in shrink-0">
          <PromptComposer
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            generating={generating}
            onStop={() => {
              abortRef.current?.abort();
              abortRef.current = null;
              setGenerating(false);
              setAnnouncement("Generation stopped");
            }}
          />
        </div>
        <div className="glass-panel p-6 md:p-8 anim-in flex-1 min-h-0 overflow-y-auto">
          <TemplateGrid />
        </div>
      </div>

      {/* Right column: preview fills the full right side */}
      <div className="relative flex flex-col gap-4 shrink-0 w-full md:w-[50vw] min-h-0">
        {/* Expand/collapse preview toggle */}
        <div className="flex items-center justify-end shrink-0">
          <button
            onClick={() => {
              setPreviewExpanded((v) => {
                const next = !v;
                if (next) setDrawerOpen(false);
                return next;
              });
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition"
            aria-label={previewExpanded ? "Restore activity panel" : "Expand preview"}
          >
            {previewExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {previewExpanded ? "Restore" : "Expand"}
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <PreviewFrame />
        </div>

        {rightPanelOpen && !previewExpanded && (
          <aside
            className="shrink-0 max-h-[40vh] overflow-hidden"
            aria-label="Activity panel"
          >
            <ActivityPanel generating={generating} />
          </aside>
        )}

        {/* Bottom drawer (only when preview is expanded) */}
        {rightPanelOpen && previewExpanded && (
          <section
            ref={drawerRef}
            role="region"
            aria-label="Activity drawer"
            className="absolute left-0 right-0 bottom-0 z-20"
          >
            <button
              ref={drawerToggleRef}
              onClick={() => {
                shouldFocusDrawerRef.current = !drawerOpen;
                shouldRestoreDrawerToggleRef.current = drawerOpen;
                setDrawerOpen((v) => !v);
              }}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-t-2xl glass border-b border-border text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={drawerOpen ? "Collapse activity drawer" : "Expand activity drawer"}
              aria-expanded={drawerOpen}
              aria-controls="ai-activity-drawer-content"
            >
              {drawerOpen ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />}
              Activity
              <span
                className={cn(
                  "ml-1 h-1.5 w-1.5 rounded-full",
                  generating ? "bg-violet animate-pulse" : "bg-surface-3 border border-border",
                )}
                role="status"
                aria-label={generating ? "Generating" : "Idle"}
              />
            </button>
            <div
              id="ai-activity-drawer-content"
              ref={drawerContentRef}
              role="group"
              aria-label="Activity log"
              tabIndex={-1}
              aria-hidden={!drawerOpen}
              {...(!drawerOpen ? { inert: "" as unknown as boolean } : {})}
              className={cn(
                "overflow-hidden focus:outline-none [&_aside]:animate-none",
                "transition-[max-height,opacity] duration-300 ease-fluid",
                drawerOpen
                  ? "max-h-[50vh] opacity-100 overflow-y-auto"
                  : "max-h-0 opacity-0 pointer-events-none",
              )}
            >
              <ActivityPanel generating={generating} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
