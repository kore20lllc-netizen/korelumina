import { useState } from "react";
import { Terminal, MessageSquare, Bug, X, ChevronDown, Sparkles } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { cn } from "@/lib/utils";

type Tab = "console" | "ai" | "problems";

const consoleLines = [
  { t: "12:04:01", level: "info", text: "[vite] dev server running on :5173" },
  { t: "12:04:02", level: "info", text: "[lumina] design tokens hydrated (38 vars)" },
  { t: "12:04:03", level: "info", text: "Ready in 412ms" },
  { t: "12:04:18", level: "warn", text: "Tailwind: unused class 'text-foo' in Hero.tsx" },
  { t: "12:04:22", level: "info", text: "HMR update /src/components/Hero.tsx" },
];

export function BottomDock() {
  const { bottomDockOpen, setBottomDockOpen } = useWorkspace();
  const [tab, setTab] = useState<Tab>("console");
  const [chat, setChat] = useState<{ from: "ai" | "user"; text: string }[]>([
    { from: "ai", text: "I'm your Lumina assistant. Ask me anything about your build." },
  ]);
  const [draft, setDraft] = useState("");

  if (!bottomDockOpen) return null;

  const send = () => {
    if (!draft.trim()) return;
    const next = [...chat, { from: "user" as const, text: draft }];
    setChat(next);
    setDraft("");
    setTimeout(() => {
      setChat((c) => [...c, { from: "ai", text: "Got it — I'll wire that up. (demo response)" }]);
    }, 600);
  };

  const tabs: { id: Tab; label: string; icon: any; badge?: string }[] = [
    { id: "console", label: "Console", icon: Terminal },
    { id: "ai", label: "AI Chat", icon: Sparkles },
    { id: "problems", label: "Problems", icon: Bug, badge: "0" },
  ];

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 h-[40vh] max-h-[460px] glass-strong rounded-3xl flex flex-col overflow-hidden anim-in">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 h-11 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 transition",
                active ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-1"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge && <span className="h-4 px-1 rounded-full text-[9px] bg-surface-2 text-muted-foreground">{t.badge}</span>}
            </button>
          );
        })}
        <div className="flex-1" />
        <button onClick={() => setBottomDockOpen(false)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => setBottomDockOpen(false)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-surface-2">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Body */}
      {tab === "console" && (
        <div className="flex-1 min-h-0 overflow-y-auto font-mono text-[12px] p-4 space-y-1.5">
          {consoleLines.map((l, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-muted-foreground/60 shrink-0">{l.t}</span>
              <span className={cn(
                "uppercase text-[10px] tracking-widest shrink-0 mt-0.5",
                l.level === "warn" ? "text-gold" : "text-cyan"
              )}>{l.level}</span>
              <span className="text-foreground/85">{l.text}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <span className="text-violet">›</span>
            <span className="text-muted-foreground/60">_</span>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {chat.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.from === "user" && "flex-row-reverse")}>
                <div className={cn(
                  "h-7 w-7 rounded-xl grid place-items-center shrink-0 text-[10px] font-semibold",
                  m.from === "ai" ? "bg-button-lumina text-white" : "bg-surface-3 text-foreground"
                )}>
                  {m.from === "ai" ? <Sparkles className="h-3.5 w-3.5" /> : "K"}
                </div>
                <div className={cn(
                  "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                  m.from === "ai"
                    ? "bg-surface-1 border border-border rounded-tl-sm"
                    : "bg-button-lumina text-white rounded-tr-sm shadow-[0_0_24px_-8px_hsl(var(--violet)/0.6)]"
                )}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border p-3 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask the Lumina assistant…"
              className="flex-1 h-10 px-3.5 rounded-xl bg-surface-1 border border-border text-sm outline-none focus:border-violet/50 transition"
            />
            <button onClick={send} className="h-10 px-4 rounded-xl bg-button-lumina text-white text-sm font-medium shadow-[0_0_18px_-4px_hsl(var(--violet)/0.6)]">Send</button>
          </div>
        </div>
      )}

      {tab === "problems" && (
        <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
          <div className="text-center">
            <div className="h-12 w-12 rounded-2xl glass mx-auto grid place-items-center mb-3">
              <Bug className="h-5 w-5 text-cyan" />
            </div>
            No problems detected. Your build looks healthy.
          </div>
        </div>
      )}
    </div>
  );
}