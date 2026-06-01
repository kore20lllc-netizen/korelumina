import { useEffect, useRef, useState, type RefObject } from "react";
import { toast } from "sonner";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  ChevronRight, ChevronDown, FolderClosed, FolderOpen, FileCode2,
  Play, Save, RotateCcw, X, Circle, Crosshair, Lock, LockOpen, Eraser, HelpCircle, Keyboard, Search,
} from "lucide-react";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import { DevAIAssistPanel, DevAIAssistTrigger } from "./dev/DevAIAssistPanel";
import { TransformButton } from "@/components/transform/TransformButton";
import { useRuntimeBoot } from "@/hooks/useRuntimeBoot";

export interface EditorSelection {
  text: string;
  startLine: number; // 1-based
  endLine: number;   // 1-based
  pinned?: boolean;
}

/**
 * Merge two lists of line ranges in document order, dropping exact duplicates
 * (same start/end). Overlapping but non-identical ranges are kept separate so
 * the user can still see and remove them individually.
 */
function mergeRanges(a: EditorSelection[], b: EditorSelection[]): EditorSelection[] {
  const all = [...a, ...b];
  const seen = new Set<string>();
  const out: EditorSelection[] = [];
  for (const r of all) {
    const key = `${r.startLine}:${r.endLine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out.sort((x, y) => x.startLine - y.startLine || x.endLine - y.endLine);
}

interface Node { name: string; type: "file" | "folder"; children?: Node[] }

const fileTree: Node[] = [
  { name: "src", type: "folder", children: [
    { name: "components", type: "folder", children: [
      { name: "Hero.tsx", type: "file" },
      { name: "Nav.tsx", type: "file" },
    ]},
    { name: "pages", type: "folder", children: [
      { name: "Home.tsx", type: "file" },
      { name: "Pricing.tsx", type: "file" },
    ]},
    { name: "App.tsx", type: "file" },
    { name: "main.tsx", type: "file" },
  ]},
  { name: "package.json", type: "file" },
  { name: "tailwind.config.ts", type: "file" },
];

function TreeNode({ node, depth = 0, openTabs, setOpenTabs, active, setActive }: {
  node: Node; depth?: number;
  openTabs: string[]; setOpenTabs: (t: string[]) => void;
  active: string; setActive: (s: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ paddingLeft: 6 + depth * 12 }}
          className="flex items-center gap-1 w-full h-7 pr-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-1 transition"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 text-violet" /> : <FolderClosed className="h-3.5 w-3.5 text-violet" />}
          <span>{node.name}</span>
        </button>
        {open && node.children?.map((c) => (
          <TreeNode key={c.name} node={c} depth={depth + 1} openTabs={openTabs} setOpenTabs={setOpenTabs} active={active} setActive={setActive} />
        ))}
      </div>
    );
  }
  const isActive = active === node.name;
  return (
    <button
      onClick={() => {
        setActive(node.name);
        if (!openTabs.includes(node.name)) setOpenTabs([...openTabs, node.name]);
      }}
      style={{ paddingLeft: 18 + depth * 12 }}
      className={cn(
        "flex items-center gap-2 w-full h-7 pr-2 rounded-md text-sm transition",
        isActive ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
      )}
    >
      <FileCode2 className={cn("h-3.5 w-3.5", isActive && "text-cyan")} />
      <span>{node.name}</span>
    </button>
  );
}

const sampleCode = `import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <Hero
        title="Build, alive."
        subtitle="An AI-native studio for creators, designers and developers."
      />
      <Features />
    </main>
  );
}`;

const tokens = (line: string) => {
  // very small syntax highlighter for the demo
  return line
    .replace(/(\/\/[^\n]*)/g, '<span class="text-muted-foreground">$1</span>')
    .replace(/("[^"]*")/g, '<span class="text-gold">$1</span>')
    .replace(/\b(import|from|export|default|return|function|const|let|var)\b/g, '<span class="text-magenta">$1</span>')
    .replace(/\b(Hero|Features)\b/g, '<span class="text-cyan">$1</span>')
    .replace(/(&lt;\/?\w+)/g, '<span class="text-violet">$1</span>');
};

export function DeveloperWorkspace() {
  const [openTabs, setOpenTabs] = useState<string[]>(["Home.tsx", "Hero.tsx"]);
  const [active, setActive] = useState("Home.tsx");
  const { setBottomDockOpen, setCommandOpen, activeProject } = useWorkspace();
  const projectId = activeProject?.id ?? null;
  const { runtimeUrl } = useRuntimeBoot(projectId);
  // Per-file editable buffers so AI Assist can refactor / insert into them.
  const [buffers, setBuffers] = useState<Record<string, string>>({ "Home.tsx": sampleCode });
  const [aiOpen, setAiOpen] = useState(false);

  // Lazily seed a buffer for newly-opened tabs so the editor stays populated.
  useEffect(() => {
    if (active && buffers[active] === undefined) {
      setBuffers((b) => ({ ...b, [active]: sampleCode }));
    }
  }, [active, buffers]);

  const activeCode = buffers[active] ?? sampleCode;
  const setActiveCode = (next: string) =>
    setBuffers((b) => ({ ...b, [active]: next }));

  // Live text-selection capture from the rendered code area.
  const codeAreaRef = useRef<HTMLPreElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [liveSelection, setLiveSelection] = useState<EditorSelection | null>(null);
  const [pinned, setPinned] = useState<EditorSelection[]>([]);
  const [focusedBand, setFocusedBand] = useState<number | null>(null);
  // Multi-band focus set (in addition to the primary `focusedBand`). Cmd/Ctrl+click toggles.
  const [focusedSet, setFocusedSet] = useState<Set<number>>(new Set());
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);
  // Sticky-header help overlay (band shortcuts cheat-sheet).
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpQuery, setHelpQuery] = useState("");
  const helpInputRef = useRef<HTMLInputElement>(null);
  // Auto-focus and reset the search field whenever the overlay opens.
  useEffect(() => {
    if (helpOpen) {
      setHelpQuery("");
      const t = window.setTimeout(() => helpInputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [helpOpen]);
  // Keyboard-only navigation mode: visually marks the bands that respond to L / J / Esc / Shift+C.
  const [keyboardNav, setKeyboardNav] = useState(false);
  // Indices currently fading out after a "Clear bands" action — used purely for animation.
  const [fadingSet, setFadingSet] = useState<Set<number>>(new Set());
  const fadeTimer = useRef<number | null>(null);
  const clearFocusedSetAnimated = () => {
    if (focusedSet.size === 0) return;
    const snapshot = new Set(focusedSet);
    setFadingSet((prev) => {
      const next = new Set(prev);
      snapshot.forEach((i) => next.add(i));
      return next;
    });
    setFocusedSet(new Set());
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setFadingSet(new Set());
      fadeTimer.current = null;
    }, 380);
  };
  useEffect(() => () => { if (fadeTimer.current) window.clearTimeout(fadeTimer.current); }, []);
  useEffect(() => {
    setFocusedBand((cur) => (cur !== null && cur < (liveSelection ? 1 : 0) + pinned.length ? cur : null));
    setFocusedSet((prev) => {
      const max = (liveSelection ? 1 : 0) + pinned.length;
      const next = new Set<number>();
      prev.forEach((i) => { if (i < max) next.add(i); });
      return next;
    });
    setHoveredBand(null);
  }, [liveSelection, pinned]);

  // Scroll the code view so a given selection band is vertically centered.
  const jumpToBand = (index: number | null) => {
    if (index === null) return;
    const scroller = scrollerRef.current;
    const pre = codeAreaRef.current;
    const sel = selections[index];
    if (!scroller || !pre || !sel) return;
    const lineEls = Array.from(pre.children) as HTMLElement[];
    const start = lineEls[sel.startLine - 1];
    const end = lineEls[sel.endLine - 1];
    if (!start || !end) return;
    // pre is offset from scroller by gutter alignment (same vertical), plus py-4 (16px)
    const bandTop = pre.offsetTop + start.offsetTop + 16;
    const bandHeight = end.offsetTop + end.offsetHeight - start.offsetTop;
    const target = bandTop - (scroller.clientHeight - bandHeight) / 2;
    scroller.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  };

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      const root = codeAreaRef.current;
      if (!sel || !root || sel.rangeCount === 0) { setLiveSelection(null); return; }

      const lineEls = Array.from(root.children) as HTMLElement[];
      const lineOf = (node: globalThis.Node | null): number => {
        if (!node) return -1;
        let el: HTMLElement | null =
          node.nodeType === 1 ? (node as unknown as HTMLElement) : node.parentElement;
        while (el && el.parentElement !== root) el = el.parentElement;
        return el ? lineEls.indexOf(el) : -1;
      };

      // Walk every Range — Firefox supports >1 (Ctrl+drag); Chromium gives 1.
      const captured: EditorSelection[] = [];
      for (let i = 0; i < sel.rangeCount; i++) {
        const r = sel.getRangeAt(i);
        if (r.collapsed) continue;
        const start = r.startContainer;
        const end = r.endContainer;
        if (!root.contains(start) || !root.contains(end)) continue;
        const text = r.toString();
        if (!text.trim()) continue;
        const a = lineOf(start);
        const b = lineOf(end);
        if (a < 0 || b < 0) continue;
        captured.push({ text, startLine: Math.min(a, b) + 1, endLine: Math.max(a, b) + 1 });
      }
      if (captured.length === 0) { setLiveSelection(null); return; }
      // Use the first as "primary live selection"; extras (Firefox) get pinned automatically.
      setLiveSelection(captured[0]);
      if (captured.length > 1) {
        setPinned((prev) => mergeRanges(prev, captured.slice(1).map((s) => ({ ...s, pinned: true }))));
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [active]); // re-bind when active file changes (DOM is recreated)

  // Drop selections when switching files.
  useEffect(() => { setLiveSelection(null); setPinned([]); }, [active]);

  // Combined ordered list of selections passed to the panel.
  const selections = mergeRanges(
    pinned,
    liveSelection ? [liveSelection] : []
  );

  const pinCurrent = () => {
    if (!liveSelection) {
      toast("Select some code first to pin");
      return;
    }
    setPinned((prev) => mergeRanges(prev, [{ ...liveSelection, pinned: true }]));
    window.getSelection()?.removeAllRanges();
    setLiveSelection(null);
    toast(`Pinned L${liveSelection.startLine}–L${liveSelection.endLine}`);
  };

  // Alt+P to pin the live selection while focus is in the editor area.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "p") {
        // Only react if the live selection is inside our editor.
        if (liveSelection) { e.preventDefault(); pinCurrent(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveSelection]);

  // Band keyboard shortcuts (Developer workspace):
  //   L      → lock/unlock the current band (hovered if no focus, else focused)
  //   J      → jump-to-band (centers it in the code view)
  //   Esc/C  → clear focus + multi-select set
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const k = e.key.toLowerCase();
      // current band: explicit focus wins, else hover
      const current = focusedBand ?? hoveredBand;
      // Shift+C → clear only the multi-band set (keeps primary lock), animated
      if (e.shiftKey && k === "c") {
        if (focusedSet.size === 0) return;
        e.preventDefault();
        const count = focusedSet.size;
        clearFocusedSetAnimated();
        toast(`Cleared ${count} additional band${count === 1 ? "" : "s"}`);
        return;
      }
      if (e.shiftKey) return;
      if (k === "l") {
        if (current === null) { toast("Hover a band first to lock"); return; }
        e.preventDefault();
        setFocusedBand((cur) => (cur === current ? null : current));
        toast(focusedBand === current ? "Band unlocked" : `Locked L${selections[current]?.startLine}–L${selections[current]?.endLine}`);
      } else if (k === "j") {
        if (current === null) { toast("Hover a band first to jump"); return; }
        e.preventDefault();
        jumpToBand(current);
      } else if (k === "escape" || k === "c") {
        if (focusedBand === null && focusedSet.size === 0 && hoveredBand === null) return;
        e.preventDefault();
        setFocusedBand(null);
        setFocusedSet(new Set());
        setHoveredBand(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedBand, hoveredBand, focusedSet, selections]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 p-4 md:p-6">
      {/* Action bar */}
      <div className="flex items-center gap-2 shrink-0">
        <LuminaButton size="sm" variant="ghost" onClick={() => toast.success(`${active} saved`)}>
          <Save className="h-3.5 w-3.5" /><span className="hidden md:inline">Save</span>
        </LuminaButton>
        <LuminaButton size="sm" variant="ghost" onClick={() => toast("Reverted to last saved")}>
          <RotateCcw className="h-3.5 w-3.5" /><span className="hidden md:inline">Revert</span>
        </LuminaButton>
        <LuminaButton size="sm" variant="ghost" onClick={() => setCommandOpen(true)} className="hidden md:inline-flex">
          <Search className="h-3.5 w-3.5" />Command
        </LuminaButton>
        <TransformButton source="builder" project={activeProject} />
        <LuminaButton size="sm" variant="primary" onClick={() => { setBottomDockOpen(true); toast.success("Build started"); }}>
          <Play className="h-3.5 w-3.5" /><span className="hidden sm:inline">Build</span>
        </LuminaButton>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        {/* File tree */}
        <aside className="w-full lg:w-60 shrink-0 glass-panel p-3 max-h-[30vh] lg:max-h-none overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2 mb-2">Explorer</div>
          <div>
            {fileTree.map((n) => (
              <TreeNode key={n.name} node={n} openTabs={openTabs} setOpenTabs={setOpenTabs} active={active} setActive={setActive} />
            ))}
          </div>
        </aside>

        {/* Editor */}
        <div className="flex-1 min-w-0 flex flex-col glass-panel overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border overflow-x-auto">
            {openTabs.map((t) => {
              const isActive = active === t;
              return (
                <button
                  key={t}
                  onClick={() => setActive(t)}
                  className={cn(
                    "group relative flex items-center gap-2 h-9 pl-3 pr-2 rounded-t-lg text-xs transition shrink-0",
                    isActive ? "bg-background/60 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
                  )}
                >
                  <Circle className={cn("h-1.5 w-1.5 fill-current", isActive ? "text-cyan" : "text-muted-foreground/50")} />
                  {t}
                  <span
                    onClick={(e) => { e.stopPropagation(); setOpenTabs(openTabs.filter((x) => x !== t)); if (active === t) setActive(openTabs.filter((x) => x !== t)[0] ?? ""); }}
                    className="h-4 w-4 grid place-items-center rounded hover:bg-surface-3 ml-1"
                  >
                    <X className="h-3 w-3" />
                  </span>
                  {isActive && <span className="absolute bottom-0 inset-x-2 h-px bg-button-lumina" />}
                </button>
              );
            })}
          </div>

          {/* Code area */}
          <div ref={scrollerRef} className="flex-1 min-h-0 overflow-auto font-mono text-[13px] leading-6">
            {(() => {
              // Aggregate set for the header: focused multi-set + primary focus + hover (de-duped).
              const ids = new Set<number>(focusedSet);
              if (focusedBand !== null) ids.add(focusedBand);
              if (hoveredBand !== null) ids.add(hoveredBand);
              if (ids.size === 0) return null;
              const items = Array.from(ids)
                .map((i) => ({ i, sel: selections[i] }))
                .filter((x) => x.sel)
                .sort((a, b) => a.sel.startLine - b.sel.startLine);
              if (items.length === 0) return null;

              const isMulti = items.length > 1;
              const allPinned = items.every((x) => x.sel.pinned);
              const allLive = items.every((x) => !x.sel.pinned);
              const tone = allPinned ? "violet" : allLive ? "cyan" : "mixed";
              const minStart = items[0].sel.startLine;
              const maxEnd = items.reduce((m, x) => Math.max(m, x.sel.endLine), 0);
              const totalLines = items.reduce((n, x) => n + (x.sel.endLine - x.sel.startLine + 1), 0);
              const totalChars = items.reduce((n, x) => n + x.sel.text.length, 0);
              const primaryIdx = focusedBand ?? hoveredBand ?? items[0].i;
              const isFocused = focusedSet.has(primaryIdx) || focusedBand === primaryIdx;

              const toneClasses =
                tone === "violet"
                  ? "bg-violet/10 border-violet/40 text-violet"
                  : tone === "cyan"
                    ? "bg-cyan/10 border-cyan/40 text-cyan"
                    : "bg-foreground/5 border-foreground/30 text-foreground";

              return (
                <div
                  className={cn(
                    "sticky top-0 z-20 flex items-center justify-between gap-2 px-3 h-7 border-b backdrop-blur-md text-[11px] font-mono",
                    toneClasses,
                  )}
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    {isMulti ? (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-cyan"
                          style={{ boxShadow: "0 0 6px hsl(var(--cyan) / 0.8)" }}
                        />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-violet -ml-0.5"
                          style={{ boxShadow: "0 0 6px hsl(var(--violet) / 0.8)" }}
                        />
                      </span>
                    ) : (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: `hsl(var(--${tone === "violet" ? "violet" : "cyan"}))`,
                          boxShadow: `0 0 6px hsl(var(--${tone === "violet" ? "violet" : "cyan"}) / 0.8)`,
                        }}
                      />
                    )}
                    <span className="uppercase tracking-wider text-[10px] opacity-80">
                      {isMulti
                        ? `${items.length} bands · ${allPinned ? "pinned" : allLive ? "live" : "mixed"}`
                        : `${items[0].sel.pinned ? "pinned" : "live"} selection`}
                    </span>
                    <span className="opacity-60">·</span>
                    {isMulti ? (
                      <span className="truncate">
                        L{minStart}–L{maxEnd} ({items.map((x) => `L${x.sel.startLine}–L${x.sel.endLine}`).join(", ")})
                      </span>
                    ) : (
                      <span>L{items[0].sel.startLine}–L{items[0].sel.endLine}</span>
                    )}
                    <span className="opacity-60">·</span>
                    <span>{totalLines} line{totalLines === 1 ? "" : "s"}</span>
                    <span className="opacity-60">·</span>
                    <span>{totalChars} chars</span>
                    {isFocused && (
                      <span className="ml-1 px-1 py-px rounded border border-current/40 text-[9px] uppercase tracking-wider opacity-80">
                        focused
                      </span>
                    )}
                  </span>
                  <span className="relative inline-flex items-center gap-1.5 shrink-0">
                    <span
                      className="hidden md:inline-flex items-center gap-1 text-[10px] opacity-70"
                      title="Keyboard shortcuts (active in the Developer workspace)"
                    >
                      <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">L</kbd>
                      <span>lock</span>
                      <span className="opacity-50">·</span>
                      <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">J</kbd>
                      <span>jump</span>
                      <span className="opacity-50">·</span>
                      <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">Esc</kbd>
                      <span className="opacity-50">/</span>
                      <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">C</kbd>
                      <span>clear</span>
                      {isMulti && (
                        <>
                          <span className="opacity-50">·</span>
                          <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">⇧</kbd>
                          <span className="opacity-70">+</span>
                          <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">C</kbd>
                          <span>clear bands</span>
                        </>
                      )}
                      {isMulti && (
                        <>
                          <span className="opacity-50">·</span>
                          <kbd className="px-1 py-px rounded border border-current/40 font-mono text-[9px] leading-none">⌘</kbd>
                          <span>+click multi</span>
                        </>
                      )}
                    </span>
                    {focusedSet.size > 0 && (
                      <button
                        onClick={clearFocusedSetAnimated}
                        title="Clear additional bands — keeps the locked primary band (Shift+C)"
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10 transition text-[10px]"
                      >
                        <Eraser className="h-3 w-3" />
                        Clear bands
                        <span className="opacity-70">({focusedSet.size})</span>
                      </button>
                    )}
                    <button
                      onClick={() => jumpToBand(primaryIdx)}
                      title={`Scroll to L${selections[primaryIdx]?.startLine}–L${selections[primaryIdx]?.endLine} (J)`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-current/40 hover:bg-current/10 transition text-[10px]"
                    >
                      <Crosshair className="h-3 w-3" />
                      Jump
                    </button>
                    <button
                      onClick={() =>
                        setFocusedBand((cur) => (cur === primaryIdx ? null : primaryIdx))
                      }
                      title={isFocused ? "Unlock — header follows hover (L)" : "Lock — keep this band focused while you scroll (L)"}
                      aria-pressed={isFocused}
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition text-[10px]",
                        isFocused
                          ? "border-current bg-current/15"
                          : "border-current/40 hover:bg-current/10",
                      )}
                    >
                      {isFocused ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                      {isFocused ? "Locked" : "Lock"}
                    </button>
                    {(isFocused || focusedSet.size > 0) && (
                      <button
                        onClick={() => { setFocusedBand(null); setHoveredBand(null); clearFocusedSetAnimated(); }}
                        title="Clear focus (Esc / C)"
                        className="grid place-items-center h-5 w-5 rounded border border-current/40 hover:bg-current/10 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => setKeyboardNav((v) => !v)}
                      title={keyboardNav
                        ? "Disable keyboard-only navigation"
                        : "Enable keyboard-only navigation — highlights bands that respond to L / J / Esc / Shift+C"}
                      aria-pressed={keyboardNav}
                      aria-label="Toggle keyboard-only navigation"
                      className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border transition text-[10px]",
                        keyboardNav
                          ? "border-current bg-current/15"
                          : "border-current/40 hover:bg-current/10",
                      )}
                    >
                      <Keyboard className="h-3 w-3" />
                      <span className="hidden md:inline">{keyboardNav ? "Kbd nav" : "Kbd"}</span>
                    </button>
                    <button
                      onClick={() => setHelpOpen((v) => !v)}
                      title="Show all band shortcuts"
                      aria-expanded={helpOpen}
                      aria-label="Band shortcuts help"
                      className={cn(
                        "grid place-items-center h-5 w-5 rounded border transition",
                        helpOpen ? "border-current bg-current/15" : "border-current/40 hover:bg-current/10",
                      )}
                    >
                      <HelpCircle className="h-3 w-3" />
                    </button>
                    {helpOpen && (
                      <>
                        {/* Click-away catcher */}
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setHelpOpen(false)}
                          aria-hidden
                        />
                        <div
                          role="dialog"
                          aria-label="Band navigation shortcuts"
                          className="absolute right-0 top-full mt-1.5 z-40 w-72 rounded-lg border border-border bg-popover/95 text-popover-foreground backdrop-blur-md shadow-float p-3 text-[11px] font-sans anim-in"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                              Band shortcuts
                            </span>
                            <button
                              onClick={() => setHelpOpen(false)}
                              className="grid place-items-center h-5 w-5 rounded hover:bg-surface-2 transition"
                              aria-label="Close shortcuts help"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="relative mb-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-60" />
                            <input
                              ref={helpInputRef}
                              value={helpQuery}
                              onChange={(e) => setHelpQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  e.stopPropagation();
                                  if (helpQuery) { setHelpQuery(""); }
                                  else { setHelpOpen(false); }
                                }
                              }}
                              placeholder="Search shortcuts (e.g. Shift+C, Esc, jump)"
                              aria-label="Search shortcuts"
                              className="w-full pl-7 pr-7 py-1 rounded border border-border bg-surface-1 text-[11px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-current/60"
                            />
                            {helpQuery && (
                              <button
                                onClick={() => { setHelpQuery(""); helpInputRef.current?.focus(); }}
                                aria-label="Clear search"
                                className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center h-5 w-5 rounded hover:bg-surface-2 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {(() => {
                            const allRows: { keys: string[]; label: string; aliases?: string[] }[] = [
                              { keys: ["L"], label: "Lock / unlock current band", aliases: ["lock", "unlock", "focus"] },
                              { keys: ["J"], label: "Jump to active band", aliases: ["jump", "scroll", "center"] },
                              { keys: ["Esc"], label: "Clear all focus & bands", aliases: ["escape", "clear", "reset"] },
                              { keys: ["C"], label: "Clear all focus & bands", aliases: ["clear", "reset"] },
                              { keys: ["⇧", "C"], label: "Clear extra bands (keep lock)", aliases: ["shift", "shift+c", "clear bands", "multi"] },
                              { keys: ["⌘", "click"], label: "Add band to multi-selection", aliases: ["cmd", "ctrl", "meta", "multi", "additive"] },
                              { keys: ["⌥", "P"], label: "Pin current text selection", aliases: ["alt", "option", "pin"] },
                              { keys: ["dbl-click"], label: "Jump to clicked band", aliases: ["double click", "double-click", "jump"] },
                            ];
                            const q = helpQuery.trim().toLowerCase().replace(/\s+/g, " ");
                            const norm = (s: string) => s.toLowerCase()
                              .replace(/⇧/g, "shift").replace(/⌘/g, "cmd")
                              .replace(/⌥/g, "alt").replace(/⌃/g, "ctrl");
                            const matches = (row: typeof allRows[number]) => {
                              if (!q) return true;
                              const keyStr = norm(row.keys.join("+"));
                              const keyStrSpaced = norm(row.keys.join(" "));
                              const hay = [row.label, ...(row.aliases ?? []), keyStr, keyStrSpaced]
                                .join(" ").toLowerCase();
                              return hay.includes(q) || keyStr.includes(q.replace(/\s+/g, ""));
                            };
                            const rows = allRows.filter(matches);
                            if (rows.length === 0) {
                              return (
                                <div className="py-3 text-center text-[11px] text-muted-foreground">
                                  No shortcuts match “{helpQuery}”.
                                </div>
                              );
                            }
                            return (
                              <ul className="grid grid-cols-1 gap-1.5 max-h-64 overflow-auto pr-1">
                                {rows.map((row, i) => (
                                  <li key={i} className="flex items-center justify-between gap-2">
                                    <span className="text-foreground/85">{row.label}</span>
                                    <span className="inline-flex items-center gap-1 shrink-0">
                                      {row.keys.map((k, j) => (
                                        <span key={j} className="inline-flex items-center gap-1">
                                          {j > 0 && <span className="opacity-50 text-[9px]">+</span>}
                                          <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 font-mono text-[10px] leading-none">
                                            {k}
                                          </kbd>
                                        </span>
                                      ))}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
                          <p className="mt-2 pt-2 border-t border-border text-[10px] opacity-60">
                            Shortcuts ignore inputs, textareas & contenteditable.
                          </p>
                        </div>
                      </>
                    )}
                  </span>
                </div>
              );
            })()}
            <div className="flex relative">
              {/* Gutter — also receives selection-range tick marks */}
              <div className="relative select-none text-right pr-4 pl-4 py-4 text-muted-foreground/60 bg-background/30 border-r border-border">
                {activeCode.split("\n").map((_, i) => <div key={i}>{i + 1}</div>)}
                <SelectionGutter
                  codeAreaRef={codeAreaRef}
                  selections={selections}
                  focusedIndex={focusedBand}
                  hoveredIndex={hoveredBand}
                  focusedSet={focusedSet}
                  fadingSet={fadingSet}
                  keyboardNav={keyboardNav}
                />
              </div>
              {/* Code + overlay */}
              <div className="relative flex-1 min-w-0">
                <pre ref={codeAreaRef} className="py-4 pl-4 pr-6 whitespace-pre overflow-x-auto relative z-10">
                  {activeCode.split("\n").map((line, i) => (
                    <div key={i} className="text-foreground/90" dangerouslySetInnerHTML={{ __html: tokens(line.replace(/</g, "&lt;")) || "&nbsp;" }} />
                  ))}
                </pre>
                <SelectionOverlay
                  codeAreaRef={codeAreaRef}
                  selections={selections}
                  focusedIndex={focusedBand}
                  hoveredIndex={hoveredBand}
                  focusedSet={focusedSet}
                  fadingSet={fadingSet}
                  keyboardNav={keyboardNav}
                  onHover={setHoveredBand}
                  onFocus={(i, additive) => {
                    if (additive) {
                      setFocusedSet((prev) => {
                        const next = new Set(prev);
                        // ensure primary focus is included before toggling additions
                        if (focusedBand !== null) next.add(focusedBand);
                        if (next.has(i)) next.delete(i);
                        else next.add(i);
                        return next;
                      });
                    } else {
                      setFocusedSet(new Set());
                      setFocusedBand((cur) => (cur === i ? null : i));
                    }
                  }}
                  onJump={jumpToBand}
                />
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between gap-3 px-3 h-8 border-t border-border text-[11px] text-muted-foreground bg-background/40">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_6px_hsl(var(--cyan))]" /> connected</span>
              <span>TypeScript</span>
              <span>UTF-8</span>
            </div>
            <div className="flex items-center gap-3">
              {selections.length > 0 ? (
                <span className="text-cyan inline-flex items-center gap-1.5">
                  {selections.length === 1
                    ? `Sel L${selections[0].startLine}–L${selections[0].endLine} · ${selections[0].text.length} chars`
                    : `${selections.length} selections · ${selections.reduce((n, s) => n + s.text.length, 0)} chars`}
                  {liveSelection && (
                    <button
                      onClick={pinCurrent}
                      title="Pin selection (Alt+P) so you can add another"
                      className="px-1.5 py-0.5 rounded border border-cyan/40 hover:bg-cyan/10 transition text-[10px]"
                    >
                      + Pin
                    </button>
                  )}
                  {(focusedBand !== null || hoveredBand !== null) && (() => {
                    const idx = focusedBand ?? hoveredBand!;
                    const s = selections[idx];
                    if (!s) return null;
                    const tone = s.pinned ? "violet" : "cyan";
                    return (
                      <button
                        onClick={() => jumpToBand(idx)}
                        title={`Scroll to L${s.startLine}–L${s.endLine}`}
                        className={cn(
                          "px-1.5 py-0.5 rounded border transition text-[10px] inline-flex items-center gap-1",
                          tone === "violet"
                            ? "border-violet/40 text-violet hover:bg-violet/10"
                            : "border-cyan/40 text-cyan hover:bg-cyan/10",
                        )}
                      >
                        <Crosshair className="h-3 w-3" />
                        Jump to L{s.startLine}–L{s.endLine}
                      </button>
                    );
                  })()}
                </span>
              ) : (
                <span>Ln 14, Col 22</span>
              )}
              <span className="text-cyan">✓ no errors</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 min-h-[300px]">
          <PreviewFrame url={runtimeUrl} projectId={projectId ?? undefined} />
        </div>
      </div>

      {/* AI Assist (Dev) */}
      <DevAIAssistTrigger open={aiOpen} onClick={() => setAiOpen(true)} />
      <DevAIAssistPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        activeFile={active}
        activeCode={activeCode}
        selections={selections}
        onPinSelection={pinCurrent}
        onRemoveSelection={(idx) => {
          // Removing the live selection clears the browser range; pinned ones drop from state.
          const target = selections[idx];
          if (!target) return;
          if (target.pinned) {
            setPinned((prev) => prev.filter((p) => !(p.startLine === target.startLine && p.endLine === target.endLine)));
          } else {
            window.getSelection()?.removeAllRanges();
            setLiveSelection(null);
          }
        }}
        onClearSelections={() => {
          window.getSelection()?.removeAllRanges();
          setLiveSelection(null);
          setPinned([]);
        }}
        onReplaceCode={setActiveCode}
        onInsertSnippet={(s) => setActiveCode(activeCode.replace(/\s*$/, "") + "\n\n" + s + "\n")}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Selection highlight overlay
// -----------------------------------------------------------------------------

interface RangeBand {
  top: number;
  height: number;
  pinned: boolean;
  index: number;
  startLine: number;
  endLine: number;
}

/**
 * Measure each selection's pixel band by reading the `<pre>`'s line <div>
 * children. Re-measures on resize, code changes, and selection updates.
 */
function useRangeBands(
  codeAreaRef: RefObject<HTMLPreElement>,
  selections: EditorSelection[],
): RangeBand[] {
  const [bands, setBands] = useState<RangeBand[]>([]);

  useEffect(() => {
    const root = codeAreaRef.current;
    if (!root) { setBands([]); return; }

    const measure = () => {
      const lineEls = Array.from(root.children) as HTMLElement[];
      if (lineEls.length === 0) { setBands([]); return; }
      const next: RangeBand[] = [];
      selections.forEach((s, index) => {
        const start = lineEls[s.startLine - 1];
        const end = lineEls[s.endLine - 1];
        if (!start || !end) return;
        const top = start.offsetTop;
        const height = end.offsetTop + end.offsetHeight - top;
        next.push({
          top, height, pinned: !!s.pinned, index,
          startLine: s.startLine, endLine: s.endLine,
        });
      });
      setBands(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [codeAreaRef, selections]);

  return bands;
}

function SelectionOverlay({
  codeAreaRef, selections, focusedIndex, hoveredIndex, focusedSet, fadingSet, keyboardNav, onHover, onFocus, onJump,
}: {
  codeAreaRef: RefObject<HTMLPreElement>;
  selections: EditorSelection[];
  focusedIndex: number | null;
  hoveredIndex: number | null;
  focusedSet: Set<number>;
  fadingSet: Set<number>;
  keyboardNav: boolean;
  onHover: (i: number | null) => void;
  onFocus: (i: number, additive: boolean) => void;
  onJump: (i: number) => void;
}) {
  const bands = useRangeBands(codeAreaRef, selections);
  if (bands.length === 0) return null;
  const anyActive = focusedIndex !== null || hoveredIndex !== null || focusedSet.size > 0;
  // Bands that L / J / Esc / Shift+C act on:
  // explicit focus + multi-set, or the hovered band when nothing is locked.
  const keyableIds = new Set<number>(focusedSet);
  if (focusedIndex !== null) keyableIds.add(focusedIndex);
  if (keyableIds.size === 0 && hoveredIndex !== null) keyableIds.add(hoveredIndex);
  return (
    <div aria-hidden className="absolute inset-0 z-0">
      {bands.map((b) => {
        const color = b.pinned ? "var(--violet)" : "var(--cyan)";
        const isActive =
          focusedIndex === b.index || hoveredIndex === b.index || focusedSet.has(b.index);
        const isFading = fadingSet.has(b.index) && !isActive;
        const dim = anyActive && !isActive;
        const bgAlpha = isActive ? 0.22 : dim ? 0.05 : 0.10;
        const edgeAlpha = isActive ? 1 : dim ? 0.45 : 0.85;
        const edgeWidth = isActive ? 4 : 3;
        const isKeyable = keyboardNav && keyableIds.has(b.index);
        return (
          <div
            key={`${b.startLine}-${b.endLine}-${b.index}`}
            role="button"
            tabIndex={0}
            aria-label={`${b.pinned ? "Pinned" : "Live"} selection L${b.startLine}–L${b.endLine}`}
            onMouseEnter={() => onHover(b.index)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => { e.stopPropagation(); onFocus(b.index, e.metaKey || e.ctrlKey || e.shiftKey); }}
            onDoubleClick={(e) => { e.stopPropagation(); onJump(b.index); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus(b.index, e.metaKey || e.ctrlKey || e.shiftKey); } }}
            className="absolute left-0 right-0 cursor-pointer pointer-events-auto"
            style={{
              top: b.top + 16, // <pre> py-4 padding
              height: b.height,
              background: `hsl(${color} / ${bgAlpha})`,
              boxShadow: `inset ${edgeWidth}px 0 0 0 hsl(${color} / ${edgeAlpha})${isActive ? `, 0 0 0 1px hsl(${color} / 0.5), 0 0 14px hsl(${color} / 0.35)` : ""}`,
              outline: isKeyable ? `2px dashed hsl(${color} / 0.95)` : "none",
              outlineOffset: isKeyable ? -2 : 0,
              opacity: isFading ? 0 : 1,
              transform: isFading ? "scale(0.985)" : "scale(1)",
              transformOrigin: "left center",
              transition: isFading
                ? "opacity 360ms var(--ease-fluid), transform 360ms var(--ease-fluid)"
                : "opacity 150ms var(--ease-fluid), transform 150ms var(--ease-fluid), background 150ms, box-shadow 150ms",
            }}
          >
            {isActive && (
              <span
                className="absolute right-2 top-1 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none border backdrop-blur-sm"
                style={{
                  color: `hsl(${color})`,
                  borderColor: `hsl(${color} / 0.55)`,
                  background: `hsl(${color} / 0.12)`,
                }}
              >
                {b.pinned ? "pinned" : "live"} · L{b.startLine}–L{b.endLine}
              </span>
            )}
            {isKeyable && (
              <span
                className="absolute left-2 top-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono leading-none border backdrop-blur-sm uppercase tracking-wider"
                style={{
                  color: `hsl(${color})`,
                  borderColor: `hsl(${color} / 0.7)`,
                  background: `hsl(${color} / 0.15)`,
                }}
              >
                <Keyboard className="h-2.5 w-2.5" />
                L · J · ⇧C
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SelectionGutter({
  codeAreaRef, selections, focusedIndex, hoveredIndex, focusedSet, fadingSet, keyboardNav,
}: {
  codeAreaRef: RefObject<HTMLPreElement>;
  selections: EditorSelection[];
  focusedIndex: number | null;
  hoveredIndex: number | null;
  focusedSet: Set<number>;
  fadingSet: Set<number>;
  keyboardNav: boolean;
}) {
  const bands = useRangeBands(codeAreaRef, selections);
  if (bands.length === 0) return null;
  const anyActive = focusedIndex !== null || hoveredIndex !== null || focusedSet.size > 0;
  const keyableIds = new Set<number>(focusedSet);
  if (focusedIndex !== null) keyableIds.add(focusedIndex);
  if (keyableIds.size === 0 && hoveredIndex !== null) keyableIds.add(hoveredIndex);
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {bands.map((b) => {
        const color = b.pinned ? "var(--violet)" : "var(--cyan)";
        const isActive =
          focusedIndex === b.index || hoveredIndex === b.index || focusedSet.has(b.index);
        const isFading = fadingSet.has(b.index) && !isActive;
        const dim = anyActive && !isActive;
        const isKeyable = keyboardNav && keyableIds.has(b.index);
        const width = isKeyable ? 6 : isActive ? 5 : 3;
        const alpha = dim ? 0.4 : 1;
        return (
          <div
            key={`g-${b.startLine}-${b.endLine}-${b.index}`}
            className="absolute right-0 rounded-l-sm"
            style={{
              top: b.top + 16,
              height: b.height,
              width,
              background: `hsl(${color} / ${alpha})`,
              boxShadow: `0 0 ${isKeyable ? 14 : isActive ? 10 : 6}px hsl(${color} / ${isKeyable ? 0.95 : isActive ? 0.85 : 0.6})`,
              outline: isKeyable ? `1px dashed hsl(${color} / 0.9)` : "none",
              outlineOffset: isKeyable ? 1 : 0,
              opacity: isFading ? 0 : 1,
              transition: isFading
                ? "opacity 360ms var(--ease-fluid)"
                : "opacity 150ms var(--ease-fluid), background 150ms, box-shadow 150ms, width 150ms",
            }}
          />
        );
      })}
    </div>
  );
}
