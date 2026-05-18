import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles, X, Wand2, Send, Type, Palette, Layout, MessageSquare,
  Loader2, Plus, ChevronDown, Undo2, Redo2, Check, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvas, type CanvasElement } from "./canvasStore";

type Mode = "copy" | "layout" | "style" | "chat";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ label: string; onApply: () => void; appliedEntryId?: string }>;
  /** When set, renders a structured Copy-mode diff card instead of plain content. */
  copyDiff?: {
    elementId: string;
    elementLabel: string;
    before: string;
    variants: string[];
  };
}

/** A single AI Assist action that can be undone/redone. */
interface HistoryEntry {
  id: string;
  label: string;          // human-friendly e.g. "Layout: hero section"
  mode: Mode;
  before: CanvasElement[]; // full snapshot before apply
  after: CanvasElement[];  // full snapshot after apply
  at: number;
}

const modes: { id: Mode; label: string; Icon: any; hint: string }[] = [
  { id: "copy", label: "Copy", Icon: Type, hint: "Rewrite selected element" },
  { id: "layout", label: "Layout", Icon: Layout, hint: "Generate from a brief" },
  { id: "style", label: "Style", Icon: Palette, hint: "Suggest colors & accents" },
  { id: "chat", label: "Chat", Icon: MessageSquare, hint: "Ask anything" },
];

const accents: Array<CanvasElement["accent"]> = ["violet", "magenta", "cyan", "gold"];

// Mock generators (UI-only). Mimic latency for a real AI feel.
function rewriteCopy(text: string, brief?: string): string[] {
  const t = text.trim();
  const tone = (brief || "").trim();
  const tonePrefix = tone ? `${tone[0].toUpperCase()}${tone.slice(1)} · ` : "";
  // Deterministic-ish variants that visibly differ from the source.
  const base = [
    t ? `${tonePrefix}${t.replace(/\.$/, "")}, reimagined.` : `${tonePrefix}A fresh take.`,
    t ? `Meet ${t.toLowerCase().replace(/\.$/, "")} — built alive.` : "Built alive — feel the difference.",
    t ? `${t.split(" ").slice(0, 4).join(" ")}. Crafted to move.` : "Crafted to move with you.",
    t ? `Lumina-grade ${t.toLowerCase().replace(/\.$/, "")}.` : "Lumina-grade clarity, end to end.",
  ];
  return base;
}

/** Word-level diff. Returns tokens marked as equal / removed / added. */
type DiffToken = { type: "eq" | "del" | "add"; value: string };
function diffWords(a: string, b: string): DiffToken[] {
  const split = (s: string) => s.split(/(\s+)/).filter((x) => x !== "");
  const A = split(a);
  const B = split(b);
  const n = A.length, m = B.length;
  // LCS DP
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffToken[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: "eq", value: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", value: A[i] }); i++; }
    else { out.push({ type: "add", value: B[j] }); j++; }
  }
  while (i < n) { out.push({ type: "del", value: A[i++] }); }
  while (j < m) { out.push({ type: "add", value: B[j++] }); }
  return out;
}

function buildLayoutFromBrief(brief: string): Omit<CanvasElement, "id">[] {
  const accent: CanvasElement["accent"] = "violet";
  return [
    { kind: "badge", label: "Eyebrow", x: 280, y: 60, w: 200, h: 30, text: brief.slice(0, 22) || "New section", accent: "cyan" },
    { kind: "headline", label: "AI headline", x: 120, y: 110, w: 520, h: 100, text: brief ? `${brief.split(" ").slice(0, 5).join(" ")}.` : "A fresh take.", accent },
    { kind: "subhead", label: "AI subhead", x: 200, y: 235, w: 360, h: 56, text: "Generated layout — tweak everything in one click.", accent },
    { kind: "button", label: "Primary", x: 230, y: 320, w: 150, h: 44, text: "Try it", accent: "magenta" },
    { kind: "button", label: "Secondary", x: 400, y: 320, w: 150, h: 44, text: "See more", accent: "violet" },
    { kind: "card", label: "Highlight", x: 160, y: 410, w: 220, h: 130, text: "Lumina motion", accent: "cyan" },
    { kind: "card", label: "Highlight", x: 410, y: 410, w: 220, h: 130, text: "Adaptive depth", accent: "gold" },
  ];
}

