import { useEffect, useRef, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";

import { LuminaFlagshipPanel } from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import { ChiefAgentLogo } from "../shared/ChiefAgentLogo";
import { DesignPreviewBadge } from "../shared/ExecutiveSection";
import { askExecutiveQuestion, useExecutiveOffice } from "../state/useExecutiveOffice";

const QUICK_ACTIONS = [
  { label: "Explain a decision", prompt: "Explain the reasoning behind the most recent executive decision and the evidence it relied on." },
  { label: "Generate a plan", prompt: "Propose a plan for the next most valuable engineering step, with risks and rollback." },
  { label: "Summarize activity", prompt: "Summarize what changed on the platform since the last learning cycle and what it means." },
  { label: "Retrieve knowledge", prompt: "What does canonical knowledge say about " },
];

type Turn =
  | { kind: "question"; key: string; text: string; at: number }
  | { kind: "answer"; key: string; text: string; at: number; meta: string; metaTone: "approved" | "pending" | "other" }
  | { kind: "unanswered"; key: string; text: string; at: number };

/*
 * The interface doc: conversation is a docked capability and never
 * replaces the dashboard. It sits beside the Chief Agent command deck and
 * takes the deck's height; messages scroll inside it.
 *
 * EW-1: wired. History is the Chief Agent's recorded reasoning; every
 * answer is a proposed decision with an approval addressed to the owner.
 */
export function ConversationPanel() {
  const office = useExecutiveOffice();
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLOListElement>(null);

  const operations = office.operations.status === "ok" ? office.operations.data : null;
  const decisions = new Map((operations?.decisions ?? []).map((decision) => [decision.id, decision]));

  const turns: Turn[] = [];

  for (const record of [...(operations?.reasoning ?? [])].sort((a, b) => a.createdAt - b.createdAt)) {
    const decision = decisions.get(`decision:${record.id}`);
    turns.push({ kind: "question", key: `${record.id}:q`, text: record.question, at: record.createdAt });
    turns.push({
      kind: "answer",
      key: `${record.id}:a`,
      text: record.conclusion,
      at: record.createdAt + 1,
      meta: [
        `Confidence ${record.confidence.toFixed(2)}`,
        `${record.evidence.length} citation${record.evidence.length === 1 ? "" : "s"}`,
        decision ? `${decision.id} · ${decision.status}` : null,
      ].filter(Boolean).join(" · "),
      metaTone: decision?.status === "approved" ? "approved" : decision?.status === "proposed" ? "pending" : "other",
    });
  }

  for (const miss of office.unanswered) {
    turns.push({ kind: "question", key: `miss:${miss.askedAt}:q`, text: miss.question, at: miss.askedAt });
    turns.push({ kind: "unanswered", key: `miss:${miss.askedAt}:a`, text: miss.reason, at: miss.askedAt + 1 });
  }

  turns.sort((left, right) => left.at - right.at);

  const pending = office.pendingQuestion;
  const replying = pending !== null;

  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [turns.length, replying]);

  const send = () => {
    const question = draft.trim();
    if (!question || replying) return;
    setDraft("");
    void askExecutiveQuestion(question);
  };

  return (
    <aside aria-label="Conversation with the Chief Agent" className="relative h-[560px] min-w-0 xl:h-auto">
      <LuminaFlagshipPanel title={null} className="flex h-full flex-col xl:absolute xl:inset-0 [&>div:nth-of-type(3)]:hidden">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-cyan-300/15 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <MessageSquareText className="h-4 w-4 text-cyan-300" />
              <div>
                <div className="text-sm font-semibold text-amber-300">Conversation</div>
                <div className="text-[10px] text-sky-300/60">Every answer is a proposal you can approve</div>
              </div>
            </div>
            <DesignPreviewBadge wiring="live" />
          </div>

          <ol ref={scroller} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {office.operations.status === "loading" ? (
              <li className="text-sm text-sky-300/60">Reading the Chief Agent's conversation…</li>
            ) : null}
            {office.operations.status === "error" ? (
              <li className="rounded-[16px] border border-rose-300/25 bg-rose-400/10 px-3.5 py-2.5 text-sm text-rose-100">
                Conversation unavailable: {office.operations.message}
              </li>
            ) : null}
            {office.operations.status === "ok" && turns.length === 0 && !replying ? (
              <li className="text-sm leading-6 text-sky-300/60">
                No conversation yet. Ask the Chief Agent anything about the platform; it answers from governed knowledge and cites it.
              </li>
            ) : null}

            {turns.map((turn) =>
              turn.kind === "question" ? (
                <li key={turn.key} className="ml-8">
                  <div className="text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">You</div>
                  <div className="mt-1 whitespace-pre-wrap rounded-[16px] border border-cyan-300/20 bg-cyan-400/10 px-3.5 py-2.5 text-sm leading-6 text-sky-50">
                    {turn.text}
                  </div>
                </li>
              ) : turn.kind === "answer" ? (
                <li key={turn.key} className="mr-4">
                  <ChiefAgentLogo />
                  <div className="mt-1 whitespace-pre-wrap rounded-[16px] border border-amber-300/20 bg-slate-950/50 px-3.5 py-2.5 text-sm leading-6 text-sky-100/85">
                    {turn.text}
                  </div>
                  <div className={`mt-1.5 font-mono text-[10px] ${turn.metaTone === "approved" ? "text-emerald-200/70" : turn.metaTone === "pending" ? "text-amber-200/80" : "text-sky-300/60"}`}>
                    {turn.meta}
                  </div>
                </li>
              ) : (
                <li key={turn.key} className="mr-4">
                  <ChiefAgentLogo />
                  <div className="mt-1 rounded-[16px] border border-rose-300/25 bg-rose-400/10 px-3.5 py-2.5 text-sm leading-6 text-rose-100">
                    Not answered. {turn.text}
                  </div>
                </li>
              ),
            )}

            {pending ? (
              <>
                <li className="ml-8">
                  <div className="text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">You</div>
                  <div className="mt-1 whitespace-pre-wrap rounded-[16px] border border-cyan-300/20 bg-cyan-400/10 px-3.5 py-2.5 text-sm leading-6 text-sky-50">
                    {pending.question}
                  </div>
                </li>
                <li className="mr-4" aria-live="polite">
                  <ChiefAgentLogo replying />
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-[16px] border border-amber-300/20 bg-slate-950/50 px-3.5 py-2.5 text-sm text-sky-100/60">
                    Reasoning over governed knowledge
                    <span className="inline-flex gap-1" aria-hidden="true">
                      <span className="h-1 w-1 animate-pulse rounded-full bg-amber-200" />
                      <span className="h-1 w-1 animate-pulse rounded-full bg-amber-200 [animation-delay:200ms]" />
                      <span className="h-1 w-1 animate-pulse rounded-full bg-amber-200 [animation-delay:400ms]" />
                    </span>
                  </div>
                </li>
              </>
            ) : null}
          </ol>

          <div className="border-t border-cyan-300/15 px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  disabled={replying}
                  onClick={() => setDraft(action.prompt)}
                  className="rounded-full border border-cyan-300/20 px-2.5 py-1 text-[10px] text-sky-200/70 transition-colors hover:border-cyan-300/45 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={draft}
                disabled={replying}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder={replying ? "The Chief Agent is replying…" : "Ask the Chief Agent…"}
                className="[color-scheme:dark] min-h-[52px] flex-1 resize-none rounded-[14px] border border-cyan-300/[0.2] bg-slate-950/[0.42] px-3 py-2.5 text-sm text-sky-100 placeholder:text-slate-500 outline-none focus:border-cyan-300/45 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={send}
                disabled={replying || draft.trim().length === 0}
                title={replying ? "The Chief Agent is replying" : "Send (Enter)"}
                aria-label="Send"
                className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] border border-amber-300/30 bg-amber-400/10 text-amber-200 transition-colors hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </LuminaFlagshipPanel>
    </aside>
  );
}
