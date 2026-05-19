import { useEffect, useRef, useState } from "react";
import { FileCode2, Loader2, Eye, CheckCircle2, Wand2, ListTree, Columns2, AlignLeft, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { previewDiff, type AuditReport, type DiffPreview, type RepairStep } from "@/services/repoAuditService";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";

interface Props {
  report: AuditReport;
}

/**
 * Step-based diff preview panel. Lists every repair step on the left and
 * renders the mocked `previewDiff()` output for the selected step on the
 * right. Each step caches its diff after the first fetch so switching is
 * instant.
 */
export function StepDiffPanel({ report }: Props) {
  const steps = report.repairPlan;
  const [selectedId, setSelectedId] = useState<string | null>(steps[0]?.id ?? null);
  const [cache, setCache] = useState<Record<string, DiffPreview>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"unified" | "split">("unified");
  const [highlightMode, setHighlightMode] = useState<"normal" | "focus">(() => {
    try { const v = localStorage.getItem("diff-highlight-mode"); return v === "focus" ? "focus" : "normal"; } catch { return "normal"; }
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [changeCursor, setChangeCursor] = useState(0);

  // Persist highlight mode
  useEffect(() => {
    try { localStorage.setItem("diff-highlight-mode", highlightMode); } catch { /* noop */ }
  }, [highlightMode]);

  // Reset cursor when step or view changes
  useEffect(() => { setChangeCursor(0); }, [selectedId, view]);

  const jumpChange = (dir: 1 | -1) => {
    const root = scrollRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-change-row]"));
    if (nodes.length === 0) return;
    const next = (changeCursor + dir + nodes.length) % nodes.length;
    setChangeCursor(next);
    const el = nodes[next];
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const selected = steps.find((s) => s.id === selectedId) ?? null;
  const diff = selectedId ? cache[selectedId] : null;

  useEffect(() => {
    if (!selected) return;
    if (cache[selected.id]) return;
    let active = true;
    setLoadingId(selected.id);
    previewDiff(selected.id, selected.title)
      .then((d) => {
        if (!active) return;
        setCache((prev) => ({ ...prev, [selected.id]: d }));
      })
      .finally(() => {
        if (active) setLoadingId((id) => (id === selected.id ? null : id));
      });
    return () => { active = false; };
  }, [selected, cache]);

  const applyStep = async (step: RepairStep) => {
    setLoadingId(step.id);
    try {
      await new Promise((r) => setTimeout(r, 450));
      setAppliedIds((prev) => new Set(prev).add(step.id));
      toast.success(`Applied · ${step.title}`);
    } finally {
      setLoadingId((id) => (id === step.id ? null : id));
    }
  };

  if (steps.length === 0) {
    return (
      <div className="glass rounded-2xl border border-white/10 p-6 text-center text-muted-foreground text-[13px]">
        No repair steps to preview.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-gold" />
          <div className="font-display font-semibold text-[14px]">Step-by-step Diff Preview</div>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {appliedIds.size}/{steps.length} applied
        </div>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] min-h-[320px]">
        {/* Step list */}
        <ol className="border-r border-white/10 bg-surface-1/40 divide-y divide-white/5 max-h-[520px] overflow-y-auto">
          {steps.map((step, i) => {
            const isActive = step.id === selectedId;
            const isApplied = appliedIds.has(step.id);
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(step.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors",
                    isActive ? "bg-gold/10 border-l-2 border-gold" : "border-l-2 border-transparent hover:bg-surface-2/60",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 grid place-items-center rounded-md bg-gradient-to-br from-violet to-electric text-[10px] text-white font-semibold">{i + 1}</span>
                    <div className={cn("text-[12.5px] font-medium flex-1 truncate", isActive && "text-foreground")}>
                      {step.title}
                    </div>
                    {isApplied && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{step.detail}</div>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Diff viewer */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-surface-1/30">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-[12px] truncate" title={diff?.file}>
                {diff?.file ?? (selected ? "Loading…" : "—")}
              </span>
              {diff?.language && (
                <span className="text-[9.5px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-md border border-border bg-surface-1 text-muted-foreground">
                  {diff.language}
                </span>
              )}
            </div>
            {selected && (
              <div className="flex items-center gap-1.5">
                {diff && (
                  <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-1 p-0.5">
                    <button
                      onClick={() => jumpChange(-1)}
                      className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      title="Previous change"
                      aria-label="Previous change"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => jumpChange(1)}
                      className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2"
                      title="Next change"
                      aria-label="Next change"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {diff && (
                  <div className="inline-flex items-center rounded-md border border-border bg-surface-1 p-0.5">
                    <button
                      onClick={() => setHighlightMode("normal")}
                      className={cn(
                        "h-6 px-2 rounded text-[10.5px]",
                        highlightMode === "normal" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Show all change highlights"
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setHighlightMode("focus")}
                      className={cn(
                        "h-6 px-2 rounded text-[10.5px]",
                        highlightMode === "focus" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                      title="Only highlight the active row"
                    >
                      Focus
                    </button>
                  </div>
                )}
                <div className="inline-flex rounded-md border border-border bg-surface-1 p-0.5">
                  <button
                    onClick={() => setView("unified")}
                    className={cn(
                      "inline-flex items-center gap-1 h-6 px-1.5 rounded text-[10.5px]",
                      view === "unified" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Unified diff"
                  >
                    <AlignLeft className="h-3 w-3" /> Unified
                  </button>
                  <button
                    onClick={() => setView("split")}
                    className={cn(
                      "inline-flex items-center gap-1 h-6 px-1.5 rounded text-[10.5px]",
                      view === "split" ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    title="Side-by-side diff"
                  >
                    <Columns2 className="h-3 w-3" /> Split
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (!diff) return;
                    void navigator.clipboard.writeText(diff.patch).then(
                      () => toast.success("Diff copied"),
                      () => toast.error("Copy failed"),
                    );
                  }}
                  disabled={!diff}
                  className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-border bg-surface-1 text-[11px] hover:bg-surface-2 disabled:opacity-50"
                >
                  <Eye className="h-3 w-3" /> Copy
                </button>
                <LuminaButton
                  size="sm"
                  onClick={() => applyStep(selected)}
                  disabled={loadingId === selected.id || appliedIds.has(selected.id)}
                >
                  {appliedIds.has(selected.id) ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : loadingId === selected.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  {appliedIds.has(selected.id) ? "Applied" : "Apply This Fix"}
                </LuminaButton>
              </div>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto bg-[#0a0a12] p-4">
            {loadingId === selectedId && !diff ? (
              <div className="flex items-center gap-2 text-muted-foreground text-[12px]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading diff…
              </div>
            ) : diff && view === "unified" ? (
              <UnifiedDiff patch={diff.patch} activeIndex={changeCursor} highlightMode={highlightMode} />
            ) : diff ? (
              <SplitDiff patch={diff.patch} activeIndex={changeCursor} highlightMode={highlightMode} />
            ) : (
              <div className="text-muted-foreground text-[12px]">Select a step to preview its diff.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type SplitRow =
  | { kind: "hunk"; text: string }
  | { kind: "pair"; left: string | null; right: string | null; tone: "context" | "change" };

function buildSplitRows(patch: string): SplitRow[] {
  const lines = patch.split("\n");
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("+++") || line.startsWith("---")) { i++; continue; }
    if (line.startsWith("@@")) { rows.push({ kind: "hunk", text: line }); i++; continue; }
    if (line.startsWith("-") || line.startsWith("+")) {
      const removed: string[] = [];
      const added: string[] = [];
      while (i < lines.length && lines[i].startsWith("-") && !lines[i].startsWith("---")) {
        removed.push(lines[i].slice(1));
        i++;
      }
      while (i < lines.length && lines[i].startsWith("+") && !lines[i].startsWith("+++")) {
        added.push(lines[i].slice(1));
        i++;
      }
      const max = Math.max(removed.length, added.length);
      for (let k = 0; k < max; k++) {
        rows.push({
          kind: "pair",
          left: k < removed.length ? removed[k] : null,
          right: k < added.length ? added[k] : null,
          tone: "change",
        });
      }
      continue;
    }
    // context line (starts with space or anything else)
    const text = line.startsWith(" ") ? line.slice(1) : line;
    rows.push({ kind: "pair", left: text, right: text, tone: "context" });
    i++;
  }
  return rows;
}

function SplitDiff({ patch, activeIndex, highlightMode }: { patch: string; activeIndex: number; highlightMode: "normal" | "focus" }) {
  const rows = buildSplitRows(patch);
  // Walk rows and assign line numbers per side. Hunk headers reset the
  // counters using their @@ -a,b +c,d @@ ranges.
  let leftNo = 0;
  let rightNo = 0;
  let changeSeq = 0;
  const numbered = rows.map((row) => {
    if (row.kind === "hunk") {
      const m = /@@\s*-(\d+)(?:,\d+)?\s*\+(\d+)(?:,\d+)?\s*@@/.exec(row.text);
      if (m) { leftNo = parseInt(m[1], 10); rightNo = parseInt(m[2], 10); }
      return { row, leftNum: null as number | null, rightNum: null as number | null, changeIdx: null as number | null };
    }
    const leftNum = row.left !== null ? leftNo++ : null;
    const rightNum = row.right !== null ? rightNo++ : null;
    const changeIdx = row.tone === "change" ? changeSeq++ : null;
    return { row, leftNum, rightNum, changeIdx };
  });
  const inFocus = highlightMode === "focus";
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-px bg-white/5 rounded-md overflow-hidden">
        <div className="col-span-2 bg-[#0a0a12] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-rose-300/70 sticky top-0">Before</div>
        <div className="col-span-2 bg-[#0a0a12] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300/70 sticky top-0">After</div>
        {numbered.map(({ row, leftNum, rightNum, changeIdx }, idx) => {
          if (row.kind === "hunk") {
            return (
              <div key={idx} className="col-span-4 bg-violet/10 text-violet px-2 py-0.5 whitespace-pre">
                {row.text}
              </div>
            );
          }
          const isActive = changeIdx !== null && changeIdx === activeIndex;
          const isChange = row.tone === "change";
          // Row background & border
          const leftCls = isChange && row.left !== null
            ? cn(
                inFocus && !isActive ? "text-muted-foreground/70 bg-surface-1/20" : "text-rose-300 bg-rose-500/5",
                isActive && "bg-rose-500/15 ring-1 ring-inset ring-rose-400/40",
              )
            : row.left === null ? "bg-surface-1/40" : "text-muted-foreground";
          const rightCls = isChange && row.right !== null
            ? cn(
                inFocus && !isActive ? "text-muted-foreground/70 bg-surface-1/20" : "text-emerald-300 bg-emerald-500/5",
                isActive && "bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/40",
              )
            : row.right === null ? "bg-surface-1/40" : "text-muted-foreground";
          // Gutter
          const leftGutterCls = isChange && row.left !== null
            ? cn(
                inFocus && !isActive
                  ? "text-muted-foreground/40 bg-surface-1/20 border-r border-white/5"
                  : "text-rose-300/80 bg-rose-500/10 border-r border-rose-400/30",
                isActive && "bg-rose-500/25 text-rose-200",
              )
            : row.left === null ? "bg-surface-1/40 border-r border-white/5" : "text-muted-foreground/60 bg-surface-1/30 border-r border-white/5";
          const rightGutterCls = isChange && row.right !== null
            ? cn(
                inFocus && !isActive
                  ? "text-muted-foreground/40 bg-surface-1/20 border-r border-white/5"
                  : "text-emerald-300/80 bg-emerald-500/10 border-r border-emerald-400/30",
                isActive && "bg-emerald-500/25 text-emerald-200",
              )
            : row.right === null ? "bg-surface-1/40 border-r border-white/5" : "text-muted-foreground/60 bg-surface-1/30 border-r border-white/5";
          // Intra-line diff tokens
          const showIntra = isChange && row.left !== null && row.right !== null && (!inFocus || isActive);
          const intra = showIntra ? diffTokens(row.left, row.right) : null;
          const leftTokenActive = "bg-rose-500/60 text-white rounded-sm ring-1 ring-rose-300/70 px-0.5";
          const leftTokenNormal = "bg-rose-500/30 text-rose-100 rounded-sm";
          const rightTokenActive = "bg-emerald-500/60 text-white rounded-sm ring-1 ring-emerald-300/70 px-0.5";
          const rightTokenNormal = "bg-emerald-500/30 text-emerald-100 rounded-sm";
          return (
            <div key={idx} className="contents">
              <div
                {...(isChange ? { "data-change-row": "" } : {})}
                className={cn("px-1.5 text-right tabular-nums text-[10.5px] select-none min-h-[1.4em] flex items-center justify-end gap-1 scroll-mt-12 rounded-sm transition-shadow", leftGutterCls)}
              >
                <span className="opacity-70">{leftNum ?? ""}</span>
                <span className="w-2 text-center">
                  {isChange && row.left !== null ? "−" : row.left === null ? " " : " "}
                </span>
              </div>
              <div className={cn("px-2 whitespace-pre min-h-[1.4em]", leftCls)}>
                {row.left === null ? " " : intra
                  ? intra.left.map((seg, i) => (
                      <span
                        key={i}
                        className={cn(
                          seg.changed && (isActive ? leftTokenActive : leftTokenNormal),
                        )}
                      >
                        {seg.text}
                      </span>
                    ))
                  : row.left || " "}
              </div>
              <div className={cn("px-1.5 text-right tabular-nums text-[10.5px] select-none min-h-[1.4em] flex items-center justify-end gap-1", rightGutterCls)}>
                <span className="opacity-70">{rightNum ?? ""}</span>
                <span className="w-2 text-center">
                  {isChange && row.right !== null ? "+" : row.right === null ? " " : " "}
                </span>
              </div>
              <div className={cn("px-2 whitespace-pre min-h-[1.4em]", rightCls)}>
                {row.right === null ? " " : intra
                  ? intra.right.map((seg, i) => (
                      <span
                        key={i}
                        className={cn(
                          seg.changed && (isActive ? rightTokenActive : rightTokenNormal),
                        )}
                      >
                        {seg.text}
                      </span>
                    ))
                  : row.right || " "}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnifiedDiff({ patch, activeIndex, highlightMode }: { patch: string; activeIndex: number; highlightMode: "normal" | "focus" }) {
  const lines = patch.split("\n");
  let changeSeq = 0;
  const numbered = lines.map((line) => {
    const isChange = (line.startsWith("+") && !line.startsWith("+++")) || (line.startsWith("-") && !line.startsWith("---"));
    const changeIdx = isChange ? changeSeq++ : null;
    return { line, changeIdx };
  });
  const inFocus = highlightMode === "focus";
  return (
    <pre className="font-mono text-[12px] leading-relaxed whitespace-pre">
      {numbered.map(({ line, changeIdx }, i) => {
        const isActive = changeIdx !== null && changeIdx === activeIndex;
        const isAdd = line.startsWith("+") && !line.startsWith("+++");
        const isDel = line.startsWith("-") && !line.startsWith("---");
        const isHunk = line.startsWith("@@");
        const isMeta = line.startsWith("+++") || line.startsWith("---");
        const cls = cn(
          isAdd && (inFocus && !isActive ? "text-muted-foreground/50 bg-emerald-500/[0.02]" : "text-emerald-300 bg-emerald-500/5"),
          isDel && (inFocus && !isActive ? "text-muted-foreground/50 bg-rose-500/[0.02]" : "text-rose-300 bg-rose-500/5"),
          isActive && isAdd && "text-emerald-200 bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/30",
          isActive && isDel && "text-rose-200 bg-rose-500/10 ring-1 ring-inset ring-rose-400/30",
          isHunk && "text-violet",
          isMeta && "text-muted-foreground",
        );
        return (
          <div
            key={i}
            {...(isAdd || isDel ? { "data-change-row": "" } : {})}
            className={cn("px-2 scroll-mt-12 rounded-sm", cls)}
          >
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}

type Seg = { text: string; changed: boolean };

/**
 * Token-level LCS diff between two strings. Tokens are runs of word chars,
 * runs of whitespace, or single punctuation chars — enough granularity to
 * highlight just the modified portions of an otherwise-shared line.
 */
function diffTokens(a: string, b: string): { left: Seg[]; right: Seg[] } {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const n = ta.length;
  const m = tb.length;
  // LCS DP table
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = ta[i] === tb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const left: Seg[] = [];
  const right: Seg[] = [];
  let i = 0, j = 0;
  const pushSeg = (arr: Seg[], text: string, changed: boolean) => {
    if (!text) return;
    const last = arr[arr.length - 1];
    if (last && last.changed === changed) last.text += text;
    else arr.push({ text, changed });
  };
  while (i < n && j < m) {
    if (ta[i] === tb[j]) {
      pushSeg(left, ta[i], false);
      pushSeg(right, tb[j], false);
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      pushSeg(left, ta[i], true);
      i++;
    } else {
      pushSeg(right, tb[j], true);
      j++;
    }
  }
  while (i < n) { pushSeg(left, ta[i], true); i++; }
  while (j < m) { pushSeg(right, tb[j], true); j++; }
  return { left, right };
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  const re = /\s+|[A-Za-z0-9_$]+|[^A-Za-z0-9_$\s]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s)) !== null) out.push(match[0]);
  return out;
}