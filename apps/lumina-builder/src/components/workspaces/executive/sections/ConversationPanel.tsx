import { MessageSquareText, Send } from "lucide-react";

import { LuminaFlagshipPanel } from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import { conversation, conversationReplying } from "../design/executiveDesignPreview";
import { ChiefAgentLogo } from "../shared/ChiefAgentLogo";
import { DesignPreviewBadge } from "../shared/ExecutiveSection";

const QUICK_ACTIONS = [
  "Explain a decision",
  "Generate a plan",
  "Summarize activity",
  "Retrieve knowledge",
];

/*
 * The interface doc: conversation is a docked capability and never
 * replaces the dashboard. It sits beside the Chief Agent command deck and
 * takes the deck's height; messages scroll inside it.
 */
export function ConversationPanel() {
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
            <DesignPreviewBadge />
          </div>

          <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {conversation.map((message, index) => (
              <li key={index} className={message.from === "You" ? "ml-8" : "mr-4"}>
                {message.from === "You" ? (
                  <div className="text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300/70">You</div>
                ) : (
                  <ChiefAgentLogo />
                )}
                <div className={`mt-1 rounded-[16px] border px-3.5 py-2.5 text-sm leading-6 ${message.from === "You" ? "border-cyan-300/20 bg-cyan-400/10 text-sky-50" : "border-amber-300/20 bg-slate-950/50 text-sky-100/85"}`}>
                  {message.text}
                </div>
                {"proposal" in message && message.proposal ? (
                  <div className="mt-1.5 font-mono text-[10px] text-emerald-200/70">{message.proposal}</div>
                ) : null}
              </li>
            ))}
            {conversationReplying ? (
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
            ) : null}
          </ol>

          <div className="border-t border-cyan-300/15 px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  disabled
                  title="Not wired yet"
                  className="cursor-not-allowed rounded-full border border-cyan-300/20 px-2.5 py-1 text-[10px] text-sky-200/70 opacity-70"
                >
                  {action}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                disabled
                rows={2}
                placeholder="Ask the Chief Agent…"
                className="[color-scheme:dark] min-h-[52px] flex-1 resize-none rounded-[14px] border border-cyan-300/[0.2] bg-slate-950/[0.42] px-3 py-2.5 text-sm text-sky-100 placeholder:text-slate-500 outline-none disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                title="Not wired yet"
                aria-label="Send"
                className="flex h-[52px] w-[52px] cursor-not-allowed items-center justify-center rounded-[14px] border border-amber-300/30 bg-amber-400/10 text-amber-200 opacity-70"
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
