import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Wrench, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { luminaTile } from "@/lib/luminaPalette";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  tool?: { name: string; result: string };
  streaming?: boolean;
}

interface Thread {
  id: string;
  title: string;
  preview: string;
  when: string;
  messages: Message[];
}

const seedThreads: Thread[] = [
  {
    id: "t1",
    title: "Refactor auth middleware",
    preview: "Walk me through the proposed change…",
    when: "Now",
    messages: [
      { id: "m1", role: "user", text: "Walk me through the proposed change to the auth middleware." },
      {
        id: "m2",
        role: "assistant",
        text: "Sure — the new middleware splits session verification from role resolution. I checked the call sites for you.",
        tool: { name: "code.search", result: "12 call sites across 4 files" },
      },
    ],
  },
  {
    id: "t2",
    title: "Pricing page copy",
    preview: "Tighten the Pro tier headline…",
    when: "1h",
    messages: [
      { id: "m1", role: "user", text: "Tighten the Pro tier headline." },
      { id: "m2", role: "assistant", text: "Try: ‘Ship production software, without the production overhead.’ Punchier and on-brand." },
    ],
  },
  {
    id: "t3",
    title: "Migrate to Postgres 16",
    preview: "What breaks if we move from 15 to 16?",
    when: "Yesterday",
    messages: [
      { id: "m1", role: "user", text: "What breaks if we move from 15 to 16?" },
      { id: "m2", role: "assistant", text: "Mostly nothing in your stack — the main risks are deprecated `adminpack` and changed default for `password_encryption`." },
    ],
  },
];

const cannedReplies = [
  "Good question — let me think through this. The cleanest path is to keep your existing API surface and add an adapter layer underneath. That way callers don't change.",
  "Here's a tighter version: shorter sentences, active voice, lead with the outcome. Want me to draft three variants?",
  "I'd start by writing a failing test that captures the expected behavior, then refactor inside the green test. That keeps the diff scoped and reviewable.",
];

export function LumenAI() {
  const [threads, setThreads] = useState<Thread[]>(seedThreads);
  const [activeId, setActiveId] = useState(seedThreads[0].id);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const active = threads.find((t) => t.id === activeId)!;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active.messages.length, busy]);

  const send = () => {
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Message = { id: `m${Date.now()}`, role: "user", text };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId ? { ...t, messages: [...t.messages, userMsg], preview: text } : t,
      ),
    );
    setInput("");
    setBusy(true);

    const reply = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
    const replyId = `m${Date.now() + 1}`;
    // Add empty streaming message
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? { ...t, messages: [...t.messages, { id: replyId, role: "assistant", text: "", streaming: true }] }
          : t,
      ),
    );
    let i = 0;
    const tick = () => {
      i += 2;
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === replyId ? { ...m, text: reply.slice(0, i) } : m,
                ),
              }
            : t,
        ),
      );
      if (i < reply.length) {
        setTimeout(tick, 18);
      } else {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === replyId ? { ...m, streaming: false } : m,
                  ),
                }
              : t,
          ),
        );
        setBusy(false);
      }
    };
    setTimeout(tick, 320);
  };

  const newThread = () => {
    const id = `t${Date.now()}`;
    const t: Thread = { id, title: "New conversation", preview: "Start typing…", when: "Now", messages: [] };
    setThreads((p) => [t, ...p]);
    setActiveId(id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <div className="grid lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-9rem)]">
        {/* Thread list */}
        <aside className="glass-panel rounded-2xl p-3 flex flex-col">
          <button
            onClick={newThread}
            className="h-9 mb-3 rounded-lg bg-button-lumina text-primary-foreground text-[13px] font-medium inline-flex items-center justify-center gap-1.5 shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition"
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </button>
          <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1">
            {threads.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={cn(
                  "w-full text-left rounded-lg p-2.5 transition",
                  activeId === t.id ? "bg-surface-2 border border-white/10" : "hover:bg-surface-1 border border-transparent",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-md grid place-items-center ${luminaTile(i)}`}>
                    <MessageSquare className="w-2.5 h-2.5 text-white" />
                  </span>
                  <span className="text-[13px] font-medium truncate flex-1">{t.title}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{t.when}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{t.preview}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Thread */}
        <section className="glass-panel rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">{active.title}</h2>
              <p className="text-[11px] text-muted-foreground">Lumen · streaming chat with tool calling</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="w-3 h-3" style={{ color: "hsl(265 90% 65%)" }} /> gpt-style
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {active.messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-12">
                Say hello to start the conversation.
              </div>
            )}
            {active.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-button-lumina text-primary-foreground rounded-br-sm"
                      : "bg-surface-1 border border-white/5 rounded-bl-sm",
                  )}
                >
                  {m.tool && (
                    <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground bg-surface-2/70 border border-white/5 rounded-md px-2 py-1">
                      <Wrench className="w-3 h-3" />
                      <span className="font-mono">{m.tool.name}</span>
                      <span className="text-muted-foreground/70">→ {m.tool.result}</span>
                    </div>
                  )}
                  <span>{m.text}</span>
                  {m.streaming && <span className="inline-block w-1.5 h-3.5 align-middle ml-0.5 bg-foreground/70 animate-pulse" />}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-white/5 p-3">
            <div className="flex items-end gap-2 bg-surface-1 border border-white/10 rounded-xl p-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask Lumen anything…"
                rows={1}
                className="flex-1 bg-transparent outline-none text-sm resize-none max-h-32 px-2 py-1.5"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="h-8 w-8 rounded-lg bg-button-lumina text-primary-foreground grid place-items-center shadow-[0_4px_20px_-6px_hsl(255_90%_65%/0.55)] hover:brightness-[1.06] transition disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/80 mt-2 px-1">
              Enter to send · Shift+Enter for newline · Replies are simulated
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}