export function AIAssistPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { elements, selected, replaceAll } = useCanvas();
  const [mode, setMode] = useState<Mode>("copy");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "intro", role: "assistant", content: "Hi — I’m your design copilot. Pick a mode below or just ask." },
  ]);
  // Copy-mode editable buffer (prefilled from selection).
  const [copyDraft, setCopyDraft] = useState("");
  const [copyAccent, setCopyAccent] = useState<CanvasElement["accent"]>("violet");
  const [copyDirty, setCopyDirty] = useState(false);
  // AI-only undo/redo stacks (independent from any global canvas history).
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Always read latest elements inside callbacks via a ref so closures stay fresh.
  const elementsRef = useRef(elements);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  const primary = useMemo(
    () => elements.find((e) => e.id === selected[0]),
    [elements, selected]
  );

  // Prefill copy buffer whenever the selected element changes (and user hasn't edited it).
  useEffect(() => {
    if (!primary) { setCopyDraft(""); setCopyDirty(false); return; }
    if (!copyDirty) {
      setCopyDraft(primary.text ?? primary.label ?? "");
      setCopyAccent(primary.accent ?? "violet");
    }
  }, [primary?.id, primary?.text, primary?.label, primary?.accent, copyDirty]);

  // Reset dirty flag when selection switches.
  useEffect(() => { setCopyDirty(false); }, [primary?.id]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, mode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const push = (m: Omit<ChatMsg, "id">) =>
    setMessages((p) => [...p, { ...m, id: Math.random().toString(36).slice(2, 9) }]);

  /** Wrap any canvas mutation so it becomes a reversible AI history entry. */
  const runAsHistory = (label: string, mutate: (curr: CanvasElement[]) => CanvasElement[]) => {
    const before = elementsRef.current;
    const after = mutate(before);
    replaceAll(after);
    const entry: HistoryEntry = {
      id: Math.random().toString(36).slice(2, 9),
      label,
      mode,
      before,
      after,
      at: Date.now(),
    };
    setPast((p) => [...p, entry]);
    setFuture([]); // new action invalidates redo stack
    return entry;
  };

  const undo = () => {
    setPast((p) => {
      if (p.length === 0) return p;
      const last = p[p.length - 1];
      replaceAll(last.before);
      setFuture((f) => [last, ...f]);
      toast(`Undid: ${last.label}`);
      return p.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      replaceAll(next.after);
      setPast((p) => [...p, next]);
      toast(`Redid: ${next.label}`);
      return rest;
    });
  };

  // Keyboard shortcuts while panel open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault(); redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    const text = input.trim();
    if (!text && mode !== "copy") return;
    if (busy) return;

    if (text) push({ role: "user", content: text });
    setInput("");
    setBusy(true);

    // Simulate AI latency
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));

    if (mode === "copy") {
      if (!primary) {
        push({ role: "assistant", content: "Select an element on the canvas first, then I’ll rewrite its text." });
      } else {
        const source = (copyDraft || primary.text || primary.label || "").trim();
        const variants = rewriteCopy(source, text);
        push({
          role: "assistant",
          content: `Here are 4 rewrites for **${primary.label}** — review the diff, then apply.`,
          copyDiff: {
            elementId: primary.id,
            elementLabel: primary.label,
            before: source,
            variants,
          },
        });
      }
    } else if (mode === "layout") {
      const blocks = buildLayoutFromBrief(text);
      push({
        role: "assistant",
        content: `Drafted ${blocks.length} elements for **${text || "your section"}**.`,
        actions: [
          {
            label: "Add all to canvas",
            onApply: () => {
              runAsHistory(`Layout: ${text || "section"}`, (curr) => [
                ...curr,
                ...blocks.map((b) => ({
                  ...b,
                  id: `${b.kind}-${Math.random().toString(36).slice(2, 7)}`,
                })),
              ]);
              toast(`Added ${blocks.length} elements`, { action: { label: "Undo", onClick: undo } });
            },
          },
        ],
      });
    } else if (mode === "style") {
      push({
        role: "assistant",
        content: `Try a **violet → magenta** lumina pair with **cyan** accents for highlights. Apply to the selection?`,
        actions: accents.map((a) => ({
          label: `Use ${a}`,
          onApply: () => {
            const targetIds = selected.length ? selected : elementsRef.current.map((e) => e.id);
            runAsHistory(`Style: ${a}`, (curr) =>
              curr.map((e) => (targetIds.includes(e.id) ? { ...e, accent: a } : e))
            );
            toast(`Accent set to ${a}`, { action: { label: "Undo", onClick: undo } });
          },
        })),
      });
    } else {
      push({
        role: "assistant",
        content:
          "I’d normally tap into Lovable AI here. For now I can suggest copy, layouts, and palettes — pick a mode above to try it out.",
      });
    }

    setBusy(false);
  };

  /** Apply a chosen variant from a Copy diff card. */
  const applyCopyVariant = (elementId: string, elementLabel: string, variant: string) => {
    const newLabel = variant.length > 32 ? variant.slice(0, 32) + "…" : variant;
    runAsHistory(`Copy: ${elementLabel}`, (curr) =>
      curr.map((e) =>
        e.id === elementId ? { ...e, label: newLabel, text: variant, accent: copyAccent } : e
      )
    );
    toast(`Applied: “${variant}”`, { action: { label: "Undo", onClick: undo } });
    setCopyDraft(variant);
    setCopyDirty(false);
  };

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-background/40 backdrop-blur-sm lg:hidden transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden
      />
      <aside
        role="dialog"
        aria-label="AI Assist"
        aria-hidden={!open}
        className={cn(
          "fixed z-50 right-4 bottom-4 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-6rem))]",
          "glass-panel rounded-2xl border border-white/10 shadow-[0_20px_60px_-20px_hsl(var(--violet)/0.55)]",
          "flex flex-col overflow-hidden transition-all duration-300 ease-fluid origin-bottom-right",
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <header className="flex items-center gap-2 px-3.5 h-12 border-b border-border bg-surface-1/40">
          <div className="h-7 w-7 rounded-lg bg-button-lumina grid place-items-center shadow-[0_0_14px_-2px_hsl(var(--violet)/0.7)]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">AI Assist</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Designer copilot</div>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 mr-1" role="group" aria-label="AI history">
            <button
              onClick={undo}
              disabled={past.length === 0}
              title={past.length ? `Undo: ${past[past.length - 1].label} (⌘Z)` : "Nothing to undo"}
              aria-label="Undo last AI action"
              className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 transition text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={future.length === 0}
              title={future.length ? `Redo: ${future[0].label} (⇧⌘Z)` : "Nothing to redo"}
              aria-label="Redo AI action"
              className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 transition text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            {past.length > 0 && (
              <span className="ml-1 text-[10px] tabular-nums text-muted-foreground/80 px-1">
                {past.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2 transition text-muted-foreground hover:text-foreground"
            aria-label="Close AI Assist"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Mode tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 border-b border-border bg-surface-1/20">
          {modes.map((m) => {
            const Icon = m.Icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                title={m.hint}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-12 rounded-lg text-[10px] transition",
                  active
                    ? "bg-surface-3 text-foreground ring-1 ring-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", active && "text-violet")} />
                <span className="uppercase tracking-wider">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--violet)/0.6)]"
                  : "bg-surface-1 border border-border text-foreground"
              )}
            >
              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
              {m.copyDiff && (
                <div className="mt-2 space-y-1.5">
                  {m.copyDiff.variants.map((v, i) => (
                    <CopyDiffCard
                      key={i}
                      before={m.copyDiff!.before}
                      after={v}
                      onApply={() =>
                        applyCopyVariant(m.copyDiff!.elementId, m.copyDiff!.elementLabel, v)
                      }
                    />
                  ))}
                </div>
              )}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.actions.map((a, i) => (
                    <button
                      key={i}
                      onClick={a.onApply}
                      className="text-[11px] px-2 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-border hover:border-violet/40 text-foreground/90 transition flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="bg-surface-1 border border-border rounded-2xl px-3 py-2 text-[12px] text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-violet" /> Thinking…
            </div>
          )}
        </div>

        {/* Copy-mode context editor: prefilled from selection, fully editable. */}
        {mode === "copy" && primary && (
          <div className="px-3 py-2 border-t border-border bg-surface-1/30 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                Editing: <span className="text-foreground font-medium">{primary.label}</span>
                <span className="px-1 rounded bg-surface-2 text-[9px] uppercase tracking-wider">
                  {primary.kind}
                </span>
              </span>
              {copyDirty && (
                <button
                  onClick={() => setCopyDirty(false)}
                  title="Reset to element's current text"
                  className="inline-flex items-center gap-1 hover:text-foreground transition"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> Reset
                </button>
              )}
            </div>
            <textarea
              value={copyDraft}
              onChange={(e) => { setCopyDraft(e.target.value); setCopyDirty(true); }}
              rows={2}
              placeholder="Current text…"
              className="w-full resize-none bg-surface-1 border border-border rounded-md text-[12px] px-2 py-1.5 outline-none focus:border-violet/50 transition placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Accent</span>
              {accents.map((a) => (
                <button
                  key={a}
                  onClick={() => setCopyAccent(a)}
                  title={a}
                  aria-label={`Accent ${a}`}
                  className={cn(
                    "h-4 w-4 rounded-full border transition",
                    copyAccent === a ? "ring-2 ring-offset-1 ring-offset-surface-1 ring-foreground/60 border-transparent" : "border-border hover:scale-110"
                  )}
                  style={{ background: `hsl(var(--${a}))` }}
                />
              ))}
            </div>
          </div>
        )}
        {mode === "copy" && !primary && (
          <div className="px-3 py-2 border-t border-border bg-surface-1/30 text-[11px] text-muted-foreground">
            Select an element on the canvas to edit its copy.
          </div>
        )}

        {/* Composer */}
        <div className="p-2.5 border-t border-border bg-surface-1/40">
          <div className="flex items-end gap-2 rounded-xl bg-surface-1 border border-border focus-within:border-violet/50 transition px-2 py-1.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder={
                mode === "copy"
                  ? "Optional: tone or angle (Enter to rewrite)"
                  : mode === "layout"
                  ? "Describe the section you want…"
                  : mode === "style"
                  ? "Describe the vibe (e.g. moody, energetic)"
                  : "Ask anything about your design…"
              }
              className="flex-1 bg-transparent resize-none outline-none text-[13px] py-1.5 px-1 max-h-32 placeholder:text-muted-foreground/60"
            />
            <button
              onClick={submit}
              disabled={busy || (mode !== "copy" && !input.trim())}
              className={cn(
                "h-8 w-8 grid place-items-center rounded-lg transition shrink-0",
                "bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--violet)/0.6)]",
                "hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              aria-label="Send"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="mt-1 px-1 text-[10px] text-muted-foreground/70 flex items-center justify-between">
            <span className="inline-flex items-center gap-1">
              <Wand2 className="h-2.5 w-2.5" /> {modes.find((m) => m.id === mode)?.hint}
            </span>
            <span>Enter ↵ to send</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function AIAssistTrigger({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      aria-controls="ai-assist-panel"
      className={cn(
        "fixed z-40 right-4 bottom-4 h-11 px-4 rounded-full",
        "bg-button-lumina text-white text-[13px] font-medium",
        "shadow-[0_10px_30px_-10px_hsl(var(--violet)/0.7)] hover:brightness-110",
        "flex items-center gap-2 transition-all duration-300 ease-fluid",
        open ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100"
      )}
    >
      <Sparkles className="h-4 w-4" />
      AI Assist
      <ChevronDown className="h-3 w-3 -rotate-90 opacity-70" />
    </button>
  );
}

/** Renders a single AI rewrite as a word-level diff with an Apply action. */
function CopyDiffCard({
  before,
  after,
  onApply,
}: {
  before: string;
  after: string;
  onApply: () => void;
}) {
  const tokens = useMemo(() => diffWords(before, after), [before, after]);
  const adds = tokens.filter((t) => t.type === "add").length;
  const dels = tokens.filter((t) => t.type === "del").length;
  return (
    <div className="rounded-lg border border-border bg-surface-1/60 overflow-hidden">
      <div className="px-2 py-1.5 text-[12px] leading-snug font-mono">
        {tokens.map((t, i) => {
          if (t.type === "eq") return <span key={i}>{t.value}</span>;
          if (t.type === "del")
            return (
              <span
                key={i}
                className="bg-magenta/15 text-magenta line-through decoration-magenta/60 rounded px-0.5"
              >
                {t.value}
              </span>
            );
          return (
            <span key={i} className="bg-cyan/15 text-cyan rounded px-0.5">
              {t.value}
            </span>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-2 py-1 border-t border-border bg-surface-1/40">
        <div className="text-[10px] text-muted-foreground tabular-nums inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" /> +{adds}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-magenta" /> −{dels}
          </span>
        </div>
        <button
          onClick={onApply}
          className="text-[11px] px-2 py-0.5 rounded-md bg-button-lumina text-white inline-flex items-center gap-1 hover:brightness-110 transition"
        >
          <Check className="h-3 w-3" /> Apply
        </button>
      </div>
    </div>
  );
}
