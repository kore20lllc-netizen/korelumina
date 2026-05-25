import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles, X, Send, Loader2, ChevronDown, Undo2, Redo2, Check,
  BookOpen, Wand2, Code2, MessageSquare, Copy, RefreshCw, Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "explain" | "refactor" | "generate" | "chat";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Code block to render with copy/apply actions. */
  code?: { language: string; value: string };
  /** Side-by-side before/after diff (line-level). */
  diff?: { before: string; after: string };
  /** Per-range side-by-side diffs for multi-cursor refactor preview. */
  rangeDiffs?: {
    items: Array<{
      startLine: number;
      endLine: number;
      before: string;
      after: string;
    }>;
    /** Apply just one range (replaces only that slice in the buffer). */
    onApplyOne: (index: number) => void;
    /** Apply every range (top-down splice). */
    onApplyAll: () => void;
  };
  actions?: Array<{ label: string; onApply: () => void }>;
}

/** A reversible AI Assist action against the active editor buffer. */
interface HistoryEntry {
  id: string;
  label: string;
  mode: Mode;
  before: string;
  after: string;
  at: number;
}

const modes: { id: Mode; label: string; Icon: any; hint: string }[] = [
  { id: "explain", label: "Explain", Icon: BookOpen, hint: "Walk through the active file" },
  { id: "refactor", label: "Refactor", Icon: Wand2, hint: "Rewrite for clarity & style" },
  { id: "generate", label: "Generate", Icon: Code2, hint: "Snippet from a description" },
  { id: "chat", label: "Chat", Icon: MessageSquare, hint: "Ask anything about your code" },
];

// --- Mock generators (UI-only) -------------------------------------------------

function explainCode(code: string, file: string): string {
  const lines = code.split("\n");
  const imports = lines.filter((l) => /^\s*import\s/.test(l));
  const exports = lines.filter((l) => /^\s*export\s/.test(l));
  const fns = lines.filter((l) => /\bfunction\s+\w+|\bconst\s+\w+\s*=\s*\(/.test(l));
  return [
    `**${file}** in a nutshell:`,
    `- ${imports.length} import${imports.length === 1 ? "" : "s"}, ${exports.length} export${exports.length === 1 ? "" : "s"}, ~${fns.length} function-like declaration${fns.length === 1 ? "" : "s"}.`,
    `- Entry: \`${exports[0]?.trim() || "default export"}\`.`,
    `- The component composes children inside a styled \`<main>\`, passing two props (\`title\`, \`subtitle\`) to the Hero.`,
    `- No side effects or hooks here — purely presentational.`,
    ``,
    `Suggestion: extract the inline copy into a typed \`heroProps\` constant for easier i18n later.`,
  ].join("\n");
}

function refactorCode(code: string, brief: string): string {
  // Toy "refactor": pull literals into consts, normalize quotes, add a typed props const.
  const heroMatch = code.match(/title="([^"]+)"\s+subtitle="([^"]+)"/);
  const title = heroMatch?.[1] ?? "Build, alive.";
  const subtitle = heroMatch?.[2] ?? "An AI-native studio.";
  const note = brief ? `// ${brief}\n` : "";
  return `${note}import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";

const heroProps = {
  title: "${title}",
  subtitle: "${subtitle}",
} as const;

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <Hero {...heroProps} />
      <Features />
    </main>
  );
}`;
}

function generateSnippet(brief: string): { language: string; value: string } {
  const b = brief.toLowerCase();
  if (b.includes("hook") || b.includes("usestate") || b.includes("debounce")) {
    return {
      language: "tsx",
      value: `import { useEffect, useState } from "react";

/** Debounce a value by \`delay\` ms. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}`,
    };
  }
  if (b.includes("fetch") || b.includes("api")) {
    return {
      language: "ts",
      value: `export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" }, ...init });
  if (!res.ok) throw new Error(\`\${res.status} \${res.statusText}\`);
  return res.json() as Promise<T>;
}`,
    };
  }
  // Default: a small typed component.
  const name = brief.replace(/[^a-zA-Z]/g, "").slice(0, 20) || "MyComponent";
  const Comp = name[0].toUpperCase() + name.slice(1);
  return {
    language: "tsx",
    value: `interface ${Comp}Props {
  title: string;
  onAction?: () => void;
}

export function ${Comp}({ title, onAction }: ${Comp}Props) {
  return (
    <button
      onClick={onAction}
      className="px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 transition text-sm"
    >
      {title}
    </button>
  );
}`,
  };
}

// --- Line-level diff (LCS) ----------------------------------------------------

type DiffLine = { type: "eq" | "del" | "add"; value: string };
function diffLines(a: string, b: string): DiffLine[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: "eq", value: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: "del", value: A[i++] }); }
    else { out.push({ type: "add", value: B[j++] }); }
  }
  while (i < n) out.push({ type: "del", value: A[i++] });
  while (j < m) out.push({ type: "add", value: B[j++] });
  return out;
}

