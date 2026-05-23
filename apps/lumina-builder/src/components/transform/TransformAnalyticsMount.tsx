import { useEffect, useState, useCallback } from "react";
import { Activity } from "lucide-react";
import { TransformAnalyticsPanel } from "./TransformAnalyticsPanel";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/context/WorkspaceContext";

const OPEN_EVENT = "kl:open-transform-analytics";
const STORAGE_KEY = "kl:transform-analytics:open-by-view";

type OpenMap = Record<string, boolean>;

function readMap(): OpenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OpenMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: OpenMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Programmatic opener — used from CommandPalette. */
export function openTransformAnalytics() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/**
 * Mounts the analytics sheet + a small floating trigger pill (dev affordance).
 * Hidden entirely when the transform feature flag is off.
 */
export function TransformAnalyticsMount() {
  const enabled = isFeatureEnabled("transform_to_website");
  const { view } = useWorkspace();
  const showPill = view === "workspace" || view === "dashboard";

  const [open, setOpenState] = useState<boolean>(() => !!readMap()[view]);

  // When view changes, restore that view's persisted open state.
  useEffect(() => {
    setOpenState(!!readMap()[view]);
  }, [view]);

  const setOpen = useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (next) => {
      setOpenState((prev) => {
        const value = typeof next === "function" ? (next as (p: boolean) => boolean)(prev) : next;
        const map = readMap();
        map[view] = value;
        writeMap(map);
        return value;
      });
    },
    [view],
  );

  useEffect(() => {
    if (!enabled) return;
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    // Keyboard shortcut: ⌘⇧A / Ctrl⇧A
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled, setOpen]);

  if (!enabled) return null;

  return (
    <>
      {showPill && (
        <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-4 left-20 z-40 group",
          "h-9 px-3 rounded-full flex items-center gap-1.5",
          "glass-strong border border-gold/30 text-[11px] uppercase tracking-widest text-foreground/85",
          "shadow-[0_8px_24px_-12px_hsl(var(--gold)/0.6)] hover:shadow-[0_10px_32px_-10px_hsl(var(--gold)/0.8)]",
          "hover:border-gold/60 hover:text-foreground transition-all"
        )}
        title="Transform funnel analytics (⌘⇧A)"
        >
          <Activity className="h-3 w-3 text-gold group-hover:animate-pulse" />
          Funnel
        </button>
      )}
      <TransformAnalyticsPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