/**
 * Find the smallest top-level "section" in `code` to refactor when there's no
 * explicit selection. We look for the first export/function/component block and
 * return its line range. Falls back to the whole file.
 */
function detectSection(code: string): { startLine: number; endLine: number; label: string } {
  const lines = code.split("\n");
  // Look for an `export ... function|default function|const X = (...)` declaration.
  const headerRe = /^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function\s+(\w+)|const\s+(\w+)\s*=)/;
  let startIdx = -1;
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(headerRe);
    if (m) { startIdx = i; name = m[1] || m[2] || "section"; break; }
  }
  if (startIdx < 0) {
    return { startLine: 1, endLine: lines.length, label: "whole file" };
  }
  // Find matching closing brace by tracking depth from the first `{` after the header.
  let depth = 0;
  let started = false;
  let endIdx = lines.length - 1;
  for (let i = startIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "{") { depth++; started = true; }
      else if (ch === "}") { depth--; if (started && depth === 0) { endIdx = i; break; } }
    }
    if (started && depth === 0) break;
  }
  return { startLine: startIdx + 1, endLine: endIdx + 1, label: name };
}

// -----------------------------------------------------------------------------

export interface DevAIAssistPanelProps {
  open: boolean;
  onClose: () => void;
  /** Active file name (e.g. "Home.tsx"). */
  activeFile: string;
  /** Current contents of the active editor buffer. */
  activeCode: string;
  /** Ordered list of selections (live + pinned), document order. */
  selections?: Array<{ text: string; startLine: number; endLine: number; pinned?: boolean }>;
  /** Pin the current live selection so the user can add another. */
  onPinSelection?: () => void;
  /** Remove a single selection by index. */
  onRemoveSelection?: (index: number) => void;
  /** Clear every selection. */
  onClearSelections?: () => void;
  /** Apply a new buffer (refactor / replace) — caller wires undo/redo. */
  onReplaceCode: (next: string) => void;
  /** Insert a snippet at the bottom of the buffer. */
  onInsertSnippet: (snippet: string) => void;
}

export function DevAIAssistPanel({
  open, onClose, activeFile, activeCode,
  selections = [], onPinSelection, onRemoveSelection, onClearSelections,
  onReplaceCode, onInsertSnippet,
}: DevAIAssistPanelProps) {
  const [mode, setMode] = useState<Mode>("explain");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "intro", role: "assistant", content: "Hi — I’m your dev copilot. Pick a mode below or ask anything." },
  ]);
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const codeRef = useRef(activeCode);
  useEffect(() => { codeRef.current = activeCode; }, [activeCode]);
  const selectionsRef = useRef(selections);
  useEffect(() => { selectionsRef.current = selections; }, [selections]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open, mode]);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const push = (m: Omit<ChatMsg, "id">) =>
    setMessages((p) => [...p, { ...m, id: Math.random().toString(36).slice(2, 9) }]);

  const runAsHistory = (label: string, nextCode: string) => {
    const before = codeRef.current;
    onReplaceCode(nextCode);
    setPast((p) => [...p, {
      id: Math.random().toString(36).slice(2, 9),
      label, mode, before, after: nextCode, at: Date.now(),
    }]);
    setFuture([]);
  };

  const undo = () => {
    setPast((p) => {
      if (p.length === 0) return p;
      const last = p[p.length - 1];
      onReplaceCode(last.before);
      setFuture((f) => [last, ...f]);
      toast(`Undid: ${last.label}`);
      return p.slice(0, -1);
    });
  };
  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [next, ...rest] = f;
      onReplaceCode(next.after);
      setPast((p) => [...p, next]);
      toast(`Redid: ${next.label}`);
      return rest;
    });
  };

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
    if (!text && mode === "generate") return;
    if (busy) return;

    if (text) push({ role: "user", content: text });
    setInput("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));

    if (mode === "explain") {
      const sels = selectionsRef.current;
      if (sels.length === 0) {
        push({ role: "assistant", content: explainCode(codeRef.current, activeFile) });
      } else if (sels.length === 1) {
        const s = sels[0];
        const focus = text ? ` (focus: ${text})` : "";
        push({
          role: "assistant",
          content:
            `**Selection L${s.startLine}–L${s.endLine}** of \`${activeFile}\`${focus}:\n\n` +
            explainCode(s.text, `${activeFile} · L${s.startLine}–L${s.endLine}`),
          code: { language: "tsx", value: s.text },
        });
      } else {
        const focus = text ? ` (focus: ${text})` : "";
        const header =
          `Explaining **${sels.length} selections** of \`${activeFile}\`${focus}:`;
        const blocks = sels.map((s, i) =>
          `\n\n**[${i + 1}] L${s.startLine}–L${s.endLine}**\n` +
          explainCode(s.text, `${activeFile} · L${s.startLine}–L${s.endLine}`)
        ).join("");
        push({
          role: "assistant",
          content: header + blocks,
          code: { language: "tsx", value: sels.map((s, i) => `// [${i + 1}] L${s.startLine}–L${s.endLine}\n${s.text}`).join("\n\n") },
        });
      }
    } else if (mode === "refactor") {
      const sels = selectionsRef.current;
      if (sels.length > 0) {
        // Build a per-range diff so the user can preview each change side-by-side
        // before applying. Snapshots are captured against the *current* buffer.
        const items = sels.map((s) => ({
          startLine: s.startLine,
          endLine: s.endLine,
          before: s.text,
          after: refactorCode(s.text, text),
        }));

        const ranges = sels.map((s) => `L${s.startLine}–L${s.endLine}`).join(", ");
        const label =
          sels.length === 1
            ? `selection ${ranges}`
            : `${sels.length} selections (${ranges})`;

        // Apply a single range: splice just that slice into the live buffer.
        const applyOne = (index: number) => {
          const item = items[index];
          const lines = codeRef.current.split("\n");
          const next = [
            ...lines.slice(0, item.startLine - 1),
            item.after,
            ...lines.slice(item.endLine),
          ].join("\n");
          runAsHistory(`Refactor L${item.startLine}–L${item.endLine}`, next);
          toast(`Applied range L${item.startLine}–L${item.endLine}`, {
            action: { label: "Undo", onClick: undo },
          });
        };

        // Apply every range, top-down so earlier line indices stay valid.
        const applyAll = () => {
          const ordered = [...items].sort((a, b) => b.startLine - a.startLine);
          let lines = codeRef.current.split("\n");
          for (const it of ordered) {
            lines = [
              ...lines.slice(0, it.startLine - 1),
              it.after,
              ...lines.slice(it.endLine),
            ];
          }
          const next = lines.join("\n");
          runAsHistory(`Refactor ${label}`, next);
          toast("Refactor applied", { action: { label: "Undo", onClick: undo } });
        };

        push({
          role: "assistant",
          content:
            sels.length === 1
              ? `Proposed refactor for **${label}** of \`${activeFile}\` — review the diff and apply.`
              : `Proposed refactor for **${label}** of \`${activeFile}\` — review each range side-by-side, apply individually or all at once.`,
          rangeDiffs: { items, onApplyOne: applyOne, onApplyAll: applyAll },
        });
      } else {
        // No explicit selection — auto-detect the smallest enclosing section
        // (export / function / component) and scope the refactor to it.
        const { startLine, endLine, label } = detectSection(codeRef.current);
        const lines = codeRef.current.split("\n");
        const sectionSrc = lines.slice(startLine - 1, endLine).join("\n");
        const refactored = refactorCode(sectionSrc, text);
        const before = codeRef.current;
        const sectionNext = [
          ...lines.slice(0, startLine - 1),
          refactored,
          ...lines.slice(endLine),
        ].join("\n");
        const wholeNext = refactorCode(codeRef.current, text);
        const isWhole = label === "whole file";
        push({
          role: "assistant",
          content: isWhole
            ? `No selection — refactoring the whole **${activeFile}**.`
            : `No selection — scoped to **${label}** (L${startLine}–L${endLine}) in \`${activeFile}\`. Highlight code first to refactor only that range.`,
          diff: { before, after: sectionNext },
          actions: isWhole
            ? [{
                label: "Apply refactor",
                onApply: () => {
                  runAsHistory(`Refactor: ${activeFile}`, sectionNext);
                  toast("Refactor applied", { action: { label: "Undo", onClick: undo } });
                },
              }]
            : [
                {
                  label: `Apply to ${label}`,
                  onApply: () => {
                    runAsHistory(`Refactor ${label} (L${startLine}–L${endLine})`, sectionNext);
                    toast(`Refactor applied to ${label}`, { action: { label: "Undo", onClick: undo } });
                  },
                },
                {
                  label: "Expand to whole file",
                  onApply: () => {
                    runAsHistory(`Refactor: ${activeFile}`, wholeNext);
                    toast("Refactor applied to whole file", { action: { label: "Undo", onClick: undo } });
                  },
                },
              ],
        });
      }
    } else if (mode === "generate") {
      const snippet = generateSnippet(text);
      push({
        role: "assistant",
        content: `Generated a ${snippet.language} snippet for: **${text}**`,
        code: snippet,
        actions: [
          {
            label: "Insert into file",
            onApply: () => {
              const next = codeRef.current.replace(/\s*$/, "") + "\n\n" + snippet.value + "\n";
              runAsHistory(`Insert snippet: ${text.slice(0, 24)}`, next);
              toast("Snippet inserted", { action: { label: "Undo", onClick: undo } });
            },
          },
          {
            label: "Copy",
            onApply: () => { navigator.clipboard.writeText(snippet.value); toast("Copied to clipboard"); },
          },
        ],
      });
    } else {
      const sels = selectionsRef.current;
      const ctx =
        sels.length === 0
          ? `Looking at \`${activeFile}\`. `
          : sels.length === 1
          ? `Looking at your selection in \`${activeFile}\` (L${sels[0].startLine}–L${sels[0].endLine}, ${sels[0].text.length} chars). `
          : `Looking at ${sels.length} selections in \`${activeFile}\`: ${sels.map((s) => `L${s.startLine}–L${s.endLine}`).join(", ")}. `;
      push({
        role: "assistant",
        content:
          ctx +
          "I’d normally tap into Lovable AI here. For now I can explain, refactor, and generate snippets — pick a mode above to try it out.",
      });
    }
    setBusy(false);
  };

  return (
    <>
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
          "fixed z-50 right-4 bottom-4 w-[min(420px,calc(100vw-2rem))] h-[min(620px,calc(100vh-6rem))]",
          "glass-panel rounded-2xl border border-white/10 shadow-[0_20px_60px_-20px_hsl(var(--cyan)/0.55)]",
          "flex flex-col overflow-hidden transition-all duration-300 ease-fluid origin-bottom-right",
          open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <header className="flex items-center gap-2 px-3.5 h-12 border-b border-border bg-surface-1/40">
          <div className="h-7 w-7 rounded-lg bg-button-lumina grid place-items-center shadow-[0_0_14px_-2px_hsl(var(--cyan)/0.7)]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">AI Assist</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dev copilot · {activeFile || "no file"}</div>
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
              <span className="ml-1 text-[10px] tabular-nums text-muted-foreground/80 px-1">{past.length}</span>
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
                <Icon className={cn("h-3.5 w-3.5", active && "text-cyan")} />
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
                "max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "ml-auto bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--cyan)/0.6)]"
                  : "bg-surface-1 border border-border text-foreground"
              )}
            >
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-surface-2 text-[12px] font-mono">$1</code>'),
                }}
              />
              {m.code && <CodeBlock language={m.code.language} value={m.code.value} />}
              {m.diff && <DiffBlock before={m.diff.before} after={m.diff.after} />}
              {m.rangeDiffs && (
                <RangeDiffsBlock
                  items={m.rangeDiffs.items}
                  onApplyOne={m.rangeDiffs.onApplyOne}
                  onApplyAll={m.rangeDiffs.onApplyAll}
                />
              )}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.actions.map((a, i) => (
                    <button
                      key={i}
                      onClick={a.onApply}
                      className="text-[11px] px-2 py-1 rounded-md bg-button-lumina text-white hover:brightness-110 transition flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="bg-surface-1 border border-border rounded-2xl px-3 py-2 text-[12px] text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-cyan" /> Thinking…
            </div>
          )}
        </div>

        {/* Context strip */}
        <div className="px-3 py-1.5 border-t border-border bg-surface-1/30 text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
          <span>Context:</span>
          <span className="text-foreground font-medium">{activeFile || "none"}</span>
          {selections.length === 0 ? (
            <span className="text-muted-foreground/70">no selection</span>
          ) : (
            <>
              {selections.map((s, i) => (
                <span
                  key={`${s.startLine}-${s.endLine}-${i}`}
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border",
                    s.pinned
                      ? "bg-violet/10 text-violet border-violet/30"
                      : "bg-cyan/10 text-cyan border-cyan/30"
                  )}
                  title={s.pinned ? "Pinned selection" : "Live selection"}
                >
                  <Crosshair className="h-2.5 w-2.5" />
                  L{s.startLine}–L{s.endLine}
                  <span className="opacity-70 tabular-nums">· {s.text.length}c</span>
                  {onRemoveSelection && (
                    <button
                      onClick={() => onRemoveSelection(i)}
                      className="ml-0.5 hover:text-foreground transition"
                      aria-label={`Remove selection L${s.startLine}–L${s.endLine}`}
                      title="Remove"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {onPinSelection && selections.some((s) => !s.pinned) && (
                <button
                  onClick={onPinSelection}
                  className="px-1.5 py-0.5 rounded-md border border-border hover:border-violet/40 hover:text-foreground transition text-[10px]"
                  title="Pin current selection (Alt+P) so you can add another"
                >
                  + Pin
                </button>
              )}
              {selections.length > 1 && onClearSelections && (
                <button
                  onClick={onClearSelections}
                  className="px-1.5 py-0.5 rounded-md hover:bg-surface-2 hover:text-foreground transition text-[10px]"
                  title="Clear all selections"
                >
                  Clear all
                </button>
              )}
            </>
          )}
          <span className="ml-auto tabular-nums">{activeCode.split("\n").length} lines</span>
        </div>

        {/* Composer */}
        <div className="p-2.5 border-t border-border bg-surface-1/40">
          <div className="flex items-end gap-2 rounded-xl bg-surface-1 border border-border focus-within:border-cyan/50 transition px-2 py-1.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              rows={1}
              placeholder={
                mode === "explain"
                  ? "Optional: focus area (Enter to explain)"
                  : mode === "refactor"
                  ? "Optional: refactor goal (e.g. extract props)"
                  : mode === "generate"
                  ? "Describe the snippet you want…"
                  : "Ask anything about your code…"
              }
              className="flex-1 bg-transparent resize-none outline-none text-[13px] py-1.5 px-1 max-h-32 placeholder:text-muted-foreground/60"
            />
            <button
              onClick={submit}
              disabled={busy || (mode === "generate" && !input.trim())}
              className={cn(
                "h-8 w-8 grid place-items-center rounded-lg transition shrink-0",
                "bg-button-lumina text-white shadow-[0_4px_12px_-4px_hsl(var(--cyan)/0.6)]",
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

export function DevAIAssistTrigger({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      aria-controls="dev-ai-assist-panel"
      className={cn(
        "fixed z-40 right-4 bottom-4 h-11 px-4 rounded-full",
        "bg-button-lumina text-white text-[13px] font-medium",
        "shadow-[0_10px_30px_-10px_hsl(var(--cyan)/0.7)] hover:brightness-110",
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

// --- Subcomponents ------------------------------------------------------------

function CodeBlock({ language, value }: { language: string; value: string }) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-background/60 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-surface-1/40 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(value); toast("Copied"); }}
          className="inline-flex items-center gap-1 hover:text-foreground transition"
          aria-label="Copy snippet"
        >
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <pre className="px-3 py-2 text-[12px] leading-5 font-mono overflow-x-auto whitespace-pre">
        {value}
      </pre>
    </div>
  );
}

function DiffBlock({ before, after }: { before: string; after: string }) {
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const adds = lines.filter((l) => l.type === "add").length;
  const dels = lines.filter((l) => l.type === "del").length;
  return (
    <div className="mt-2 rounded-lg border border-border bg-background/60 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-surface-1/40 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Diff</span>
        <span className="inline-flex items-center gap-2 normal-case tracking-normal">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />+{adds}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-magenta" />−{dels}</span>
        </span>
      </div>
      <pre className="text-[12px] leading-5 font-mono overflow-x-auto max-h-64 overflow-y-auto">
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "px-3 whitespace-pre",
              l.type === "add" && "bg-cyan/10 text-cyan",
              l.type === "del" && "bg-magenta/10 text-magenta line-through decoration-magenta/40",
              l.type === "eq" && "text-foreground/70"
            )}
          >
            {l.type === "add" ? "+ " : l.type === "del" ? "- " : "  "}
            {l.value || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}

// Re-export to silence unused-import warnings for icons used only as JSX.
void RefreshCw;
/**
 * Side-by-side multi-range refactor preview. Each range gets its own card
 * with a Before / After two-column view, accurate line numbers, and an
 * "Apply this range" action. A header summarises the total and offers
 * "Apply all".
 */
function RangeDiffsBlock({
  items,
  onApplyOne,
  onApplyAll,
}: {
  items: Array<{ startLine: number; endLine: number; before: string; after: string }>;
  onApplyOne: (index: number) => void;
  onApplyAll: () => void;
}) {
  const totalAdds = useMemo(
    () => items.reduce((n, it) => n + diffLines(it.before, it.after).filter((l) => l.type === "add").length, 0),
    [items]
  );
  const totalDels = useMemo(
    () => items.reduce((n, it) => n + diffLines(it.before, it.after).filter((l) => l.type === "del").length, 0),
    [items]
  );

  return (
    <div className="mt-2 space-y-2">
      {/* Summary header */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-1/40 px-2 py-1.5 text-[11px]">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="font-medium text-foreground">{items.length} range{items.length === 1 ? "" : "s"}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />+{totalAdds}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-magenta" />−{totalDels}</span>
        </div>
        {items.length > 1 && (
          <button
            onClick={onApplyAll}
            className="text-[11px] px-2 py-0.5 rounded-md bg-button-lumina text-white inline-flex items-center gap-1 hover:brightness-110 transition"
          >
            <Check className="h-3 w-3" /> Apply all
          </button>
        )}
      </div>

      {/* Per-range cards */}
      {items.map((it, i) => (
        <SideBySideRangeCard
          key={`${it.startLine}-${it.endLine}-${i}`}
          index={i}
          startLine={it.startLine}
          endLine={it.endLine}
          before={it.before}
          after={it.after}
          onApply={() => onApplyOne(i)}
        />
      ))}
    </div>
  );
}

function SideBySideRangeCard({
  index, startLine, endLine, before, after, onApply,
}: {
  index: number;
  startLine: number;
  endLine: number;
  before: string;
  after: string;
  onApply: () => void;
}) {
  // Compute a paired line view: walk the line-diff, emitting (left, right)
  // tuples so before/after stay vertically aligned across changed regions.
  const tokens = useMemo(() => diffLines(before, after), [before, after]);
  const rows = useMemo(() => {
    const out: Array<{ left: string | null; right: string | null; kind: "eq" | "del" | "add" | "mod" }> = [];
    // Group consecutive del/add into modification blocks for cleaner pairing.
    let i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      if (t.type === "eq") { out.push({ left: t.value, right: t.value, kind: "eq" }); i++; continue; }
      // Collect a block of dels followed by adds (or vice versa).
      const dels: string[] = [];
      const adds: string[] = [];
      while (i < tokens.length && tokens[i].type === "del") { dels.push(tokens[i].value); i++; }
      while (i < tokens.length && tokens[i].type === "add") { adds.push(tokens[i].value); i++; }
      const max = Math.max(dels.length, adds.length);
      for (let k = 0; k < max; k++) {
        const left = dels[k] ?? null;
        const right = adds[k] ?? null;
        const kind: "del" | "add" | "mod" =
          left !== null && right !== null ? "mod" : left !== null ? "del" : "add";
        out.push({ left, right, kind });
      }
    }
    return out;
  }, [tokens]);

  const adds = tokens.filter((t) => t.type === "add").length;
  const dels = tokens.filter((t) => t.type === "del").length;
  const unchanged = adds === 0 && dels === 0;

  // Track left/right line numbers as we render.
  let leftLine = startLine - 1;
  let rightLine = startLine - 1;

  return (
    <div className="rounded-lg border border-border bg-background/60 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-surface-1/40 text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>
          Range <span className="text-foreground">[{index + 1}]</span> · L{startLine}–L{endLine}
        </span>
        <span className="inline-flex items-center gap-2 normal-case tracking-normal">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />+{adds}</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-magenta" />−{dels}</span>
          <button
            onClick={onApply}
            disabled={unchanged}
            className="ml-1 text-[11px] px-2 py-0.5 rounded-md bg-button-lumina text-white inline-flex items-center gap-1 hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={unchanged ? "No changes" : "Apply this range"}
          >
            <Check className="h-3 w-3" /> Apply
          </button>
        </span>
      </div>
      {/* Side-by-side */}
      <div className="grid grid-cols-2 text-[12px] leading-5 font-mono max-h-72 overflow-auto">
        {/* Column headers */}
        <div className="sticky top-0 z-10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-1/60 border-b border-border">Before</div>
        <div className="sticky top-0 z-10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-surface-1/60 border-b border-l border-border">After</div>

        {rows.map((r, i) => {
          if (r.left !== null) leftLine++;
          if (r.right !== null) rightLine++;
          const leftCls = cn(
            "px-2 whitespace-pre min-h-5",
            r.kind === "del" && "bg-magenta/15 text-magenta",
            r.kind === "mod" && "bg-magenta/10 text-magenta",
            r.kind === "add" && "bg-surface-1/30",
            r.kind === "eq" && "text-foreground/70"
          );
          const rightCls = cn(
            "px-2 whitespace-pre min-h-5 border-l border-border",
            r.kind === "add" && "bg-cyan/15 text-cyan",
            r.kind === "mod" && "bg-cyan/10 text-cyan",
            r.kind === "del" && "bg-surface-1/30",
            r.kind === "eq" && "text-foreground/70"
          );
          return (
            <div key={i} className="contents">
              <div className={leftCls}>
                <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none tabular-nums">
                  {r.left !== null ? leftLine : ""}
                </span>
                {r.left ?? " "}
              </div>
              <div className={rightCls}>
                <span className="inline-block w-7 text-right pr-2 text-muted-foreground/60 select-none tabular-nums">
                  {r.right !== null ? rightLine : ""}
                </span>
                {r.right ?? " "}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
